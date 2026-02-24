"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Clock, Award, DollarSign, ArrowRight } from "lucide-react";

interface Course {
  id: string;
  name: string;
  description?: string | null;
  duration?: number | null;
  minimumBelt?: string | null;
  monthlyFee?: string | null;
  thumbnailUrl?: string | null;
  isEnrollmentOpen?: boolean | null;
}

interface OrgCourseShowcaseProps {
  courses: Course[];
  slug: string;
  accentColor?: string | null;
}

export default function OrgCourseShowcase({ courses, slug, accentColor }: OrgCourseShowcaseProps) {
  const accent = accentColor || "#e11d48";

  if (!courses || courses.length === 0) return null;

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex items-end justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Our Courses
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Explore our training programs and find the right fit for you
            </p>
          </div>
          <Link
            href={`/org/${slug}/courses`}
            className="hidden items-center gap-1 text-sm font-semibold transition-colors sm:inline-flex"
            style={{ color: accent }}
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.slice(0, 6).map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -6 }}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              {/* Thumbnail */}
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="flex h-full items-center justify-center text-4xl font-bold text-white/30"
                    style={{
                      background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)`,
                    }}
                  >
                    {course.name.charAt(0)}
                  </div>
                )}
                {course.isEnrollmentOpen && (
                  <span
                    className="absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: accent }}
                  >
                    Enrolling
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {course.name}
                </h3>
                {course.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                    {course.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {course.minimumBelt && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <Award className="h-3 w-3" />
                      {course.minimumBelt}
                    </span>
                  )}
                  {course.duration && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                      <Clock className="h-3 w-3" />
                      {course.duration} mo
                    </span>
                  )}
                  {course.monthlyFee && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                      <DollarSign className="h-3 w-3" />
                      ৳{Number(course.monthlyFee).toLocaleString()}/mo
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile "View All" link */}
        <div className="mt-8 text-center sm:hidden">
          <Link
            href={`/org/${slug}/courses`}
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: accent }}
          >
            View All Courses <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
