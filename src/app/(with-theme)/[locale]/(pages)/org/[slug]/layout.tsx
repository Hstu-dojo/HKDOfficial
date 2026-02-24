import { notFound } from 'next/navigation';
import { db } from '@/lib/connect-db';
import { partners, partnerPageSettings } from '@/db/schema';
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

  // Optional: grab accent colour for the nav accent
  const settings = await db.query.partnerPageSettings.findFirst({
    where: eq(partnerPageSettings.partnerId, partner.id),
  });
  const accent = settings?.accentColor || undefined;

  const navLinks = [
    { label: 'Overview', href: `/org/${slug}` },
    { label: 'Courses', href: `/org/${slug}/courses` },
    { label: 'Schedules', href: `/org/${slug}/schedules` },
    ...(partner.contactEmail || partner.contactPhone
      ? [{ label: 'Contact', href: `/org/${slug}/contact` }]
      : []),
  ];

  return (
    <>
      <Header />
      {/* Organization sub-nav */}
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-0 text-sm sm:gap-2">
          <a
            href={`/org/${slug}`}
            className="mr-3 flex-shrink-0 py-3 text-base font-bold text-slate-900 dark:text-white"
            style={accent ? { color: accent } : undefined}
          >
            {settings?.logoUrl ? (
              <span className="flex items-center gap-2">
                <img src={settings.logoUrl} alt="" className="h-6 w-6 rounded" />
                {partner.name}
              </span>
            ) : (
              partner.name
            )}
          </a>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative flex-shrink-0 px-3 py-3 font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
