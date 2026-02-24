import { db } from '@/lib/connect-db';
import { partners, courses, members } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface OrgPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: OrgPageProps) {
  const { slug } = await params;
  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner) return { title: 'Not Found' };

  return {
    title: `${partner.name} | HKD Partner`,
    description: partner.description || `Training venue: ${partner.name}`,
  };
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { slug } = await params;

  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner) notFound();

  const [partnerCourses, memberCountResult] = await Promise.all([
    db.query.courses.findMany({
      where: and(eq(courses.partnerId, partner.id), eq(courses.isActive, true)),
    }),
    db
      .select({ value: count() })
      .from(members)
      .where(and(eq(members.partnerId, partner.id), eq(members.isActive, true))),
  ]);

  const memberCount = memberCountResult[0]?.value ?? 0;

  return (
    <MaxWidthWrapper className="py-12">
      {/* Hero Section */}
      <div className="mb-10">
        <h1 className="mb-2 text-4xl font-bold text-slate-900 dark:text-slate-100">
          {partner.name}
        </h1>
        {partner.location && (
          <p className="flex items-center gap-2 text-lg text-slate-600 dark:text-slate-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            {partner.location}
          </p>
        )}
        {partner.description && (
          <p className="mt-4 max-w-2xl text-slate-700 dark:text-slate-300">
            {partner.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{partnerCourses.length}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Active Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{memberCount}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">Active Members</p>
          </CardContent>
        </Card>
      </div>

      {/* Courses Preview */}
      {partnerCourses.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Courses</h2>
            <Link
              href={`/org/${slug}/courses`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View All →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {partnerCourses.slice(0, 6).map((course) => (
              <Card key={course.id} className="transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {course.description && (
                    <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                      {course.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {course.minimumBelt && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 dark:bg-blue-900/30">
                        Min: {course.minimumBelt}
                      </span>
                    )}
                    {course.duration && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 dark:bg-green-900/30">
                        {course.duration} months
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      {(partner.contactEmail || partner.contactPhone) && (
        <Card className="mt-10">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {partner.contactEmail && (
              <p>
                Email:{' '}
                <a
                  href={`mailto:${partner.contactEmail}`}
                  className="text-primary hover:underline"
                >
                  {partner.contactEmail}
                </a>
              </p>
            )}
            {partner.contactPhone && (
              <p>
                Phone:{' '}
                <a
                  href={`tel:${partner.contactPhone}`}
                  className="text-primary hover:underline"
                >
                  {partner.contactPhone}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </MaxWidthWrapper>
  );
}
