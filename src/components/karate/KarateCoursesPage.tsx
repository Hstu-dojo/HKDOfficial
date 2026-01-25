'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
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

const BELT_COLORS: Record<string, string> = {
  white: 'bg-gray-100 border-gray-300',
  yellow: 'bg-yellow-100 border-yellow-400',
  orange: 'bg-orange-100 border-orange-400',
  green: 'bg-green-100 border-green-500',
  blue: 'bg-blue-100 border-blue-500',
  purple: 'bg-purple-100 border-purple-500',
  brown: 'bg-amber-100 border-amber-700',
  black: 'bg-gray-900 text-white border-black',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

import { getPublicCourses } from '@/actions/course-actions';

// ... (keep interface Course)

export default function KarateCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await getPublicCourses();
        if (res.success && res.data) {
           // @ts-ignore - types might slightly mismatch but structure is compatible
           setCourses(res.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white py-20 rounded-xl mb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Karate Courses</h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            Begin your martial arts journey with our expert-led karate programs. 
            Courses available for all ages and skill levels.
          </p>
        </div>
      </div>

      {/* Profile Completion Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <ProfileCompletionBanner variant="inline" />
      </div>

      {/* Courses Grid */
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {courses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <AcademicCapIcon className="h-16 w-16 mx-auto text-slate-400 mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">No courses available</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Please check back later for upcoming courses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg dark:shadow-slate-900/50 overflow-hidden hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700"
              >
                {/* Course Image */}
                <div className="relative h-48 bg-gradient-to-br from-red-600 to-red-800">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <AcademicCapIcon className="h-24 w-24 text-white/30" />
                    </div>
                  )}
                  {/* Belt Level Badge */}
                  {course.beltLevelFrom && (
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${BELT_COLORS[course.beltLevelFrom] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        {course.beltLevelFrom.charAt(0).toUpperCase() + course.beltLevelFrom.slice(1)} Belt
                        {course.beltLevelTo && course.beltLevelTo !== course.beltLevelFrom && (
                          <> → {course.beltLevelTo.charAt(0).toUpperCase() + course.beltLevelTo.slice(1)}</>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Enrollment Status */}
                  <div className="absolute top-4 right-4">
                    {course.isEnrollmentOpen ? (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm">
                        Open
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-500 text-white shadow-sm">
                        Closed
                      </span>
                    )}
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{course.name}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">{course.shortDescription}</p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    {course.targetAudience && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <UserGroupIcon className="h-4 w-4 text-primary" />
                        <span>{course.targetAudience}</span>
                      </div>
                    )}
                    {(course.minAge || course.maxAge) && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <UserGroupIcon className="h-4 w-4 text-primary" />
                        <span>
                          Age: {course.minAge || 0} - {course.maxAge || '∞'} years
                        </span>
                      </div>
                    )}
                    {course.durationMonths && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <ClockIcon className="h-4 w-4 text-primary" />
                        <span>{course.durationMonths} months duration</span>
                      </div>
                    )}
                    {course.maxCapacity && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <UserGroupIcon className="h-4 w-4 text-primary" />
                        <span>{course.currentEnrollment} / {course.maxCapacity} enrolled</span>
                      </div>
                    )}
                  </div>

                  {/* Schedule */}
                  {course.schedules && course.schedules.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <CalendarDaysIcon className="h-4 w-4 text-primary" />
                        <span>Schedule</span>
                      </div>
                      <div className="space-y-1">
                        {course.schedules.slice(0, 3).map((schedule, idx) => (
                          <div key={idx} className="text-xs text-slate-500 dark:text-slate-400">
                            {DAY_NAMES[schedule.dayOfWeek]}: {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            {schedule.location && ` @ ${schedule.location}`}
                          </div>
                        ))}
                        {course.schedules.length > 3 && (
                          <div className="text-xs text-slate-400 dark:text-slate-500">+{course.schedules.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {course.features && course.features.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {course.features.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="inline-flex items-center text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded border border-green-100 dark:border-green-800">
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-4">
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Monthly Fee</p>
                        <p className="text-2xl font-bold text-primary dark:text-red-500">
                          {formatCurrency(course.monthlyFee, course.currency)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Admission Fee</p>
                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(course.admissionFee, course.currency)}
                        </p>
                      </div>
                    </div>

                    {course.isEnrollmentOpen ? (
                      <Link
                        href={`/karate/courses/${course.slug}/apply`}
                        className="block w-full text-center px-4 py-3 bg-gradient-to-r from-primary to-rose-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-md"
                      >
                        Apply Now
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-semibold rounded-lg cursor-not-allowed border border-slate-200 dark:border-slate-600"
                      >
                        Enrollment Closed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-white dark:bg-slate-800 py-16 rounded-3xl my-12 shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Why Choose Our Karate Program?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AcademicCapIcon className="h-8 w-8 text-primary dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Expert Instructors</h3>
              <p className="text-slate-600 dark:text-slate-400">Learn from certified black belt instructors with years of teaching experience.</p>
            </div>
            <div className="text-center p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-primary dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">All Ages Welcome</h3>
              <p className="text-slate-600 dark:text-slate-400">Programs designed for children, adults, and families to train together.</p>
            </div>
            <div className="text-center p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="h-8 w-8 text-primary dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">Flexible Schedule</h3>
              <p className="text-slate-600 dark:text-slate-400">Multiple class times to fit your busy lifestyle.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
