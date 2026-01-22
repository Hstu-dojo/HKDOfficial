'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRBAC } from '@/hooks/useRBAC';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  PhotoIcon,
  MagnifyingGlassPlusIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { getProgramRegistrations, updateRegistrationStatus } from '@/actions/program-actions';
import { format } from 'date-fns';

export default function ProgramRegistrations() {
  const searchParams = useSearchParams();
  const programIdParam = searchParams?.get('programId');

  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const canApprove = hasPermission('PROGRAM_REGISTRATION', 'APPROVE');
  
  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getProgramRegistrations(programIdParam || undefined);
      if (result.success && result.data) {
        setRegistrations(result.data);
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

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
    if (!confirm(`Are you sure you want to ${status} this registration?`)) return;

    try {
      const result = await updateRegistrationStatus(id, status);
      if (result.success) {
        toast.success(`Registration ${status}`);
        fetchRegistrations();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Program Registrations</h1>
          <p className="mt-1 text-sm text-gray-500">
             {programIdParam 
               ? `Viewing registrations for selected program` 
               : 'Viewing all program registrations'}
          </p>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                       {reg.user?.image && (
                         <div className="flex-shrink-0 h-8 w-8 mr-3">
                           <img className="h-8 w-8 rounded-full" src={reg.user.image} alt="" />
                         </div>
                       )}
                       <div>
                         <div className="text-sm font-medium text-gray-900">{reg.user?.name || 'Unknown'}</div>
                         <div className="text-sm text-gray-500">{reg.user?.email}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reg.program?.title}</div>
                    <div className="text-xs text-gray-500">{reg.program?.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(reg.registeredAt || reg.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{reg.feeAmount} {reg.currency}</div>
                    {reg.transactionId && (
                      <div className="text-xs text-gray-500 font-mono mt-1">Trx: {reg.transactionId}</div>
                    )}
                     {reg.paymentProofUrl && (
                      <button 
                        onClick={() => setSelectedImage(reg.paymentProofUrl)}
                        className="mt-1 flex items-center text-xs text-blue-600 hover:text-blue-800"
                      >
                        <PhotoIcon className="h-3 w-3 mr-1" />
                        View Proof
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {statusBadge(reg.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {canApprove && reg.status === 'pending_payment' && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(reg.id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                          title="Approve"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(reg.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                          title="Reject"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {registrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" onClick={() => setSelectedImage(null)}>
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
    </div>
  );
}
