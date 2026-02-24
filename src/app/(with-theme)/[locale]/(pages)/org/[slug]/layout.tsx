import { notFound } from 'next/navigation';
import { db } from '@/lib/connect-db';
import { partners } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
    locale: string;
  }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params;

  // Verify partner exists and is active
  const partner = await db.query.partners.findFirst({
    where: eq(partners.slug, slug),
  });

  if (!partner || !partner.isActive) {
    notFound();
  }

  return (
    <>
      <Header />
      {/* Organization sub-nav */}
      <div className="border-b bg-white dark:border-gray-700 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-3 text-sm">
          <a
            href={`/org/${slug}`}
            className="font-semibold text-slate-900 dark:text-slate-100"
          >
            {partner.name}
          </a>
          <a
            href={`/org/${slug}`}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Overview
          </a>
          <a
            href={`/org/${slug}/courses`}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Courses
          </a>
          <a
            href={`/org/${slug}/schedules`}
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Schedules
          </a>
          {(partner.contactEmail || partner.contactPhone) && (
            <a
              href={`/org/${slug}/contact`}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Contact
            </a>
          )}
        </div>
      </div>
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
