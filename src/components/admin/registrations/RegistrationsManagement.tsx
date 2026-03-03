'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  AcademicCapIcon,
  HeartIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RegistrationUser {
  id: string;
  userName: string;
  email: string;
  userAvatar: string;
  defaultRole: string;
}

interface RegistrationProfile {
  memberNumber: string;
  beltRank: string;
  isActive: boolean;
}

interface Registration {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  emergencyContact: string;
  emergencyPhone: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  parsedNotes: Record<string, any>;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: RegistrationUser | null;
  profile: RegistrationProfile | null;
  partnerName: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof ClockIcon }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: ClockIcon },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-100 dark:bg-red-900/30', icon: XCircleIcon },
};

// ─── Field Definitions (mirrors enroll-form.tsx) ─────────────────────────────

const PROFILE_SECTIONS = [
  {
    title: 'Basic Information',
    icon: UserIcon,
    fields: [
      { key: 'username', label: 'Full Name (English)' },
      { key: 'usernameBn', label: 'নাম (বাংলায়)' },
      { key: 'dob', label: 'Date of Birth', type: 'date' },
      { key: 'nationality', label: 'Nationality' },
      { key: 'religion', label: 'Religion' },
      { key: 'nid', label: 'NID / Birth Cert. / Passport No.' },
      { key: 'sex', label: 'Sex' },
    ],
  },
  {
    title: 'Contact Details',
    icon: PhoneIcon,
    fields: [
      { key: 'address', label: 'Present Address' },
      { key: 'permanentAddress', label: 'Permanent Address' },
      { key: 'zipCode', label: 'Zip Code' },
      { key: 'phone', label: 'Phone Number' },
      { key: 'email', label: 'Email' },
    ],
  },
  {
    title: 'Emergency Contact',
    icon: HeartIcon,
    fields: [
      { key: 'emergencyContact', label: 'Contact Person Name' },
      { key: 'emergencyPhone', label: 'Contact Phone' },
      { key: 'emergencyRelation', label: 'Relationship' },
    ],
  },
  {
    title: 'Student Details',
    icon: AcademicCapIcon,
    fields: [
      { key: 'occupation', label: 'Occupation' },
      { key: 'institute', label: 'Institute' },
      { key: 'faculty', label: 'Faculty' },
      { key: 'dept', label: 'Department' },
      { key: 'levelClass', label: 'Level / Class' },
      { key: 'rollId', label: 'Student ID / Roll No.' },
      { key: 'session', label: 'Session' },
    ],
  },
  {
    title: 'Family Information',
    icon: UserGroupIcon,
    fields: [
      { key: 'fatherName', label: "Father's Name" },
      { key: 'fatherOccupation', label: "Father's Occupation" },
      { key: 'motherName', label: "Mother's Name" },
      { key: 'motherOccupation', label: "Mother's Occupation" },
    ],
  },
  {
    title: 'Physical Details',
    icon: IdentificationIcon,
    fields: [
      { key: 'age', label: 'Age' },
      { key: 'height', label: 'Height' },
      { key: 'weight', label: 'Weight' },
      { key: 'bloodGroup', label: 'Blood Group' },
      { key: 'bmi', label: 'BMI' },
    ],
  },
  {
    title: 'Activities & Motive',
    icon: MapPinIcon,
    fields: [
      { key: 'activitiesShort', label: 'Activities (Short)' },
      { key: 'activitiesDetail', label: 'Activities (Detailed)' },
      { key: 'motive', label: 'Motive for Training' },
    ],
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RegistrationsManagement() {
  const { hasPermission, hasRole } = useRBAC();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const PAGE_SIZE = 20;

  const canRead = hasPermission('MEMBER', 'READ');
  const canUpdate = hasPermission('MEMBER', 'UPDATE');
  const canApprove = hasPermission('MEMBER', 'APPROVE') || hasRole('SUPER_ADMIN') || hasRole('ADMIN');
  const isSuperAdmin = hasRole('SUPER_ADMIN');

  const fetchRegistrations = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      const res = await fetch(`/api/admin/registrations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.registrations);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    if (canRead) fetchRegistrations();
    else setLoading(false);
  }, [canRead, fetchRegistrations]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    fetchRegistrations(page);
  };

  const openDetail = (reg: Registration) => {
    setSelectedRegistration(reg);
    setEditData({ ...reg.parsedNotes });
    setIsEditing(false);
    setShowDetailModal(true);
  };

  const handleStatusChange = async (regId: string, newStatus: string) => {
    if (!canApprove && !canUpdate) return;
    if (!confirm(`Change status to "${newStatus}"?`)) return;

    try {
      const res = await fetch(`/api/admin/registrations/${regId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchRegistrations();
        if (selectedRegistration?.id === regId) {
          setSelectedRegistration((prev) =>
            prev ? { ...prev, status: newStatus as any } : null
          );
        }
      }
    } catch (error) {
      console.error('Status change failed:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRegistration || !canUpdate) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/registrations/${selectedRegistration.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formData: editData }),
        }
      );
      if (res.ok) {
        setIsEditing(false);
        await fetchRegistrations();
        // Refresh the selected registration
        const detailRes = await fetch(
          `/api/admin/registrations/${selectedRegistration.id}`
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setSelectedRegistration({
            ...detail,
            user: selectedRegistration.user,
          });
          setEditData({ ...detail.parsedNotes });
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────

  const stats = {
    total: pagination?.total ?? registrations.length,
    pending: registrations.filter((r) => r.status === 'pending').length,
    approved: registrations.filter((r) => r.status === 'approved').length,
    rejected: registrations.filter((r) => r.status === 'rejected').length,
  };

  // ─── Permission guard ─────────────────────────────────────────────────────

  if (!canRead) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <h3 className="font-medium text-red-800 dark:text-red-300">Access Denied</h3>
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            You don&apos;t have permission to view member registrations.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Member Registrations
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View and manage member onboarding registrations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' },
          { label: 'Pending', value: stats.pending, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' },
          { label: 'Approved', value: stats.approved, color: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-white dark:bg-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} inline-block rounded-full px-3 py-1 mt-1`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            className="w-full rounded-lg border pl-10 pr-4 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <select
            className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Member
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Member ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Contact
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Submitted
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No registrations found.
                </td>
              </tr>
            ) : (
              registrations.map((reg) => {
                const statusCfg = STATUS_CONFIG[reg.status] || STATUS_CONFIG.pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <tr
                    key={reg.id}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => openDetail(reg)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                          {reg.user?.userAvatar ? (
                            <img
                              src={reg.user.userAvatar}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {reg.firstName} {reg.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {reg.parsedNotes?.usernameBn || ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {reg.profile ? (
                        <div>
                          <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                            {reg.profile.memberNumber}
                          </p>
                          {reg.partnerName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{reg.partnerName}</p>
                          )}
                          <span className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            reg.profile.isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {reg.profile.beltRank || 'white'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 italic">No profile</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{reg.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{reg.phoneNumber}</p>
                    </td>
                    <td className="px-4 py-3">
                      {reg.user?.defaultRole && (
                        <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
                          {reg.user.defaultRole}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(reg.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openDetail(reg)}
                          className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-600"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        {canApprove && reg.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(reg.id, 'approved')}
                              className="rounded p-1 hover:bg-green-100 dark:hover:bg-green-900/20"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </button>
                            <button
                              onClick={() => handleStatusChange(reg.id, 'rejected')}
                              className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/20"
                              title="Reject"
                            >
                              <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border bg-white dark:bg-gray-800 px-4 py-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} registrations
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`rounded px-3 py-1 text-sm font-medium ${
                  p === pagination.page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Detail / Edit Modal */}
      {showDetailModal && selectedRegistration && (
        <DetailModal
          registration={selectedRegistration}
          isEditing={isEditing}
          editData={editData}
          setEditData={setEditData}
          saving={saving}
          canUpdate={canUpdate}
          canApprove={canApprove}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedRegistration(null);
            setIsEditing(false);
          }}
          onEdit={() => setIsEditing(true)}
          onCancelEdit={() => {
            setIsEditing(false);
            setEditData({ ...selectedRegistration.parsedNotes });
          }}
          onSave={handleSaveEdit}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

// ─── Detail Modal ────────────────────────────────────────────────────────────

function DetailModal({
  registration,
  isEditing,
  editData,
  setEditData,
  saving,
  canUpdate,
  canApprove,
  onClose,
  onEdit,
  onCancelEdit,
  onSave,
  onStatusChange,
}: {
  registration: Registration;
  isEditing: boolean;
  editData: Record<string, any>;
  setEditData: (data: Record<string, any>) => void;
  saving: boolean;
  canUpdate: boolean;
  canApprove: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[registration.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const notes = registration.parsedNotes;

  const updateField = (key: string, value: string | number) => {
    setEditData({ ...editData, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12">
      <div className="w-full max-w-4xl rounded-xl bg-white dark:bg-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
              {registration.user?.userAvatar ? (
                <img
                  src={registration.user.userAvatar}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {registration.firstName} {registration.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {statusCfg.label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Submitted {new Date(registration.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && canUpdate && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <PencilIcon className="h-4 w-4" /> Edit
              </button>
            )}
            {isEditing && (
              <>
                <button
                  onClick={onCancelEdit}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-6">
          {/* Status actions */}
          {canApprove && registration.status === 'pending' && (
            <div className="flex gap-3 rounded-lg border border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-4">
              <ClockIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  This registration is pending review.
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onStatusChange(registration.id, 'approved')}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onStatusChange(registration.id, 'rejected')}
                    className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Profile sections */}
          {PROFILE_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const hasData = section.fields.some((f) => notes[f.key]);
            if (!hasData && !isEditing) return null;

            return (
              <div key={section.title} className="space-y-3">
                <div className="flex items-center gap-2">
                  <SectionIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {section.title}
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {section.fields.map((field) => {
                    const value = isEditing ? editData[field.key] : notes[field.key];
                    if (!isEditing && !value && value !== 0) return null;

                    return (
                      <div key={field.key} className="rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 p-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {field.label}
                        </p>
                        {isEditing ? (
                          field.key === 'address' ||
                          field.key === 'permanentAddress' ||
                          field.key === 'motive' ||
                          field.key === 'activitiesDetail' ? (
                            <textarea
                              className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              rows={2}
                              value={editData[field.key] || ''}
                              onChange={(e) => updateField(field.key, e.target.value)}
                            />
                          ) : field.key === 'sex' ? (
                            <select
                              className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              value={editData[field.key] || ''}
                              onChange={(e) => updateField(field.key, e.target.value)}
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : field.key === 'bloodGroup' ? (
                            <select
                              className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              value={editData[field.key] || ''}
                              onChange={(e) => updateField(field.key, e.target.value)}
                            >
                              <option value="">Select</option>
                              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                                <option key={bg} value={bg}>{bg}</option>
                              ))}
                            </select>
                          ) : field.key === 'age' || field.key === 'height' || field.key === 'weight' ? (
                            <input
                              type="number"
                              className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              value={editData[field.key] || ''}
                              onChange={(e) => updateField(field.key, field.key === 'age' || field.key === 'height' || field.key === 'weight' ? Number(e.target.value) : e.target.value)}
                            />
                          ) : field.type === 'date' ? (
                            <input
                              type="date"
                              className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              value={editData[field.key] || ''}
                              onChange={(e) => updateField(field.key, e.target.value)}
                            />
                          ) : (
                            <input
                              type="text"
                              className="w-full rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                              value={editData[field.key] || ''}
                              onChange={(e) => updateField(field.key, e.target.value)}
                            />
                          )
                        ) : (
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {String(value)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Meta Information */}
          <div className="space-y-3 border-t pt-4 dark:border-gray-700">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              System Information
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Registration ID</p>
                <p className="text-xs font-mono text-gray-700 dark:text-gray-300 mt-1">{registration.id}</p>
              </div>
              <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">User Account</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                  {registration.user?.userName || 'N/A'} ({registration.user?.email || 'N/A'})
                </p>
              </div>
              <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Created At</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {new Date(registration.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Updated</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {new Date(registration.updatedAt).toLocaleString()}
                </p>
              </div>
              {registration.reviewedAt && (
                <div className="rounded-lg border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Reviewed At</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                    {new Date(registration.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
