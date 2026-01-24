'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import {
  AcademicCapIcon,
  BanknotesIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface Application {
  application: {
    id: string;
    applicationNumber: string;
    courseId: string;
    status: string;
    admissionFeeAmount: number;
    currency: string;
    paymentSubmittedAt?: string;
    createdAt: string;
  };
  course: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface Enrollment {
  enrollment: {
    id: string;
    enrollmentNumber: string;
    memberId: string;
    courseId: string;
    status: string;
    startDate: string;
    endDate?: string;
    currentBeltLevel?: string;
  };
  course: {
    id: string;
    name: string;
    monthlyFee: number;
    currency: string;
  } | null;
}

interface MonthlyFee {
  id: string;
  billingMonth: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  dueDate: string;
  status: string;
  courseName?: string;
}

const APP_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending_payment: { label: 'Pending Payment', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon },
  payment_submitted: { label: 'Under Review', color: 'bg-blue-100 text-blue-700', icon: ClockIcon },
  payment_verified: { label: 'Payment Verified', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircleIcon },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircleIcon },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircleIcon },
};

const FEE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  due: { label: 'Due', color: 'bg-yellow-100 text-yellow-700' },
  payment_submitted: { label: 'Under Review', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700' },
  waived: { label: 'Waived', color: 'bg-purple-100 text-purple-700' },
};

export default function StudentEnrollmentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [monthlyFees, setMonthlyFees] = useState<MonthlyFee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading || !user) return;

      try {
        setLoading(true);
        
        // Fetch applications
        const appResponse = await fetch('/api/enrollments/apply');
        if (appResponse.ok) {
          const appData = await appResponse.json();
          setApplications(appData);
        }

        // Fetch enrollments
        const enrollResponse = await fetch('/api/student/enrollments');
        if (enrollResponse.ok) {
          const enrollData = await enrollResponse.json();
          setEnrollments(enrollData);
        }

        // Fetch monthly fees
        const feeResponse = await fetch('/api/student/monthly-fees');
        if (feeResponse.ok) {
          const feeData = await feeResponse.json();
          setMonthlyFees(feeData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user]);

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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Please log in to view your enrollments.</p>
        <Link href="/login" className="text-red-600 hover:underline mt-2 inline-block">
          Sign In
        </Link>
      </div>
    );
  }

  // Calculate stats
  const pendingFees = monthlyFees.filter(f => ['pending', 'due', 'overdue'].includes(f.status));
  const totalDue = pendingFees.reduce((sum, f) => sum + (f.totalAmount - f.paidAmount), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Enrollments</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your karate course enrollments and payments
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Enrollments</p>
              <p className="text-xl font-semibold">{enrollments.filter(e => e.enrollment.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Applications</p>
              <p className="text-xl font-semibold">
                {applications.filter(a => !['approved', 'rejected', 'cancelled'].includes(a.application.status)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Fees</p>
              <p className="text-xl font-semibold">{pendingFees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount Due</p>
              <p className="text-xl font-semibold">{formatCurrency(totalDue, 'BDT')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Applications */}
      {applications.filter(a => !['approved', 'rejected'].includes(a.application.status)).length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Pending Applications</h2>
          </div>
          <div className="divide-y">
            {applications
              .filter(a => !['approved', 'rejected'].includes(a.application.status))
              .map((app) => {
                const status = APP_STATUS_CONFIG[app.application.status];
                const StatusIcon = status?.icon || ClockIcon;
                return (
                  <div key={app.application.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <AcademicCapIcon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{app.course?.name || 'Unknown Course'}</p>
                        <p className="text-sm text-gray-500">
                          Applied: {formatDate(app.application.createdAt)} • 
                          Fee: {formatCurrency(app.application.admissionFeeAmount, app.application.currency)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status?.color}`}>
                      <StatusIcon className="h-4 w-4 mr-1" />
                      {status?.label}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Active Enrollments */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">My Courses</h2>
          <Link
            href="/karate/courses"
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            Browse Courses <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        {enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">You haven&apos;t enrolled in any courses yet.</p>
            <Link
              href="/karate/courses"
              className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {enrollments.map((enrollment) => (
              <div key={enrollment.enrollment.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{enrollment.course?.name}</h3>
                    <p className="text-sm text-gray-500">
                      Enrollment #: {enrollment.enrollment.enrollmentNumber}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    enrollment.enrollment.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {enrollment.enrollment.status.charAt(0).toUpperCase() + enrollment.enrollment.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-medium">{formatDate(enrollment.enrollment.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Monthly Fee</p>
                    <p className="font-medium">
                      {enrollment.course ? formatCurrency(enrollment.course.monthlyFee, enrollment.course.currency) : '-'}
                    </p>
                  </div>
                  {enrollment.enrollment.currentBeltLevel && (
                    <div>
                      <p className="text-gray-500">Current Belt</p>
                      <p className="font-medium capitalize">{enrollment.enrollment.currentBeltLevel}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Fees */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Fees</h2>
        </div>
        {monthlyFees.length === 0 ? (
          <div className="p-8 text-center">
            <BanknotesIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No monthly fees to display.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyFees.map((fee) => {
                  const status = FEE_STATUS_CONFIG[fee.status];
                  const isOverdue = new Date(fee.dueDate) < new Date() && 
                    !['paid', 'waived'].includes(fee.status);
                  
                  return (
                    <tr key={fee.id} className={isOverdue ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatMonth(fee.billingMonth)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fee.courseName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(fee.totalAmount, fee.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(fee.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                          {status?.label || fee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {['pending', 'due', 'overdue'].includes(fee.status) && (
                          <Link
                            href={`/dashboard/pay-fee/${fee.id}`}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Pay Now
                          </Link>
                        )}
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
