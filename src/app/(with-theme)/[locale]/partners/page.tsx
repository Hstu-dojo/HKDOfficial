import { db } from '@/lib/connect-db';
import { partners } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function PartnersPage() {
  // Fetch all active partners
  const activePartners = await db.query.partners.findMany({
    where: eq(partners.isActive, true),
    orderBy: (partners, { asc }) => [asc(partners.name)],
  });

  return (
    <>
      <Header />
      <main className="min-h-screen py-16">
        <MaxWidthWrapper>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Training Venues
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Discover our partner training locations across the region
            </p>
          </div>

          {activePartners.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePartners.map((partner) => (
                <Link key={partner.id} href={`/partner/${partner.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle>{partner.name}</CardTitle>
                      {partner.location && (
                        <CardDescription className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {partner.location}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {partner.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">
                          {partner.description}
                        </p>
                      )}
                      <div className="mt-4 text-primary font-medium text-sm flex items-center gap-1">
                        View Details
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-600 dark:text-slate-400">
                  No partner venues are currently available.
                </p>
              </CardContent>
            </Card>
          )}
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
