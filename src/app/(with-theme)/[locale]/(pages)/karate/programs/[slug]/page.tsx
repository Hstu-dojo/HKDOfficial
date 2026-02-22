import ProgramDetails from '@/components/karate/ProgramDetails';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { db } from '@/lib/connect-db';
import { programs } from '@/db/schemas/karate';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Program Details | HKD Dojo',
};

// ISR: revalidate every 120 seconds
export const revalidate = 120;

async function getProgram(slug: string) {
  try {
    const program = await db.query.programs.findFirst({
      where: eq(programs.slug, slug),
    });
    return program ?? null;
  } catch (error) {
    console.error("Error fetching program:", error);
    return null;
  }
}

export default async function ProgramDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = await getProgram(slug);

  if (!program) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-slate-50 dark:bg-slate-900">
        <ProgramDetails slug={slug} initialProgram={program} />
      </main>
      <Footer />
    </>
  );
}
