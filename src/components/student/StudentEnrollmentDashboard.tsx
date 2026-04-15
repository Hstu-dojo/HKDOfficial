'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useCurrentLocale, useI18n } from '@/locales/client';
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
    profileId: string;
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

const APP_STATUS_CONFIG: Record<
  string,
  {
    labelKey: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending_payment: {
    labelKey: 'dashboard.paymentPending',
    color: 'bg-yellow-100 text-yellow-700',
    icon: ClockIcon,
  },
  payment_submitted: {
    labelKey: 'dashboard.underReview',
    color: 'bg-blue-100 text-blue-700',
    icon: ClockIcon,
  },
  payment_verified: {
    labelKey: 'dashboard.verified',
    color: 'bg-indigo-100 text-indigo-700',
    icon: CheckCircleIcon,
  },
  approved: {
    labelKey: 'dashboard.approved',
    color: 'bg-green-100 text-green-700',
    icon: CheckCircleIcon,
  },
  rejected: {
    labelKey: 'dashboard.rejected',
    color: 'bg-red-100 text-red-700',
    icon: XCircleIcon,
  },
};

const FEE_STATUS_CONFIG: Record<string, { labelKey: string; color: string }> = {
  pending: { labelKey: 'dashboard.pending', color: 'bg-gray-100 text-gray-700' },
  due: { labelKey: 'enrollments.due', color: 'bg-yellow-100 text-yellow-700' },
  payment_submitted: { labelKey: 'dashboard.underReview', color: 'bg-blue-100 text-blue-700' },
  paid: { labelKey: 'enrollments.paid', color: 'bg-green-100 text-green-700' },
  overdue: { labelKey: 'enrollments.overdue', color: 'bg-red-100 text-red-700' },
  waived: { labelKey: 'enrollments.waived', color: 'bg-purple-100 text-purple-700' },
};

export default function StudentEnrollmentDashboard() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const intlLocale = locale === 'bn' ? 'bn-BD' : locale === 'ne' ? 'ne-NP' : 'en-BD';

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
        toast.error(t('enrollments.failedToLoad'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading, user, t]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(intlLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString(intlLocale, { year: 'numeric', month: 'long' });
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
        <p className="text-gray-600 dark:text-gray-400">{t('enrollments.authRequired')}</p>
        <Link href="/login" className="text-red-600 hover:underline mt-2 inline-block">
          {t('header.login')}
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('enrollments.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('enrollments.description')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('enrollments.activeEnrollments')}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{enrollments.filter(e => e.enrollment.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('enrollments.pendingApplications')}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {applications.filter(a => !['approved', 'rejected', 'cancelled'].includes(a.application.status)).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('enrollments.pendingFees')}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{pendingFees.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <BanknotesIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('enrollments.amountDue')}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(totalDue, 'BDT')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Applications */}
      {applications.filter(a => !['approved', 'rejected'].includes(a.application.status)).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('enrollments.pendingApplications')}</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {applications
              .filter(a => !['approved', 'rejected'].includes(a.application.status))
              .map((app) => {
                const status = APP_STATUS_CONFIG[app.application.status];
                const StatusIcon = status?.icon || ClockIcon;
                const statusLabel = status ? t(status.labelKey) : app.application.status;
                return (
                  <div key={app.application.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                        <AcademicCapIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{app.course?.name || t('enrollments.unknownCourse')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t('enrollments.appliedOn')}: {formatDate(app.application.createdAt)} •{' '}
                          {t('enrollments.fee')}: {formatCurrency(app.application.admissionFeeAmount, app.application.currency)}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status?.color}`}>
                      <StatusIcon className="h-4 w-4 mr-1" />
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Active Enrollments */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('enrollments.myCourses')}</h2>
          <Link
            href="/karate/courses"
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
          >
            {t('dashboard.browseCourses')} <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        {enrollments.length === 0 ? (
          <div className="p-8 text-center">
            <AcademicCapIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('enrollments.noActiveEnrollmentsDescription')}</p>
            <Link
              href="/karate/courses"
              className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              {t('dashboard.browseCourses')}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {enrollments.map((enrollment) => (
              <div key={enrollment.enrollment.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{enrollment.course?.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('enrollments.enrollmentNumberLabel')}: {enrollment.enrollment.enrollmentNumber}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    enrollment.enrollment.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                  }`}>
                    {enrollment.enrollment.status === 'active' ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{t('enrollments.startDate')}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(enrollment.enrollment.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">{t('enrollments.monthlyFee')}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {enrollment.course ? formatCurrency(enrollment.course.monthlyFee, enrollment.course.currency) : '-'}
                    </p>
                  </div>
                  {enrollment.enrollment.currentBeltLevel && (
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{t('enrollments.currentBelt')}</p>
                      <p className="font-medium capitalize text-gray-900 dark:text-gray-100">{enrollment.enrollment.currentBeltLevel}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Fees */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('enrollments.monthlyFees')}</h2>
        </div>
        {monthlyFees.length === 0 ? (
          <div className="p-8 text-center">
            <BanknotesIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('enrollments.noMonthlyFeesDescription')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('enrollments.month')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('enrollments.course')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('enrollments.amount')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('enrollments.dueDate')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.status')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {monthlyFees.map((fee) => {
                  const status = FEE_STATUS_CONFIG[fee.status];
                  const isOverdue = new Date(fee.dueDate) < new Date() && 
                    !['paid', 'waived'].includes(fee.status);
                  const statusLabel = status ? t(status.labelKey) : fee.status;
                  
                  return (
                    <tr key={fee.id} className={isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatMonth(fee.billingMonth)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {fee.courseName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(fee.totalAmount, fee.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(fee.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {['pending', 'due', 'overdue'].includes(fee.status) && (
                          <Link
                            href={`/dashboard/pay-fee/${fee.id}`}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                          >
                            {t('dashboard.payNow')}
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
