import { notFound } from 'next/navigation';
import { db } from '@/lib/connect-db';
import { partners, courses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface PartnerPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function PartnerPage({ params }: PartnerPageProps) {
  const { slug } = await params;

  // Fetch partner by slug
  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner) {
    notFound();
  }

  // Fetch courses for this partner
  const partnerCourses = await db.query.courses.findMany({
    where: and(
      eq(courses.partnerId, partner.id),
      eq(courses.isActive, true)
    ),
  });

  return (
    <>
      <Header />
      <main className="min-h-screen py-16">
        <MaxWidthWrapper>
          {/* Partner Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {partner.name}
            </h1>
            {partner.location && (
              <p className="text-lg text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {partner.location}
              </p>
            )}
          </div>

          {/* Partner Description */}
          {partner.description && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 dark:text-slate-300">
                  {partner.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          {(partner.contactEmail || partner.contactPhone) && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {partner.contactEmail && (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <a href={`mailto:${partner.contactEmail}`} className="text-primary hover:underline">
                      {partner.contactEmail}
                    </a>
                  </div>
                )}
                {partner.contactPhone && (
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <a href={`tel:${partner.contactPhone}`} className="text-primary hover:underline">
                      {partner.contactPhone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Available Courses */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Available Courses
            </h2>
            {partnerCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partnerCourses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{course.name}</CardTitle>
                      {course.nameBangla && (
                        <CardDescription>{course.nameBangla}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                        {course.description}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Duration:</span>
                          <span className="font-medium">{course.duration} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Monthly Fee:</span>
                          <span className="font-medium">{course.currency} {(course.monthlyFee / 100).toFixed(2)}</span>
                        </div>
                      </div>
                      <Link 
                        href={`/courses/${course.id}`}
                        className="mt-4 block w-full text-center bg-primary text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        View Details
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    No courses are currently available at this venue.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
