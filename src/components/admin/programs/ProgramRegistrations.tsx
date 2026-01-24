'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRBAC } from '@/hooks/useRBAC';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  IdentificationIcon,
  AcademicCapIcon,
  XMarkIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { getProgramRegistrations, updateRegistrationStatus, updateRegistration, deleteRegistration } from '@/actions/program-actions';
import { format } from 'date-fns';

// Types
interface RegistrationWithProfile {
  id: string;
  programId: string;
  userId: string;
  registrationNumber?: string;
  feeAmount: number;
  currency: string;
  paymentMethod?: string;
  transactionId?: string;
  paymentProofUrl?: string;
  paymentSubmittedAt?: Date;
  status: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  program?: {
    id: string;
    title: string;
    slug: string;
    type: string;
    startDate?: Date;
    endDate?: Date;
    location?: string;
    fee: number;
  };
  user?: {
    id: string;
    email?: string;
    userName: string;
    userAvatar?: string;
    account?: {
      name: string;
      nameBangla?: string;
      fatherName?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      country?: string;
      postalCode?: string;
      dob?: Date;
      age?: number;
      sex?: string;
      bloodGroup?: string;
      occupation?: string;
      institute?: string;
      identityType?: string;
      identityNumber?: string;
      image?: string;
    };
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_payment: { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  payment_submitted: { label: 'Payment Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  approved: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const STATUS_OPTIONS = [
  { value: 'pending_payment', label: 'Pending Payment' },
  { value: 'payment_submitted', label: 'Payment Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function ProgramRegistrations() {
  const searchParams = useSearchParams();
  const programIdParam = searchParams?.get('programId');

  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [registrations, setRegistrations] = useState<RegistrationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithProfile | null>(null);
  const [editingRegistration, setEditingRegistration] = useState<RegistrationWithProfile | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [exporting, setExporting] = useState(false);

  const canApprove = hasPermission('PROGRAM_REGISTRATION', 'APPROVE');
  const canDelete = hasPermission('PROGRAM_REGISTRATION', 'DELETE');
  
  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getProgramRegistrations(programIdParam || undefined);
      if (result.success && result.data) {
        setRegistrations(result.data as any);
      } else {
        toast.error('Failed to load registrations');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  }, [programIdParam]);

  useEffect(() => {
    if (!rbacLoading) {
      fetchRegistrations();
    }
  }, [rbacLoading, fetchRegistrations]);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected' | 'pending_payment' | 'payment_submitted') => {
    if (!confirm(`Are you sure you want to change this registration status to ${status.replace('_', ' ')}?`)) return;

    try {
      const result = await updateRegistrationStatus(id, status);
      if (result.success) {
        toast.success(`Registration status changed to ${status.replace('_', ' ')}`);
        fetchRegistrations();
        setSelectedRegistration(null);
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to DELETE this registration? This action cannot be undone.')) return;

    try {
      const result = await deleteRegistration(id);
      if (result.success) {
        toast.success('Registration deleted successfully');
        fetchRegistrations();
        setSelectedRegistration(null);
      } else {
        toast.error(result.error || 'Failed to delete registration');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while deleting');
    }
  };

  const handleUpdateRegistration = async (id: string, data: { status?: string; transactionId?: string; paymentMethod?: string; notes?: string; rejectionReason?: string }) => {
    try {
      const result = await updateRegistration(id, data);
      if (result.success) {
        toast.success('Registration updated successfully');
        fetchRegistrations();
        setEditingRegistration(null);
        setSelectedRegistration(null);
      } else {
        toast.error('Failed to update registration');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const handleExport = async (filterStatus?: string) => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (programIdParam) params.append('programId', programIdParam);
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await fetch(`/api/admin/programs/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `program-registrations-${filterStatus || 'all'}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Export completed successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export registrations');
    } finally {
      setExporting(false);
    }
  };

  const filteredRegistrations = statusFilter 
    ? registrations.filter(r => r.status === statusFilter)
    : registrations;

  // Stats
  const stats = {
    total: registrations.length,
    pending_payment: registrations.filter(r => r.status === 'pending_payment').length,
    payment_submitted: registrations.filter(r => r.status === 'payment_submitted').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
  };

  const statusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending_payment;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (rbacLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Registrations</h1>
          <p className="mt-1 text-sm text-gray-500">
             {programIdParam 
               ? `Viewing registrations for selected program` 
               : 'Viewing all program registrations'}
          </p>
        </div>
        
        {/* Export Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              disabled={exporting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport()}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
              >
                All Registrations
              </button>
              <button
                onClick={() => handleExport('approved')}
                className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50"
              >
                Approved Only
              </button>
              <button
                onClick={() => handleExport('pending_payment')}
                className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
              >
                Pending Only
              </button>
              <button
                onClick={() => handleExport('rejected')}
                className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 rounded-b-lg"
              >
                Rejected Only
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-lg border text-left transition-all ${
            statusFilter === '' ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">All</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </button>
        <button
          onClick={() => setStatusFilter('pending_payment')}
          className={`p-4 rounded-lg border text-left transition-all ${
            statusFilter === 'pending_payment' ? 'ring-2 ring-yellow-500 border-yellow-500' : 'hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-semibold text-yellow-600">{stats.pending_payment}</p>
        </button>
        <button
          onClick={() => setStatusFilter('payment_submitted')}
          className={`p-4 rounded-lg border text-left transition-all ${
            statusFilter === 'payment_submitted' ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">Submitted</p>
          <p className="text-2xl font-semibold text-blue-600">{stats.payment_submitted}</p>
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-lg border text-left transition-all ${
            statusFilter === 'approved' ? 'ring-2 ring-green-500 border-green-500' : 'hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-semibold text-green-600">{stats.approved}</p>
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-lg border text-left transition-all ${
            statusFilter === 'rejected' ? 'ring-2 ring-red-500 border-red-500' : 'hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-semibold text-red-600">{stats.rejected}</p>
        </button>
      </div>

      {/* Registrations Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                       <div className="flex-shrink-0 h-10 w-10">
                         {reg.user?.account?.image || reg.user?.userAvatar ? (
                           <img 
                             className="h-10 w-10 rounded-full object-cover" 
                             src={reg.user?.account?.image || reg.user?.userAvatar} 
                             alt="" 
                           />
                         ) : (
                           <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                             <UserIcon className="h-5 w-5 text-gray-500" />
                           </div>
                         )}
                       </div>
                       <div className="ml-3">
                         <div className="text-sm font-medium text-gray-900">
                           {reg.user?.account?.name || reg.user?.userName || 'Unknown'}
                         </div>
                         {reg.user?.account?.nameBangla && (
                           <div className="text-sm text-gray-500">{reg.user.account.nameBangla}</div>
                         )}
                         <div className="text-xs text-gray-400">{reg.user?.email}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{reg.user?.account?.phone || 'N/A'}</div>
                    <div className="text-xs text-gray-500">{reg.user?.account?.city || ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{reg.program?.title}</div>
                    <div className="text-xs text-gray-500">
                      {reg.program?.type?.replace('_', ' ')}
                      {reg.program?.startDate && ` • ${format(new Date(reg.program.startDate), 'MMM d, yyyy')}`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{reg.registrationNumber || '-'}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(reg.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{reg.feeAmount} {reg.currency}</div>
                    {reg.transactionId && (
                      <div className="text-xs text-gray-500 font-mono">Trx: {reg.transactionId}</div>
                    )}
                    {reg.paymentProofUrl && (
                      <button 
                        onClick={() => setSelectedImage(reg.paymentProofUrl!)}
                        className="mt-1 flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        <PhotoIcon className="h-3 w-3 mr-1" />
                        View Proof
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {statusBadge(reg.status)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setSelectedRegistration(reg)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      {canApprove && (
                        <>
                          <button
                            onClick={() => setEditingRegistration(reg)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="Edit Registration"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          {reg.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusUpdate(reg.id, 'approved')}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                          {reg.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusUpdate(reg.id, 'rejected')}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          )}
                        </>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(reg.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Delete Registration"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p>No registrations found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Proof Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" 
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-3xl max-h-screen">
            <img src={selectedImage} alt="Payment Proof" className="max-w-full max-h-[90vh] rounded" />
            <button 
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1"
              onClick={() => setSelectedImage(null)}
            >
              <XCircleIcon className="h-8 w-8" />
            </button>
          </div>
        </div>
      )}

      {/* Registration Detail Modal */}
      {selectedRegistration && (
        <RegistrationDetailModal 
          registration={selectedRegistration} 
          onClose={() => setSelectedRegistration(null)}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDelete}
          onEdit={() => {
            setEditingRegistration(selectedRegistration);
            setSelectedRegistration(null);
          }}
          canApprove={canApprove}
          canDelete={canDelete}
        />
      )}

      {/* Edit Registration Modal */}
      {editingRegistration && (
        <EditRegistrationModal
          registration={editingRegistration}
          onClose={() => setEditingRegistration(null)}
          onSave={handleUpdateRegistration}
        />
      )}
    </div>
  );
}

// Edit Registration Modal Component
function EditRegistrationModal({
  registration,
  onClose,
  onSave,
}: {
  registration: RegistrationWithProfile;
  onClose: () => void;
  onSave: (id: string, data: { status?: string; transactionId?: string; paymentMethod?: string; notes?: string; rejectionReason?: string }) => void;
}) {
  const [formData, setFormData] = useState({
    status: registration.status || 'pending_payment',
    transactionId: registration.transactionId || '',
    paymentMethod: registration.paymentMethod || '',
    notes: registration.notes || '',
    rejectionReason: registration.rejectionReason || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(registration.id, formData);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full">
          <div className="border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Edit Registration</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending_payment">Pending Payment</option>
                <option value="payment_submitted">Payment Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select method</option>
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="rocket">Rocket</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <input
                type="text"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter transaction ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Add notes about this registration"
              />
            </div>

            {formData.status === 'rejected' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                <textarea
                  value={formData.rejectionReason}
                  onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Reason for rejection"
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Detail Modal Component
function RegistrationDetailModal({ 
  registration, 
  onClose, 
  onStatusUpdate,
  onDelete,
  onEdit,
  canApprove,
  canDelete
}: { 
  registration: RegistrationWithProfile; 
  onClose: () => void;
  onStatusUpdate: (id: string, status: 'approved' | 'rejected' | 'pending_payment' | 'payment_submitted') => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  canApprove: boolean;
  canDelete: boolean;
}) {
  const account = registration.user?.account;
  const user = registration.user;
  const program = registration.program;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Registration Details</h2>
              <p className="text-sm text-gray-500">
                {registration.registrationNumber || `ID: ${registration.id.slice(0, 8)}...`}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded-lg ${STATUS_CONFIG[registration.status]?.bgColor || 'bg-gray-100'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className={`text-lg font-bold ${STATUS_CONFIG[registration.status]?.color || 'text-gray-700'}`}>
                    {STATUS_CONFIG[registration.status]?.label || registration.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canApprove && (
                    <>
                      <button
                        onClick={onEdit}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                      >
                        <PencilSquareIcon className="h-4 w-4" /> Edit
                      </button>
                      {registration.status !== 'approved' && (
                        <button
                          onClick={() => onStatusUpdate(registration.id, 'approved')}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                        >
                          <CheckCircleIcon className="h-4 w-4" /> Approve
                        </button>
                      )}
                      {registration.status !== 'rejected' && (
                        <button
                          onClick={() => onStatusUpdate(registration.id, 'rejected')}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 text-sm"
                        >
                          <XCircleIcon className="h-4 w-4" /> Reject
                        </button>
                      )}
                      {(registration.status === 'approved' || registration.status === 'rejected') && (
                        <button
                          onClick={() => onStatusUpdate(registration.id, 'pending_payment')}
                          className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2 text-sm"
                        >
                          <ClockIcon className="h-4 w-4" /> Reset to Pending
                        </button>
                      )}
                    </>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(registration.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-2 text-sm"
                    >
                      <TrashIcon className="h-4 w-4" /> Delete
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Participant Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" /> Participant Information
                </h3>
                
                <div className="flex items-start gap-4">
                  {account?.image || user?.userAvatar ? (
                    <img 
                      src={account?.image || user?.userAvatar} 
                      alt="" 
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{account?.name || user?.userName || 'N/A'}</p>
                    {account?.nameBangla && <p className="text-gray-600">{account.nameBangla}</p>}
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <DetailItem icon={PhoneIcon} label="Phone" value={account?.phone} />
                  <DetailItem icon={CalendarIcon} label="Date of Birth" value={account?.dob ? format(new Date(account.dob), 'MMM d, yyyy') : undefined} />
                  <DetailItem label="Age" value={account?.age ? `${account.age} years` : undefined} />
                  <DetailItem label="Gender" value={account?.sex} />
                  <DetailItem label="Blood Group" value={account?.bloodGroup} />
                  <DetailItem label="Occupation" value={account?.occupation} />
                </div>

                {account?.address && (
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <MapPinIcon className="h-4 w-4" /> Address
                    </div>
                    <p className="text-gray-900">
                      {account.address}
                      {account.city && `, ${account.city}`}
                      {account.state && `, ${account.state}`}
                      {account.country && `, ${account.country}`}
                      {account.postalCode && ` - ${account.postalCode}`}
                    </p>
                  </div>
                )}

                {(account?.identityType || account?.identityNumber) && (
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <IdentificationIcon className="h-4 w-4" /> Identity
                    </div>
                    <p className="text-gray-900">
                      {account?.identityType}: {account?.identityNumber}
                    </p>
                  </div>
                )}

                {account?.institute && (
                  <div className="text-sm">
                    <div className="flex items-center gap-1 text-gray-500 mb-1">
                      <AcademicCapIcon className="h-4 w-4" /> Institution
                    </div>
                    <p className="text-gray-900">{account.institute}</p>
                  </div>
                )}
              </div>

              {/* Program & Payment Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Program Details</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-900">{program?.title}</p>
                  <p className="text-sm text-gray-500">{program?.type?.replace('_', ' ')}</p>
                  {program?.startDate && (
                    <p className="text-sm text-gray-600 mt-1">
                      Date: {format(new Date(program.startDate), 'MMMM d, yyyy')}
                      {program?.endDate && ` - ${format(new Date(program.endDate), 'MMMM d, yyyy')}`}
                    </p>
                  )}
                  {program?.location && (
                    <p className="text-sm text-gray-600">Location: {program.location}</p>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Payment Information</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fee Amount</span>
                    <span className="font-semibold">{registration.feeAmount} {registration.currency}</span>
                  </div>
                  {registration.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Method</span>
                      <span className="capitalize">{registration.paymentMethod}</span>
                    </div>
                  )}
                  {registration.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Transaction ID</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{registration.transactionId}</span>
                    </div>
                  )}
                  {registration.paymentSubmittedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Submitted</span>
                      <span>{format(new Date(registration.paymentSubmittedAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                </div>

                {registration.paymentProofUrl && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Payment Proof</p>
                    <img 
                      src={registration.paymentProofUrl} 
                      alt="Payment Proof" 
                      className="w-full rounded-lg border cursor-pointer hover:opacity-90"
                      onClick={() => window.open(registration.paymentProofUrl, '_blank')}
                    />
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Registration Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Registered At</span>
                    <span>{format(new Date(registration.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  {registration.verifiedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Verified At</span>
                      <span>{format(new Date(registration.verifiedAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                  {registration.rejectionReason && (
                    <div className="mt-2 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm font-medium text-red-800">Rejection Reason</p>
                      <p className="text-sm text-red-600">{registration.rejectionReason}</p>
                    </div>
                  )}
                  {registration.notes && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700">Notes</p>
                      <p className="text-sm text-gray-600">{registration.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon?: React.ComponentType<{ className?: string }>; 
  label: string; 
  value?: string | number | null;
}) {
  if (!value) return null;
  return (
    <div>
      <div className="flex items-center gap-1 text-gray-500">
        {Icon && <Icon className="h-3 w-3" />}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-gray-900">{value}</p>
    </div>
  );
}
