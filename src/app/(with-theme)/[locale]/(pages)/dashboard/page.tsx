import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import { 
  UserCircleIcon, 
  AcademicCapIcon, 
  ClipboardDocumentCheckIcon, 
  CurrencyBangladeshiIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { getUserDashboardData } from '@/actions/dashboard-actions';

export const metadata = {
  title: 'My Dashboard | HKD Dojo',
  description: 'Manage your martial arts journey, view enrollments, and track progress.',
};

export default async function DashboardPage() {
  const data = await getUserDashboardData();

  if ('error' in data) {
    if (data.error === "Not authenticated") {
      redirect('/login');
    }
    return (
        <>
        <Header />
        <main className="min-h-screen pt-24 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
             <MaxWidthWrapper>
                <div className="text-center py-20">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Something went wrong</h1>
                    <p className="text-slate-600 dark:text-slate-400">{data.error}</p>
                    <Link href="/contact" className="text-primary hover:underline mt-4 inline-block">Contact Support</Link>
                </div>
            </MaxWidthWrapper>
        </main>
        <Footer />
        </>
    );
  }

  const { user, applications, enrollments, payments } = data;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-12 bg-slate-50 dark:bg-slate-900">
        <MaxWidthWrapper>
          <div className="mb-8 flex flex-col md:flex-row items-center md:items-start gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
            <div className="relative h-24 w-24 flex-shrink-0">
               {user.image ? (
                   <Image 
                     src={user.image} 
                     alt={user.name ?? 'User avatar'} 
                     fill 
                     className="rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
                   />
               ) : (
                   <div className="h-full w-full rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-lg">
                       <UserCircleIcon className="h-12 w-12 text-slate-400" />
                   </div>
               )}
            </div>
            <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{user.name}</h1>
                <p className="text-slate-600 dark:text-slate-400">{user.email}</p>
                {user.memberId ? (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        Member ID: {user.memberId}
                    </div>
                ) : user.registrationStatus ? (
                    <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                        Membership: {user.registrationStatus}
                    </div>
                ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Enrollments & Applications */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Active Enrollments */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 mb-6">
                        <AcademicCapIcon className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Classes</h2>
                    </div>

                    {enrollments.length > 0 ? (
                        <div className="space-y-4">
                            {enrollments.map((enrollment: any) => (
                                <div key={enrollment.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{enrollment.courseName}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            <span>Since {format(new Date(enrollment.joinedAt), 'MMM yyyy')}</span>
                                            {enrollment.level && <span>• {enrollment.level} Level</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link 
                                            href={`/karate/courses/${enrollment.courseSlug}`}
                                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            View Course
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-slate-500 dark:text-slate-400 mb-4">You are not enrolled in any classes yet.</p>
                            <Link 
                                href="/karate/courses" 
                                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity"
                            >
                                Browse Courses
                            </Link>
                        </div>
                    )}
                </section>

                {/* Applications */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-2 mb-6">
                        <ClipboardDocumentCheckIcon className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Applications</h2>
                    </div>

                    {applications.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-l-lg">Program/Course</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 rounded-r-lg">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {applications.map((app : any) => (
                                        <tr key={app.id}>
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                                                {app.courseName || `App #${app.applicationNumber}`}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                                {format(new Date(app.appliedAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-4 py-3">
                                               <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                                ${app.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                  app.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                  app.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                  'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}
                                               `}>
                                                {app.status.replace('_', ' ')}
                                               </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {app.status === 'pending_payment' && (
                                                    <Link 
                                                        href={`/onboarding/payment?appId=${app.id}`} 
                                                        className="text-primary hover:underline font-medium"
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
                        <p className="text-slate-500 dark:text-slate-400 text-center py-4">No recent applications.</p>
                    )}
                </section>
            </div>

            {/* Right Column: Payments & Notifications */}
            <div className="lg:col-span-1 space-y-8">
                
                {/* Billing Status */}
                <section className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                             <CurrencyBangladeshiIcon className="h-6 w-6 text-primary" />
                             <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Billing</h2>
                        </div>
                        <Link href="/dashboard/payments" className="text-xs text-primary hover:underline">View All</Link>
                    </div>

                    <div className="space-y-4">
                        {payments.length > 0 ? (
                            payments.map((payment : any) => (
                                <div key={payment.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100">{payment.courseName}</span>
                                        <span className="font-mono text-slate-600 dark:text-slate-300">৳{payment.amount}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                        {format(new Date(payment.year, parseInt(payment.month.split('-')[1]) - 1), 'MMMM yyyy')}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            payment.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                            payment.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                        }`}>
                                            {payment.status}
                                        </span>
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
                            ))
                        ) : (
                             <p className="text-slate-500 dark:text-slate-400 text-center py-4">No payment history.</p>
                        )}
                    </div>
                </section>

                <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                        <p className="text-slate-300 text-sm mb-4">Contact our support team if you have questions about your classes or billing.</p>
                        <Link href="/contact" className="inline-block px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors">
                            Contact Support
                        </Link>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 bg-primary rounded-full opacity-20 blur-xl"></div>
                </div>

            </div>
          </div>
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
