import { StructuredData } from "@/components/seo/StructuredData";
import { breadcrumbSchema, absoluteUrl, academyName } from "@/lib/seo/site";
import { pageMetadata, noIndex } from "@/lib/seo/site";
import ProgramDetails from "@/components/karate/ProgramDetails";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { db } from "@/lib/connect-db";
import { programs } from "@/db/schemas/karate";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const program = await getProgram(slug);
  if (!program) return { title: "Program not found", robots: noIndex };
  return pageMetadata({
    path: `/${locale}/karate/programs/${encodeURIComponent(slug)}`,
    title: program.title,
    description: program.description,
    locale,
    image: program.bannerUrl || program.thumbnailUrl,
    localized: true,
  });
}

// ISR: revalidate every 120 seconds
export const revalidate = 120;

async function getProgram(slug: string) {
  try {
    const program = await db.query.programs.findFirst({
      where: and(eq(programs.slug, slug), eq(programs.isActive, true)),
    });
    return program ?? null;
  } catch (error) {
    console.error("Error fetching program:", error);
    return null;
  }
}

export default async function ProgramDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const program = await getProgram(slug);

  if (!program) {
    notFound();
  }

  return (
    <>
      <StructuredData
        data={breadcrumbSchema([
          { name: academyName, path: `/${locale}` },
          { name: "Programs", path: `/${locale}/karate/programs` },
          {
            name: program.title,
            path: `/${locale}/karate/programs/${encodeURIComponent(slug)}`,
          },
        ])}
      />
      {program.startDate && program.location && (
        <StructuredData
          data={{
            "@context": "https://schema.org",
            "@type": "Event",
            name: program.title,
            description: program.description || undefined,
            startDate: program.startDate.toISOString(),
            endDate: program.endDate?.toISOString(),
            image: program.bannerUrl || program.thumbnailUrl || undefined,
            url: absoluteUrl(
              `/${locale}/karate/programs/${encodeURIComponent(slug)}`,
            ),
            location: {
              "@type": "Place",
              name: program.location,
              address: program.location,
            },
            organizer: {
              "@type": "Organization",
              name: academyName,
              url: absoluteUrl("/"),
            },
          }}
        />
      )}
      <Header />
      <main className="public-page public-page-inset">
        <ProgramDetails slug={slug} initialProgram={program} />
      </main>
      <Footer />
    </>
  );
}
