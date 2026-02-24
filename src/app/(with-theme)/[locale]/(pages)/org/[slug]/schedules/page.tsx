import { db } from '@/lib/connect-db';
import { partners, courses, courseSchedules } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchedulesPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export async function generateMetadata({ params }: SchedulesPageProps) {
  const { slug } = await params;
  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });
  if (!partner) return { title: 'Not Found' };
  return {
    title: `Schedules | ${partner.name}`,
    description: `Class schedules at ${partner.name}`,
  };
}

export default async function SchedulesPage({ params }: SchedulesPageProps) {
  const { slug } = await params;

  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner) notFound();

  // Get active courses for this partner
  const partnerCourses = await db.query.courses.findMany({
    where: and(eq(courses.partnerId, partner.id), eq(courses.isActive, true)),
  });

  const courseIds = partnerCourses.map((c) => c.id);

  // Get schedules for those courses
  let schedules: any[] = [];
  if (courseIds.length > 0) {
    const allSchedules = await db.query.courseSchedules.findMany();
    schedules = allSchedules
      .filter((s: any) => courseIds.includes(s.courseId))
      .map((s: any) => {
        const course = partnerCourses.find((c) => c.id === s.courseId);
        return {
          ...s,
          courseName: course?.name ?? 'Unknown',
          dayName: DAY_NAMES[s.dayOfWeek] ?? `Day ${s.dayOfWeek}`,
        };
      })
      .sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek);
  }

  // Group by day
  const grouped: Record<string, any[]> = {};
  for (const s of schedules) {
    if (!grouped[s.dayName]) grouped[s.dayName] = [];
    grouped[s.dayName].push(s);
  }

  return (
    <MaxWidthWrapper className="py-12">
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
        Class Schedule
      </h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        Weekly class timetable at {partner.name}
      </p>

      {Object.keys(grouped).length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">
          No schedules are currently available.
        </p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day}>
              <h2 className="mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {day}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s: any, i: number) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{s.courseName}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 dark:text-slate-400">
                      <p>
                        {s.startTime} — {s.endTime}
                      </p>
                      {s.location && <p className="mt-1">📍 {s.location}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </MaxWidthWrapper>
  );
}
