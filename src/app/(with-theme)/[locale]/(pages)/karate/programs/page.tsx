import { getBKFEvents } from "@/lib/programs/server";
import ProgramList from "@/components/karate/ProgramList";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import { db } from "@/lib/connect-db";
import { programs } from "@/db/schemas/karate";
import { eq, desc } from "drizzle-orm";

// ISR: revalidate every 120 seconds
export const revalidate = 120;

async function getPrograms() {
  try {
    const publicPrograms = await db.query.programs.findMany({
      where: eq(programs.isActive, true),
      orderBy: [desc(programs.startDate)],
    });
    return { items: publicPrograms, unavailable: false };
  } catch (error) {
    console.error("Error fetching programs:", error);
    return { items: [], unavailable: true };
  }
}

export default async function ProgramsList() {
  const [academy, federation] = await Promise.all([
    getPrograms(),
    getBKFEvents(),
  ]);
  const programsData = academy.items.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    type: p.type,
    startDate: p.startDate?.toISOString() || null,
    endDate: p.endDate?.toISOString() || null,
    registrationDeadline: p.registrationDeadline?.toISOString() || null,
    location: p.location,
    fee: p.fee,
    currency: p.currency,
    isRegistrationOpen: p.isRegistrationOpen,
    maxParticipants: p.maxParticipants,
    currentParticipants: p.currentParticipants,
  }));

  return (
    <>
      <Header />
      <main className="relative min-h-screen bg-background pb-16 pt-32 md:pb-24 md:pt-40">
        <MaxWidthWrapper>
          <ProgramList
            initialPrograms={programsData}
            federation={federation}
            unavailable={academy.unavailable}
            asOf={new Date().toISOString()}
          />
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
