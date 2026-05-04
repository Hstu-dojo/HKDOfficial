'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  getCommittees,
  createCommittee,
  setCommitteeActive,
  deleteCommittee,
  getCommitteeMembers,
  approveApplication,
  rejectApplication,
  updateCommittee,
} from '@/actions/committee-actions';
import { getActiveSignatures } from '@/actions/certificate-actions';

interface Committee {
  id: string;
  title: string;
  year: string;
  description?: string | null;
  isActive: boolean;
  trainerSignatureId?: string | null;
  coordinatorSignatureId?: string | null;
  createdAt?: string | Date;
}

interface CommitteeMember {
  id: string;
  committeeId: string;
  status: string;
  positionTitle?: string | null;
  rbacRoleId?: string | null;
  institution?: string | null;
  department?: string | null;
  statement?: string | null;
  createdAt?: string | Date;
  profile?: {
    id?: string;
    fullNameEnglish?: string | null;
    fullNameBangla?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    memberNumber?: string | null;
  } | null;
  user?: {
    id?: string;
    userName?: string | null;
    email?: string | null;
  } | null;
}

interface RoleOption {
  id: string;
  name: string;
  description?: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function CommitteesManagement() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string | null>(null);
  const [applications, setApplications] = useState<CommitteeMember[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [signatureOptions, setSignatureOptions] = useState<RoleOption[]>([]);
  const [exporting, setExporting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    year: new Date().getFullYear().toString(),
    description: '',
  });
  const [createTrainerSigId, setCreateTrainerSigId] = useState('');
  const [createCoordinatorSigId, setCreateCoordinatorSigId] = useState('');
  const [editTrainerSigId, setEditTrainerSigId] = useState('');
  const [editCoordinatorSigId, setEditCoordinatorSigId] = useState('');
  const [updatingSignatures, setUpdatingSignatures] = useState(false);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<CommitteeMember | null>(null);
  const [positionTitle, setPositionTitle] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const fetchCommittees = async () => {
    try {
      setLoading(true);
      const result = await getCommittees();
      if (result.success && result.data) {
        const nextCommittees = result.data as Committee[];
        setCommittees(nextCommittees);
        const hasSelected = nextCommittees.some((c) => c.id === selectedCommitteeId);
        if ((!selectedCommitteeId || !hasSelected) && nextCommittees.length > 0) {
          setSelectedCommitteeId(nextCommittees[0].id);
        }
      } else {
        toast.error(result.error || 'Failed to load committees');
      }
    } catch (error) {
      toast.error('Failed to load committees');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (committeeId: string) => {
    try {
      setApplicationsLoading(true);
      const result = await getCommitteeMembers(committeeId);
      if (result.success && result.data) {
        setApplications(result.data as CommitteeMember[]);
      } else {
        toast.error(result.error || 'Failed to load applications');
      }
    } catch (error) {
      toast.error('Failed to load applications');
      console.error(error);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/rbac/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      setRoles((data.roles || []) as RoleOption[]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load RBAC roles');
    }
  };

  const fetchSignatures = async () => {
    try {
      const result = await getActiveSignatures();
      if (result.success && result.data) {
        setSignatureOptions(result.data as RoleOption[]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load signatures');
    }
  };

  useEffect(() => {
    fetchCommittees();
    fetchRoles();
    fetchSignatures();
  }, []);

  useEffect(() => {
    if (selectedCommitteeId) {
      fetchApplications(selectedCommitteeId);
    }
  }, [selectedCommitteeId]);

  useEffect(() => {
    const selected = committees.find((c) => c.id === selectedCommitteeId);
    setEditTrainerSigId(selected?.trainerSignatureId || '');
    setEditCoordinatorSigId(selected?.coordinatorSignatureId || '');
  }, [committees, selectedCommitteeId]);

  const filteredApplications = useMemo(() => {
    if (!statusFilter) return applications;
    return applications.filter((app) => app.status === statusFilter);
  }, [applications, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };
  }, [applications]);

  const handleCreateCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.year.trim()) {
      toast.error('Title and year are required');
      return;
    }

    const result = await createCommittee({
      title: formData.title.trim(),
      year: formData.year.trim(),
      description: formData.description.trim() || undefined,
      trainerSignatureId: createTrainerSigId || null,
      coordinatorSignatureId: createCoordinatorSigId || null,
    });

    if (result.success) {
      toast.success('Committee created');
      setFormData({
        title: '',
        year: new Date().getFullYear().toString(),
        description: '',
      });
      setCreateTrainerSigId('');
      setCreateCoordinatorSigId('');
      await fetchCommittees();
    } else {
      toast.error(result.error || 'Failed to create committee');
    }
  };

  const handleUpdateSignatures = async () => {
    if (!selectedCommitteeId) return;
    setUpdatingSignatures(true);
    const result = await updateCommittee(selectedCommitteeId, {
      trainerSignatureId: editTrainerSigId || null,
      coordinatorSignatureId: editCoordinatorSigId || null,
    });
    setUpdatingSignatures(false);

    if (result.success) {
      toast.success('Signatures updated');
      await fetchCommittees();
    } else {
      toast.error(result.error || 'Failed to update signatures');
    }
  };

  const handleSetActive = async (committeeId: string) => {
    const result = await setCommitteeActive(committeeId);
    if (result.success) {
      toast.success('Committee is now active');
      await fetchCommittees();
    } else {
      toast.error(result.error || 'Failed to update committee');
    }
  };

  const handleDeleteCommittee = async (committeeId: string) => {
    if (!confirm('Delete this committee? This cannot be undone.')) return;
    const result = await deleteCommittee(committeeId);
    if (result.success) {
      toast.success('Committee deleted');
      await fetchCommittees();
    } else {
      toast.error(result.error || 'Failed to delete committee');
    }
  };

  const openApprovalModal = (application: CommitteeMember) => {
    setSelectedApplication(application);
    setPositionTitle(application.positionTitle || '');
    setSelectedRoleId(application.rbacRoleId || '');
    setApproveModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;
    if (!positionTitle.trim()) {
      toast.error('Position title is required');
      return;
    }

    setApproving(true);
    const result = await approveApplication(selectedApplication.id, positionTitle.trim(), selectedRoleId || null);
    setApproving(false);

    if (result.success) {
      toast.success('Application approved');
      setApproveModalOpen(false);
      setSelectedApplication(null);
      const committeeId = selectedCommitteeId || selectedApplication.committeeId;
      if (committeeId) {
        await fetchApplications(committeeId);
      }
    } else {
      toast.error(result.error || 'Failed to approve');
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!confirm('Reject this application?')) return;
    const result = await rejectApplication(applicationId);
    if (result.success) {
      toast.success('Application rejected');
      if (selectedCommitteeId) {
        await fetchApplications(selectedCommitteeId);
      }
    } else {
      toast.error(result.error || 'Failed to reject');
    }
  };

  const handleExport = async (status?: string) => {
    if (!selectedCommitteeId) return;
    try {
      setExporting(true);
      const params = new URLSearchParams();
      params.append('committeeId', selectedCommitteeId);
      if (status) params.append('status', status);
      const response = await fetch(`/api/admin/committees/export?${params.toString()}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `committee-applications-${status || 'all'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Export completed');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export applications');
    } finally {
      setExporting(false);
    }
  };

  const renderApplicantName = (member: CommitteeMember) => {
    return (
      member.profile?.fullNameEnglish ||
      member.profile?.fullNameBangla ||
      member.user?.userName ||
      '—'
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Committee Management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create yearly committees and review member applications.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={!selectedCommitteeId || exporting}
            onClick={() => handleExport()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create Committee</h2>
            <form onSubmit={handleCreateCommittee} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  placeholder="Executive Committee"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                <input
                  value={formData.year}
                  onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  placeholder="2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trainer Signature</label>
                <select
                  value={createTrainerSigId}
                  onChange={(e) => setCreateTrainerSigId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option value="">Select signature</option>
                  {signatureOptions.map((sig) => (
                    <option key={sig.id} value={sig.id}>
                      {sig.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Coordinator Signature</label>
                <select
                  value={createCoordinatorSigId}
                  onChange={(e) => setCreateCoordinatorSigId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option value="">Select signature</option>
                  {signatureOptions.map((sig) => (
                    <option key={sig.id} value={sig.id}>
                      {sig.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700"
              >
                Create Committee
              </button>
            </form>
          </div>

          {selectedCommitteeId && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">ID Card Signatures</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trainer Signature</label>
                  <select
                    value={editTrainerSigId}
                    onChange={(e) => setEditTrainerSigId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option value="">Select signature</option>
                    {signatureOptions.map((sig) => (
                      <option key={sig.id} value={sig.id}>
                        {sig.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Coordinator Signature</label>
                  <select
                    value={editCoordinatorSigId}
                    onChange={(e) => setEditCoordinatorSigId(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option value="">Select signature</option>
                    {signatureOptions.map((sig) => (
                      <option key={sig.id} value={sig.id}>
                        {sig.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleUpdateSignatures}
                  disabled={updatingSignatures}
                  className="w-full rounded-lg bg-gray-900 text-white py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {updatingSignatures ? 'Updating...' : 'Update Signatures'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Committees</h2>
            <div className="space-y-3">
              {committees.map((committee) => (
                <button
                  key={committee.id}
                  onClick={() => setSelectedCommitteeId(committee.id)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                    selectedCommitteeId === committee.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{committee.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Year {committee.year}</p>
                    </div>
                    {committee.isActive && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
                    )}
                  </div>
                  {committee.description && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{committee.description}</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetActive(committee.id);
                      }}
                      className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      Set Active
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCommittee(committee.id);
                      }}
                      className="text-xs px-2 py-1 rounded bg-red-100 text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Applications</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Review and approve committee members.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['', 'pending', 'approved', 'rejected'].map((status) => (
                  <button
                    key={status || 'all'}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      statusFilter === status
                        ? 'border-blue-500 text-blue-600'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500'
                    }`}
                  >
                    {status ? STATUS_LABELS[status] : 'All'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500">Pending</p>
                <p className="text-xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500">Approved</p>
                <p className="text-xl font-semibold text-green-600">{stats.approved}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500">Rejected</p>
                <p className="text-xl font-semibold text-red-600">{stats.rejected}</p>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              {applicationsLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/40">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Member</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Status</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Position</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          No applications found.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((application) => (
                        <tr key={application.id}>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {renderApplicantName(application)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {application.profile?.email || application.user?.email || '—'}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
                              {STATUS_LABELS[application.status] || application.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {application.positionTitle || '—'}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                className="text-xs px-2 py-1 rounded bg-green-100 text-green-700"
                                onClick={() => openApprovalModal(application)}
                              >
                                Approve
                              </button>
                              <button
                                className="text-xs px-2 py-1 rounded bg-red-100 text-red-700"
                                onClick={() => handleReject(application.id)}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {approveModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Approve Application</h3>
            <p className="text-sm text-gray-500 mt-1">Assign a position and RBAC role.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Position Title</label>
                <input
                  value={positionTitle}
                  onChange={(e) => setPositionTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  placeholder="President"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RBAC Role</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                >
                  <option value="">No Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setApproveModalOpen(false)}
                className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={approving}
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
              >
                {approving ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
