import { db } from '@/lib/connect-db';
import { partners } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContactPageProps {
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export async function generateMetadata({ params }: ContactPageProps) {
  const { slug } = await params;
  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });
  if (!partner) return { title: 'Not Found' };
  return {
    title: `Contact | ${partner.name}`,
    description: `Get in touch with ${partner.name}`,
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { slug } = await params;

  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner) notFound();

  return (
    <MaxWidthWrapper className="py-12">
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
        Contact {partner.name}
      </h1>
      <p className="mb-8 text-slate-600 dark:text-slate-400">
        Get in touch with us for enrollment inquiries or more information
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        {partner.contactEmail && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={`mailto:${partner.contactEmail}`}
                className="text-lg text-primary hover:underline"
              >
                {partner.contactEmail}
              </a>
            </CardContent>
          </Card>
        )}

        {partner.contactPhone && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Phone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={`tel:${partner.contactPhone}`}
                className="text-lg text-primary hover:underline"
              >
                {partner.contactPhone}
              </a>
            </CardContent>
          </Card>
        )}

        {partner.location && (
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-slate-700 dark:text-slate-300">{partner.location}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MaxWidthWrapper>
  );
}
