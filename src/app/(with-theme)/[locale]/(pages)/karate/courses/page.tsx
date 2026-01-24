import { Metadata } from 'next';
import KarateCoursesPage from '@/components/karate/KarateCoursesPage';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MaxWidthWrapper from "@/components/maxWidthWrapper";

export const metadata: Metadata = {
  title: 'Karate Courses | HKD Dojo',
  description: 'Explore our karate courses and start your martial arts journey today. Various packages for kids, adults, and families.',
};

export default function CoursesPage() {
  return (
    <>
      <Header />
      <main className="relative pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
        <MaxWidthWrapper>
            <KarateCoursesPage />
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
