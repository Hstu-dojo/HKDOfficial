import ProgramDetails from '@/components/karate/ProgramDetails';

export const metadata = {
  title: 'Program Details | HKD Dojo',
};

export default function ProgramDetailsPage({ params }: { params: { slug: string } }) {
  return <ProgramDetails slug={params.slug} />;
}
