import ProgramDetails from '@/components/karate/ProgramDetails';

export const metadata = {
  title: 'Program Details | HKD Dojo',
};

export default async function ProgramDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProgramDetails slug={slug} />;
}
