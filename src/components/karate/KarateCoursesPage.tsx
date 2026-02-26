'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileCompletionBanner } from '@/components/layout/profile-completion-banner';

interface Course {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  targetAudience?: string;
  minAge?: number;
  maxAge?: number;
  beltLevelFrom?: string;
  beltLevelTo?: string;
  durationMonths?: number;
  monthlyFee: number;
  admissionFee: number;
  currency: string;
  maxCapacity?: number;
  currentEnrollment: number;
  features?: string[];
  imageUrl?: string;
  isEnrollmentOpen: boolean;
  schedules?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location?: string;
  }[];
}

const BELT_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  white:  { bg: 'bg-gray-50 dark:bg-gray-800',         text: 'text-gray-700 dark:text-gray-300',       dot: 'bg-gray-300' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20',   text: 'text-yellow-700 dark:text-yellow-300',   dot: 'bg-yellow-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20',   text: 'text-orange-700 dark:text-orange-300',   dot: 'bg-orange-400' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',     text: 'text-green-700 dark:text-green-300',     dot: 'bg-green-500' },
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-700 dark:text-blue-300',       dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',   text: 'text-purple-700 dark:text-purple-300',   dot: 'bg-purple-500' },
  brown:  { bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-800 dark:text-amber-300',     dot: 'bg-amber-700' },
  black:  { bg: 'bg-slate-900 dark:bg-slate-700',       text: 'text-white',                             dot: 'bg-black dark:bg-white' },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

interface KarateCoursesPageProps {
  initialCourses: Course[];
}

export default function KarateCoursesPage({ initialCourses }: KarateCoursesPageProps) {
  const [courses] = useState<Course[]>(initialCourses);
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = (node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setVisible(true); },
        { threshold: 0.05 },
      );
      observerRef.current.observe(node);
    }
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getBeltLabel = (belt: string) =>
    belt.charAt(0).toUpperCase() + belt.slice(1);

  return (
    <div ref={setRef} className="relative overflow-hidden">
      {/* ── decorative grid lines ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute left-[15%] top-0 h-full w-px bg-slate-200/60 dark:bg-slate-700/30" />
        <div className="absolute left-[85%] top-0 h-full w-px bg-slate-200/60 dark:bg-slate-700/30" />
      </div>

      {/* ── background watermark ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
        aria-hidden="true"
      >
        <span className="font-bold text-[18vw] lg:text-[12vw] text-slate-100 dark:text-slate-800/40 leading-none whitespace-nowrap">
          KARATE
        </span>
      </div>

      {/* ── section header ── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 text-center mb-12 lg:mb-16 pt-4"
      >
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-primary" />
          <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
            Train With Us
          </span>
          <div className="h-px w-8 bg-primary" />
        </div>
        <h1 className="text-3xl lg:text-5xl font-bold mb-4">
          Karate <span className="text-primary">Courses</span>
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto">
          Begin your martial arts journey with expert-led programs designed for
          all ages and skill levels.
        </p>
      </motion.div>

      {/* ── profile completion banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 mb-10"
      >
        <ProfileCompletionBanner variant="inline" />
      </motion.div>

      {/* ── courses grid ── */}
      <div className="relative z-10">
        {courses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={visible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50"
          >
            <svg className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No Courses Available</h3>
            <p className="text-muted-foreground">Please check back later for upcoming courses.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <AnimatePresence>
              {courses.map((course, i) => {
                const belt = course.beltLevelFrom
                  ? BELT_STYLES[course.beltLevelFrom] || BELT_STYLES.white
                  : null;

                return (
                  <motion.div
                    key={course.id}
                    variants={fadeUp}
                    initial="initial"
                    animate={visible ? 'animate' : 'initial'}
                    custom={i}
                  >
                    <div className="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 dark:border-slate-700/50 hover:border-primary/30 dark:hover:border-primary/30 h-full flex flex-col">
                      {/* image */}
                      <div className="relative h-48 lg:h-52 overflow-hidden">
                        {course.imageUrl ? (
                          <Image
                            src={course.imageUrl}
                            alt={course.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10 flex items-center justify-center">
                            <svg className="w-20 h-20 text-primary/20" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                            </svg>
                          </div>
                        )}

                        {/* overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                        {/* belt badge */}
                        {belt && course.beltLevelFrom && (
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-sm shadow-sm ${belt.bg} ${belt.text}`}>
                              <span className={`w-2 h-2 rounded-full ${belt.dot}`} />
                              {getBeltLabel(course.beltLevelFrom)}
                              {course.beltLevelTo && course.beltLevelTo !== course.beltLevelFrom && (
                                <> → {getBeltLabel(course.beltLevelTo)}</>
                              )}
                            </span>
                          </div>
                        )}

                        {/* enrollment status */}
                        <div className="absolute top-3 right-3">
                          {course.isEnrollmentOpen ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md shadow-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Open
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium bg-slate-500/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-md shadow-sm">
                              Closed
                            </span>
                          )}
                        </div>

                        {/* bottom floating chips */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 flex-wrap">
                          {course.durationMonths && (
                            <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-md px-2.5 py-1 shadow-sm">
                              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                {course.durationMonths} months
                              </span>
                            </div>
                          )}
                          {course.maxCapacity && (
                            <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-md px-2.5 py-1 shadow-sm">
                              <svg className="w-3.5 h-3.5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                              </svg>
                              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                                {course.currentEnrollment}/{course.maxCapacity}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* card body */}
                      <div className="p-5 lg:p-6 flex flex-col flex-1">
                        <h3 className="text-lg font-bold mb-1.5 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                          {course.name}
                        </h3>

                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {course.shortDescription}
                        </p>

                        {/* schedule chips */}
                        {course.schedules && course.schedules.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {course.schedules.slice(0, 3).map((schedule, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-700/50 text-muted-foreground px-2 py-1 rounded-md"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                </svg>
                                {DAY_NAMES[schedule.dayOfWeek]} {formatTime(schedule.startTime)}
                              </span>
                            ))}
                            {course.schedules.length > 3 && (
                              <span className="text-[10px] text-muted-foreground/60 self-center">
                                +{course.schedules.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* features */}
                        {course.features && course.features.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {course.features.slice(0, 3).map((feature, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-[10px] font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded"
                              >
                                <svg className="w-3 h-3 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* spacer */}
                        <div className="flex-1" />

                        {/* pricing & CTA */}
                        <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-2">
                          <div className="flex items-end justify-between mb-4">
                            <div>
                              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Monthly</p>
                              <p className="text-2xl font-bold text-primary">
                                {formatCurrency(course.monthlyFee, course.currency)}
                              </p>
                            </div>
                            {course.admissionFee > 0 && (
                              <div className="text-right">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Admission</p>
                                <p className="text-base font-semibold">
                                  {formatCurrency(course.admissionFee, course.currency)}
                                </p>
                              </div>
                            )}
                          </div>

                          {course.isEnrollmentOpen ? (
                            <Link
                              href={`/karate/courses/${course.slug}/apply`}
                              className="flex items-center justify-center gap-2 w-full text-center px-4 py-3 bg-gradient-to-r from-primary to-tertiary text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-300 shadow-sm hover:shadow-md text-sm"
                            >
                              Apply Now
                              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                              </svg>
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700/50 text-muted-foreground font-medium rounded-lg cursor-not-allowed text-sm"
                            >
                              Enrollment Closed
                            </button>
                          )}
                        </div>
                      </div>

                      {/* hover accent bar */}
                      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-tertiary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── why choose section ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 mt-20 mb-8"
      >
        <div className="bg-white dark:bg-slate-800 py-16 px-8 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-secondary" />
              <span className="text-xs font-semibold tracking-[0.25em] text-secondary uppercase">
                Why Us
              </span>
              <div className="h-px w-8 bg-secondary" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold">
              Why Choose Our <span className="text-primary">Karate Program</span>?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                  </svg>
                ),
                title: 'Expert Instructors',
                desc: 'Learn from certified black belt instructors with years of teaching experience.',
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                ),
                title: 'All Ages Welcome',
                desc: 'Programs designed for children, adults, and families to train together.',
              },
              {
                icon: (
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                ),
                title: 'Flexible Schedule',
                desc: 'Multiple class times to fit your busy lifestyle.',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center group/card">
                <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover/card:bg-primary/20 dark:group-hover/card:bg-primary/30 transition-colors duration-300">
                  {item.icon}
                </div>
                <h3 className="text-base font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── bottom decoration ── */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={visible ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mt-8 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent origin-center"
      />
    </div>
  );
}
