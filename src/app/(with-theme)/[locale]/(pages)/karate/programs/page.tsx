import { Metadata } from 'next';
import ProgramList from '@/components/karate/ProgramList';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import { db } from "@/lib/connect-db";
import { programs } from "@/db/schemas/karate";
import { eq, desc } from "drizzle-orm";

export const metadata: Metadata = {
  title: 'Events & Programs | HKD Dojo',
  description: 'Upcoming belt tests, competitions, and special training events.',
};

// ISR: revalidate every 120 seconds
export const revalidate = 120;

async function getPrograms() {
  try {
    const publicPrograms = await db.query.programs.findMany({
      where: eq(programs.isActive, true),
      orderBy: [desc(programs.startDate)],
    });
    return publicPrograms;
  } catch (error) {
    console.error("Error fetching programs:", error);
    return [];
  }
}

export default async function ProgramsList() {
  const programsData = await getPrograms();

  return (
    <>
      <Header />
      <main className="relative pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
        <MaxWidthWrapper>
            <ProgramList initialPrograms={programsData} />
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
