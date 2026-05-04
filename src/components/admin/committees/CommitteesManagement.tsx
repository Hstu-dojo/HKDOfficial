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
  updateCommitteeApplicationAdmin,
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
  additionalData?: Record<string, any> | null;
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
  const [editCommitteeOpen, setEditCommitteeOpen] = useState(false);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [editCommitteeTitle, setEditCommitteeTitle] = useState('');
  const [editCommitteeYear, setEditCommitteeYear] = useState('');
  const [editCommitteeDescription, setEditCommitteeDescription] = useState('');
  const [editingCommittee, setEditingCommittee] = useState(false);

  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<CommitteeMember | null>(null);
  const [positionTitle, setPositionTitle] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editInstitution, setEditInstitution] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editStatement, setEditStatement] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNid, setEditNid] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);

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
      coordinatorSignatureId: null,
    });

    if (result.success) {
      toast.success('Committee created');
      setFormData({
        title: '',
        year: new Date().getFullYear().toString(),
        description: '',
      });
      setCreateTrainerSigId('');
      await fetchCommittees();
    } else {
      toast.error(result.error || 'Failed to create committee');
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

  const openEditModal = (application: CommitteeMember) => {
    setSelectedApplication(application);
    setEditInstitution(application.institution || '');
    setEditDepartment(application.department || '');
    setEditStatement(application.statement || '');
    setEditPhone(application.additionalData?.phone || '');
    setEditAddress(application.additionalData?.address || '');
    setEditNid(application.additionalData?.nid || '');
    setEditPhotoUrl(application.additionalData?.photoUrl || '');
    setEditModalOpen(true);
  };

  const openCommitteeEdit = (committee: Committee) => {
    setSelectedCommittee(committee);
    setEditCommitteeTitle(committee.title || '');
    setEditCommitteeYear(committee.year || '');
    setEditCommitteeDescription(committee.description || '');
    setEditCommitteeOpen(true);
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

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('File too large. Max 4MB.');
      return;
    }

    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/enrollments/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, type: 'photo', courseId: 'committee' }),
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const result = await res.json();
      setEditPhotoUrl(result.secureUrl);
      toast.success('Photo uploaded');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleUpdateApplication = async () => {
    if (!selectedApplication) return;
    setEditing(true);
    const result = await updateCommitteeApplicationAdmin(selectedApplication.id, {
      institution: editInstitution.trim(),
      department: editDepartment.trim(),
      statement: editStatement.trim(),
      additionalData: {
        phone: editPhone,
        address: editAddress,
        nid: editNid,
      },
      photoUrl: editPhotoUrl || undefined,
    });
    setEditing(false);

    if (result.success) {
      toast.success('Application updated');
      setEditModalOpen(false);
      if (selectedCommitteeId) {
        await fetchApplications(selectedCommitteeId);
      }
    } else {
      toast.error(result.error || 'Failed to update application');
    }
  };

  const handleUpdateCommittee = async () => {
    if (!selectedCommittee) return;
    if (!editCommitteeTitle.trim() || !editCommitteeYear.trim()) {
      toast.error('Title and year are required');
      return;
    }

    setEditingCommittee(true);
    const result = await updateCommittee(selectedCommittee.id, {
      title: editCommitteeTitle.trim(),
      year: editCommitteeYear.trim(),
      description: editCommitteeDescription.trim() || null,
    });
    setEditingCommittee(false);

    if (result.success) {
      toast.success('Committee updated');
      setEditCommitteeOpen(false);
      setSelectedCommittee(null);
      await fetchCommittees();
    } else {
      toast.error(result.error || 'Failed to update committee');
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
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700"
              >
                Create Committee
              </button>
            </form>
          </div>

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
                        openCommitteeEdit(committee);
                      }}
                      className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700"
                    >
                      Edit
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
                                className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700"
                                onClick={() => openEditModal(application)}
                              >
                                Edit
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

      {editCommitteeOpen && selectedCommittee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Committee</h3>
              <p className="text-sm text-gray-500">Update committee details.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  value={editCommitteeTitle}
                  onChange={(e) => setEditCommitteeTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                <input
                  value={editCommitteeYear}
                  onChange={(e) => setEditCommitteeYear(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  value={editCommitteeDescription}
                  onChange={(e) => setEditCommitteeDescription(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditCommitteeOpen(false);
                  setSelectedCommittee(null);
                }}
                className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateCommittee}
                disabled={editingCommittee}
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
              >
                {editingCommittee ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {editModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Application</h3>
              <p className="text-sm text-gray-500">Update details for this applicant.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Institution</label>
                <input
                  value={editInstitution}
                  onChange={(e) => setEditInstitution(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                <input
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">NID</label>
                <input
                  value={editNid}
                  onChange={(e) => setEditNid(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
              <input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statement</label>
              <textarea
                value={editStatement}
                onChange={(e) => setEditStatement(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Photo</label>
              <div className="mt-2 flex items-center gap-4">
                {editPhotoUrl ? (
                  <img src={editPhotoUrl} alt="Applicant" className="h-16 w-16 rounded object-cover border" />
                ) : (
                  <div className="h-16 w-16 rounded border border-dashed flex items-center justify-center text-xs text-gray-400">
                    No Photo
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handlePhotoUpload(file);
                    }
                  }}
                  className="text-sm text-gray-600"
                />
                {photoUploading && <span className="text-xs text-gray-500">Uploading...</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateApplication}
                disabled={editing}
                className="px-4 py-2 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
              >
                {editing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
