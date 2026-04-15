import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/connect-db';
import { courses, courseSchedules } from '@/db/schemas/karate';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPartnerIdForSupabaseUser } from '@/lib/partner-assignment';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  MapPinIcon,
  CurrencyBangladeshiIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import type { Metadata } from 'next';
import { getI18n } from '@/locales/server';

// ISR: revalidate every 120 seconds
export const revalidate = 120;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = await getI18n();

  const course = await db.query.courses.findFirst({
    where: eq(courses.id, slug),
  });

  if (!course) {
    return { title: t('courses.details.metaTitleFallback') };
  }

  return {
    title: t('courses.details.metaTitle', { course: course.name }),
  };
}

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getI18n();
  
  // Using slug as ID since courses don't have a slug column
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, slug),
  });

  if (!course) {
    notFound();
  }

  const schedules = await db.select().from(courseSchedules).where(eq(courseSchedules.courseId, course.id));

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  const viewerPartnerId = authUser ? await getPartnerIdForSupabaseUser(authUser.id) : null;
  const canSeePricing = !!(viewerPartnerId && course.partnerId && course.partnerId === viewerPartnerId);

  const features = course.features as string[] || [];

  const dayNames = [
    t('days.sunday'),
    t('days.monday'),
    t('days.tuesday'),
    t('days.wednesday'),
    t('days.thursday'),
    t('days.friday'),
    t('days.saturday'),
  ];

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="py-8 pb-16">
          <MaxWidthWrapper>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              {/* Banner */}
              <div className="h-56 w-full relative overflow-hidden">
                {course.bannerUrl ? (
                  <Image src={course.bannerUrl} alt={course.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70"></div>
                )}
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute inset-0 bg-[url('/hero/pattern.svg')] opacity-10"></div>
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <div className="flex items-center gap-2 mb-3">
                    {course.minimumBelt && (
                      <span className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm uppercase tracking-wide">
                        {t('courses.details.minimumBelt', { belt: course.minimumBelt })}
                      </span>
                    )}
                    {course.isEnrollmentOpen && (
                      <span className="bg-green-500/80 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
                        {t('courses.details.enrollmentOpenBadge')}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold">{course.name}</h1>
                  {course.nameBangla && (
                    <p className="mt-1 text-lg opacity-90">{course.nameBangla}</p>
                  )}
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                        {course.description}
                      </p>
                      {course.descriptionBangla && (
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                          {course.descriptionBangla}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    {features.length > 0 && (
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('courses.details.whatsIncludedTitle')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {features.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                              <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Schedule */}
                    {schedules.length > 0 && (
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('courses.details.classScheduleTitle')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {schedules.map((schedule) => (
                            <div 
                              key={schedule.id} 
                              className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                            >
                              <CalendarDaysIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                  {dayNames[schedule.dayOfWeek]}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {schedule.startTime} - {schedule.endTime}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                  {schedule.location}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Course Details */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('courses.details.courseDetailsTitle')}</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                          <ClockIcon className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{course.duration}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('courses.details.durationUnitMonths')}</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                          <CalendarDaysIcon className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{course.sessionsPerWeek}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('courses.details.sessionsPerWeek')}</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                          <ClockIcon className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{course.sessionDurationMinutes}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('courses.details.minutesPerSession')}</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                          <UserGroupIcon className="h-6 w-6 text-primary mx-auto mb-2" />
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{course.currentStudents || 0}/{course.maxStudents || '∞'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('courses.details.studentsLabel')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar / Pricing */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{t('courses.details.pricingTitle')}</h3>

                      {canSeePricing ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-slate-500 dark:text-slate-400">{t('courses.details.admissionFee')}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xl">
                              ৳{course.admissionFee}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400">{t('courses.details.monthlyFee')}</span>
                            <span className="font-bold text-primary text-2xl">
                              ৳{course.monthlyFee}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 p-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400">{t('courses.details.pricingHidden')}</p>
                        </div>
                      )}

                      {course.targetBelt && (
                        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                          <div className="flex items-center gap-2 text-sm">
                            <AcademicCapIcon className="h-5 w-5 text-primary" />
                            <span className="text-slate-700 dark:text-slate-300">
                              {t('courses.details.targetLabel')} <strong className="text-primary capitalize">{course.targetBelt} Belt</strong>
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-6">
                        {course.isEnrollmentOpen ? (
                          <Link
                            href={`/${locale}/karate/courses/${slug}/apply`}
                            className="block w-full text-center bg-primary text-white rounded-xl py-3 px-4 font-semibold hover:opacity-90 transition shadow-sm"
                          >
                            {t('courses.details.applyNow')}
                          </Link>
                        ) : (
                          <button 
                            disabled 
                            className="w-full bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 rounded-xl py-3 px-4 font-semibold cursor-not-allowed"
                          >
                            {t('courses.details.enrollmentClosedButton')}
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
                        {t('courses.details.paymentInfo')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MaxWidthWrapper>
        </div>
      </main>
      <Footer />
    </>
  );
}
