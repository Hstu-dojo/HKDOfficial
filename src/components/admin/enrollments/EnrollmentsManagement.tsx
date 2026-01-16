'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  EyeIcon,
  BanknotesIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import ApplicationDetailModal from './ApplicationDetailModal';

interface Application {
  application: {
    id: string;
    applicationNumber: string;
    userId: string;
    courseId: string;
    studentInfo: {
      fullNameEnglish: string;
      fullNameBangla?: string;
      fatherName?: string;
      motherName?: string;
      dateOfBirth?: string;
      gender?: string;
      bloodGroup?: string;
      email: string;
      phoneNumber: string;
      emergencyContact?: string;
      address?: string;
      occupation?: string;
      institution?: string;
      previousMartialArtsExperience?: string;
      medicalConditions?: string;
      profilePhotoUrl?: string;
      nationalIdNumber?: string;
    };
    admissionFeeAmount: number;
    currency: string;
    status: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentProofUrl?: string;
    paymentSubmittedAt?: string;
    paymentVerifiedAt?: string;
    verifiedById?: string;
    reviewedAt?: string;
    reviewedById?: string;
    rejectionReason?: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
  };
  course: {
    id: string;
    name: string;
    monthlyFee: number;
    admissionFee: number;
  } | null;
  applicant: {
    id: string;
    email: string;
    userName: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon },
  payment_submitted: { label: 'Payment Submitted', color: 'bg-blue-100 text-blue-700', icon: BanknotesIcon },
  payment_verified: { label: 'Payment Verified', color: 'bg-indigo-100 text-indigo-700', icon: DocumentCheckIcon },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircleIcon },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700', icon: XCircleIcon },
};

export default function EnrollmentsManagement() {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const canVerify = hasPermission('ENROLLMENT', 'VERIFY');
  const canApprove = hasPermission('ENROLLMENT', 'APPROVE');

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter 
        ? `/api/admin/enrollments?status=${statusFilter}`
        : '/api/admin/enrollments';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      toast.error('Failed to load applications');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!rbacLoading) {
      fetchApplications();
    }
  }, [rbacLoading, fetchApplications]);

  const handleAction = async (applicationId: string, action: string, data?: Record<string, string>) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Action failed');
      }

      toast.success(`Application ${action.replace('_', ' ')} successful`);
      fetchApplications();
      setSelectedApplication(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Stats
  const stats = {
    total: applications.length,
    pending_payment: applications.filter(a => a.application.status === 'pending_payment').length,
    payment_submitted: applications.filter(a => a.application.status === 'payment_submitted').length,
    payment_verified: applications.filter(a => a.application.status === 'payment_verified').length,
    approved: applications.filter(a => a.application.status === 'approved').length,
    rejected: applications.filter(a => a.application.status === 'rejected').length,
  };

  if (rbacLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enrollment Applications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage student enrollment applications
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <button
          onClick={() => setStatusFilter('')}
          className={`p-4 rounded-lg border text-left ${
            statusFilter === '' ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`}
        >
          <p className="text-sm text-gray-500">All</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </button>
        <button
          onClick={() => setStatusFilter('pending_payment')}
          className={`p-4 rounded-lg border text-left ${
            statusFilter === 'pending_payment' ? 'ring-2 ring-yellow-500 border-yellow-500' : ''
          }`}
        >
          <p className="text-sm text-gray-500">Pending Payment</p>
          <p className="text-2xl font-semibold text-yellow-600">{stats.pending_payment}</p>
        </button>
        <button
          onClick={() => setStatusFilter('payment_submitted')}
          className={`p-4 rounded-lg border text-left ${
            statusFilter === 'payment_submitted' ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`}
        >
          <p className="text-sm text-gray-500">Payment Submitted</p>
          <p className="text-2xl font-semibold text-blue-600">{stats.payment_submitted}</p>
        </button>
        <button
          onClick={() => setStatusFilter('payment_verified')}
          className={`p-4 rounded-lg border text-left ${
            statusFilter === 'payment_verified' ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
          }`}
        >
          <p className="text-sm text-gray-500">Payment Verified</p>
          <p className="text-2xl font-semibold text-indigo-600">{stats.payment_verified}</p>
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`p-4 rounded-lg border text-left ${
            statusFilter === 'approved' ? 'ring-2 ring-green-500 border-green-500' : ''
          }`}
        >
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-semibold text-green-600">{stats.approved}</p>
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`p-4 rounded-lg border text-left ${
            statusFilter === 'rejected' ? 'ring-2 ring-red-500 border-red-500' : ''
          }`}
        >
          <p className="text-sm text-gray-500">Rejected</p>
          <p className="text-2xl font-semibold text-red-600">{stats.rejected}</p>
        </button>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter ? `No ${statusFilter.replace('_', ' ')} applications found.` : 'No enrollment applications yet.'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Application
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => {
                const status = STATUS_CONFIG[app.application.status];
                const StatusIcon = status?.icon || ClockIcon;
                
                return (
                  <tr key={app.application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {app.application.applicationNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {app.application.studentInfo.profilePhotoUrl ? (
                          <img
                            src={app.application.studentInfo.profilePhotoUrl}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {app.application.studentInfo.fullNameEnglish}
                          </div>
                          <div className="text-sm text-gray-500">
                            {app.application.studentInfo.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{app.course?.name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(app.application.admissionFeeAmount, app.application.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                        <StatusIcon className="h-3.5 w-3.5 mr-1" />
                        {status?.label || app.application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(app.application.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSelectedApplication(app)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {app.application.status === 'payment_submitted' && canVerify && (
                          <button
                            onClick={() => handleAction(app.application.id, 'verify_payment')}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            Verify
                          </button>
                        )}
                        {app.application.status === 'payment_verified' && canApprove && (
                          <>
                            <button
                              onClick={() => handleAction(app.application.id, 'approve')}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) {
                                  handleAction(app.application.id, 'reject', { rejectionReason: reason });
                                }
                              }}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onAction={handleAction}
          canVerify={canVerify}
          canApprove={canApprove}
        />
      )}
    </div>
  );
}
