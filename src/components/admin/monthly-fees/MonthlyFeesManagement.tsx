'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  BanknotesIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface MonthlyFee {
  fee: {
    id: string;
    memberId: string;
    enrollmentId: string;
    billingMonth: string;
    billingYear: number;
    amount: number;
    amountPaid: number;
    currency: string;
    dueDate: string;
    status: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentProofUrl?: string;
    paymentSubmittedAt?: string;
    paidAt?: string;
    createdAt: string;
  };
  member: {
    id: string;
    fullNameEnglish: string;
    fullNameBangla?: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  course: {
    id: string;
    name: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: ClockIcon },
  due: { label: 'Due', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon },
  payment_submitted: { label: 'Payment Submitted', color: 'bg-blue-100 text-blue-700', icon: BanknotesIcon },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700', icon: ExclamationTriangleIcon },
  waived: { label: 'Waived', color: 'bg-purple-100 text-purple-700', icon: CheckCircleIcon },
  partial: { label: 'Partial', color: 'bg-orange-100 text-orange-700', icon: BanknotesIcon },
};

export default function MonthlyFeesManagement() {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [fees, setFees] = useState<MonthlyFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const canVerify = hasPermission('MONTHLY_FEE', 'VERIFY');

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (monthFilter) params.set('billingMonth', monthFilter);
      
      const url = `/api/admin/monthly-fees?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch monthly fees');
      const data = await response.json();
      setFees(data);
    } catch (error) {
      toast.error('Failed to load monthly fees');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, monthFilter]);

  useEffect(() => {
    if (!rbacLoading) {
      fetchFees();
    }
  }, [rbacLoading, fetchFees]);

  const handleVerifyPayment = async (feeId: string) => {
    try {
      const response = await fetch(`/api/admin/monthly-fees/${feeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_payment' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      toast.success('Payment verified successfully');
      fetchFees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  const handleWaiveFee = async (feeId: string) => {
    const reason = prompt('Enter waiver reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/monthly-fees/${feeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'waive', waiverReason: reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Waiver failed');
      }

      toast.success('Fee waived successfully');
      fetchFees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Waiver failed');
    }
  };

  const handleGenerateMonthlyFees = async () => {
    const month = prompt('Enter billing month (YYYY-MM):', new Date().toISOString().slice(0, 7));
    if (!month) return;

    try {
      const response = await fetch('/api/admin/monthly-fees/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingMonth: month }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const result = await response.json();
      toast.success(`Generated ${result.count} monthly fee records`);
      fetchFees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
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

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-BD', { year: 'numeric', month: 'long' });
  };

  // Filter by search
  const filteredFees = fees.filter((f) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      f.member?.fullNameEnglish?.toLowerCase().includes(search) ||
      f.member?.email?.toLowerCase().includes(search) ||
      f.course?.name?.toLowerCase().includes(search)
    );
  });

  // Stats
  const stats = {
    total: fees.length,
    pending: fees.filter(f => f.fee.status === 'pending' || f.fee.status === 'due').length,
    payment_submitted: fees.filter(f => f.fee.status === 'payment_submitted').length,
    paid: fees.filter(f => f.fee.status === 'paid').length,
    overdue: fees.filter(f => f.fee.status === 'overdue').length,
    totalAmount: fees.reduce((sum, f) => sum + f.fee.amount, 0),
    collectedAmount: fees.filter(f => f.fee.status === 'paid').reduce((sum, f) => sum + (f.fee.amountPaid || 0), 0),
  };

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = date.toISOString().slice(0, 7);
    return { value, label: formatMonth(value) };
  });

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Fees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage student monthly payments
          </p>
        </div>
        <button
          onClick={handleGenerateMonthlyFees}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Generate Monthly Fees
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Total Bills</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Pending/Due</p>
          <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Awaiting Verification</p>
          <p className="text-2xl font-semibold text-blue-600">{stats.payment_submitted}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Paid</p>
          <p className="text-2xl font-semibold text-green-600">{stats.paid}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Overdue</p>
          <p className="text-2xl font-semibold text-red-600">{stats.overdue}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Collected</p>
          <p className="text-2xl font-semibold text-green-600">
            {formatCurrency(stats.collectedAmount, 'BDT')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Months</option>
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Fees Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="text-center py-12">
            <BanknotesIcon className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No monthly fees found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or generate fees for a new month.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFees.map((item) => {
                  const status = STATUS_CONFIG[item.fee.status];
                  const StatusIcon = status?.icon || ClockIcon;
                  const isOverdue = new Date(item.fee.dueDate) < new Date() && 
                    !['paid', 'waived'].includes(item.fee.status);

                  return (
                    <tr key={item.fee.id} className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {item.member?.fullNameEnglish || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.member?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.course?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {formatMonth(item.fee.billingMonth)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.fee.amount, item.fee.currency)}
                        </div>
                        {(item.fee.amountPaid ?? 0) > 0 && (item.fee.amountPaid ?? 0) < item.fee.amount && (
                          <div className="text-xs text-green-600">
                            Paid: {formatCurrency(item.fee.amountPaid ?? 0, item.fee.currency)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.fee.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                          <StatusIcon className="h-3.5 w-3.5 mr-1" />
                          {status?.label || item.fee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {item.fee.status === 'payment_submitted' && canVerify && (
                            <button
                              onClick={() => handleVerifyPayment(item.fee.id)}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Verify
                            </button>
                          )}
                          {['pending', 'due', 'overdue'].includes(item.fee.status) && canVerify && (
                            <button
                              onClick={() => handleWaiveFee(item.fee.id)}
                              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            >
                              Waive
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
