import ProgramDetails from '@/components/karate/ProgramDetails';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export const metadata = {
  title: 'Program Details | HKD Dojo',
};

export default async function ProgramDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-slate-50 dark:bg-slate-900">
        <ProgramDetails slug={slug} />
      </main>
      <Footer />
    </>
  );
}
