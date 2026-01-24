import { Metadata } from 'next';
import ProgramList from '@/components/karate/ProgramList';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MaxWidthWrapper from "@/components/maxWidthWrapper";

export const metadata: Metadata = {
  title: 'Events & Programs | HKD Dojo',
  description: 'Upcoming belt tests, competitions, and special training events.',
};

export default function ProgramsList() {
  return (
    <>
      <Header />
      <main className="relative pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
        <MaxWidthWrapper>
            <ProgramList />
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
