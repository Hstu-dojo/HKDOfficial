import { db } from '@/lib/connect-db';
import { partners, courses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CoursesPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: CoursesPageProps) {
  const { slug } = await params;
  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });
  if (!partner) return { title: 'Not Found' };
  return {
    title: `Courses | ${partner.name}`,
    description: `Explore courses offered by ${partner.name}`,
  };
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { slug } = await params;

  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner) notFound();

  const partnerCourses = await db.query.courses.findMany({
    where: and(eq(courses.partnerId, partner.id), eq(courses.isActive, true)),
    orderBy: (courses, { asc }) => [asc(courses.name)],
  });

  return (
    <MaxWidthWrapper className="py-12">
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
        Courses at {partner.name}
      </h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        {partnerCourses.length} course{partnerCourses.length !== 1 ? 's' : ''} available
      </p>

      {partnerCourses.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">
          No courses are currently available at this venue.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {partnerCourses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg">{course.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                {course.description && (
                  <p className="mb-3 flex-1 text-sm text-slate-600 dark:text-slate-400">
                    {course.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  {course.minimumBelt && (
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Min: {course.minimumBelt}
                    </span>
                  )}
                  {course.duration && (
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      {course.duration} months
                    </span>
                  )}
                  {course.monthlyFee && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      ৳{Number(course.monthlyFee).toLocaleString()}/mo
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </MaxWidthWrapper>
  );
}
