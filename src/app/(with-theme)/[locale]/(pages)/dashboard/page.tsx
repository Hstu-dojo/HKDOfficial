import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserCircleIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  CurrencyBangladeshiIcon,
  CalendarDaysIcon,
  TrophyIcon,
  DocumentCheckIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { getUserDashboardData } from '@/actions/dashboard-actions';
import { getMyCertificates } from '@/actions/certificate-actions';
import { ProfileCompletionCard } from '@/components/dashboard/profile-completion-card';

import { DashboardCertificateDownloadButton } from './dashboard-certificate-download-button';

export const metadata = {
  title: 'My Dashboard | HKD Dojo',
  description: 'Manage your martial arts journey, view enrollments, and track progress.',
};

// ── Reusable card shell ─────────────────────────────────────────────────────
function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ElementType;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100 dark:border-slate-700/50">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>
      {action}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  approved:          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  active:            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending:           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending_payment:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  payment_submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  payment_verified:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected:          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  overdue:           'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  waived:            'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

function StatusBadge({ status }: { status: string }) {
  const label =
    status === 'pending_payment'   ? 'Payment Pending'  :
    status === 'payment_submitted' ? 'Under Review'     :
    status === 'payment_verified'  ? 'Verified'         :
    status.replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusStyles[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}
    >
      {label}
    </span>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const data = await getUserDashboardData();

  if ('error' in data) {
    if (data.error === 'Not authenticated') redirect('/login');
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Something went wrong
        </h1>
        <p className="text-slate-600 dark:text-slate-400">{data.error}</p>
        <Link href="/contact" className="text-primary hover:underline mt-4 inline-block">
          Contact Support
        </Link>
      </div>
    );
  }

  const { user, applications, enrollments, payments, programRegistrations } = data;

  // Fetch user's issued certificates
  const certificatesResult = await getMyCertificates();
  const certificates = certificatesResult.success ? (certificatesResult.data ?? []) : [];

  return (
    <div className="space-y-6">

      {/* ── User hero card ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-white to-tertiary/10 dark:from-primary/20 dark:via-slate-800 dark:to-tertiary/10 border border-primary/10 dark:border-primary/20 shadow-sm px-6 py-5">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative h-18 w-18 flex-shrink-0">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? 'User avatar'}
                width={72}
                height={72}
                className="rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg h-[72px] w-[72px]"
              />
            ) : (
              <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-primary/20 to-tertiary/20 flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-lg">
                <UserCircleIcon className="h-10 w-10 text-primary/60" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {user.name ?? 'Member'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
              {user.profileId ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  Member ID: {user.profileId}
                </span>
              ) : user.registrationStatus ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/40">
                  Membership: {user.registrationStatus}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Alert */}
      {!user.profileComplete && <ProfileCompletionCard />}

      {/* ── Main content grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left column (wide) */}
        <div className="xl:col-span-2 space-y-6">

          {/* Active Enrollments */}
          <Card className="p-5">
            <CardHeader icon={AcademicCapIcon} title="My Classes" />
            {enrollments.length > 0 ? (
              <div className="space-y-3">
                {enrollments.map((enrollment: any) => (
                  <div
                    key={enrollment.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50"
                  >
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {enrollment.courseName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>Since {format(new Date(enrollment.joinedAt), 'MMM yyyy')}</span>
                        {enrollment.level && <span>• {enrollment.level} Level</span>}
                      </div>
                    </div>
                    <Link
                      href={`/karate/courses/${enrollment.courseSlug}`}
                      className="flex-shrink-0 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      View Course
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <AcademicCapIcon className="h-12 w-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  You are not enrolled in any classes yet.
                </p>
                <Link
                  href="/karate/courses"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Browse Courses
                </Link>
              </div>
            )}
          </Card>

          {/* Applications */}
          <Card className="p-5">
            <CardHeader icon={ClipboardDocumentCheckIcon} title="Applications" />
            {applications.length > 0 ? (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50">
                      <th className="px-4 py-3 rounded-l-xl font-semibold">Course</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 rounded-r-xl font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {applications.map((app: any) => (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {app.courseName || `App #${app.applicationNumber}`}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {format(new Date(app.appliedAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {app.status === 'pending_payment' && (
                            <Link
                              href={`/onboarding/payment?appId=${app.id}`}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              Pay Now
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-6">
                No recent applications.
              </p>
            )}
          </Card>

          {/* Program Registrations */}
          <Card className="p-5">
            <CardHeader icon={TrophyIcon} title="Program Registrations" />
            {programRegistrations.length > 0 ? (
              <div className="space-y-3">
                {programRegistrations.map((reg: any) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="text-xs uppercase font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {reg.programType?.replace(/_/g, ' ') || 'Program'}
                        </span>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-1 truncate">
                          {reg.programTitle}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {reg.programDate && (
                            <span className="flex items-center gap-1">
                              <CalendarDaysIcon className="h-3.5 w-3.5" />
                              {format(new Date(reg.programDate), 'MMM d, yyyy')}
                            </span>
                          )}
                          <span>৳{reg.feeAmount}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-1.5">
                        <StatusBadge status={reg.status} />
                        {reg.transactionId && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            TXN: {reg.transactionId}
                          </span>
                        )}
                      </div>
                    </div>
                    {reg.status === 'approved' && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600/50">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✓ You are registered for this program. See you there!
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <TrophyIcon className="h-12 w-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
                  No program registrations yet.
                </p>
                <Link
                  href="/karate/programs"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Browse Programs
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Billing */}
          <Card className="p-5">
            <CardHeader
              icon={CurrencyBangladeshiIcon}
              title="Billing"
              action={
                <Link href="/dashboard/payments" className="text-xs text-primary hover:underline font-medium">
                  View All
                </Link>
              }
            />
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate pr-2">
                        {payment.courseName}
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200 flex-shrink-0">
                        ৳{payment.amount}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                      {format(
                        new Date(payment.year, parseInt(payment.month.split('-')[1]) - 1),
                        'MMMM yyyy',
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <StatusBadge status={payment.status} />
                      {payment.status !== 'paid' && payment.status !== 'waived' && (
                        <Link
                          href={`/dashboard/payments/${payment.id}`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Pay
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-6">
                No payment history.
              </p>
            )}
          </Card>

          {/* My Certificates */}
          {certificates.length > 0 && (
            <Card className="p-5">
              <CardHeader
                icon={DocumentCheckIcon}
                title="My Certificates"
                action={
                  <Link href="/dashboard/certificates" className="text-xs text-primary hover:underline font-medium">
                    View All
                  </Link>
                }
              />
              <div className="space-y-3">
                {certificates.map((cert: any) => (
                  <div
                    key={cert.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate pr-2">
                        {cert.programTitle}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                      <span className="font-mono">{cert.certificateNumber}</span>
                      {cert.issueDate && (
                        <>
                          <span>•</span>
                          <span>{format(new Date(cert.issueDate), 'MMM d, yyyy')}</span>
                        </>
                      )}
                    </div>
                    <DashboardCertificateDownloadButton certId={cert.id} certNumber={cert.certificateNumber} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Help card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-5 shadow-sm dark:shadow-md border border-slate-200 dark:border-slate-700/50">
            <div className="absolute -top-8 -right-8 h-28 w-28 rounded-full bg-primary opacity-10 dark:opacity-20 blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <h3 className="font-bold text-base mb-1.5 text-slate-900 dark:text-white">Need Help?</h3>
              <p className="text-slate-500 dark:text-slate-300 text-xs leading-relaxed mb-4">
                Contact our support team if you have questions about your classes or billing.
              </p>
              <Link
                href="/contact"
                className="inline-block px-4 py-2 bg-primary text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-bold hover:opacity-90 dark:hover:bg-slate-100 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
