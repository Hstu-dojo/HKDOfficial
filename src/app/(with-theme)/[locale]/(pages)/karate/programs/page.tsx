import { Metadata } from 'next';
import ProgramList from '@/components/karate/ProgramList';

export const metadata: Metadata = {
  title: 'Events & Programs | HKD Dojo',
  description: 'Upcoming belt tests, competitions, and special training events.',
};

export default function ProgramsList() {
  return <ProgramList />;
}
