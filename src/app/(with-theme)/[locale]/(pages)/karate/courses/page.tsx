import { Metadata } from 'next';
import KarateCoursesPage from '@/components/karate/KarateCoursesPage';

export const metadata: Metadata = {
  title: 'Karate Courses | HKD Dojo',
  description: 'Explore our karate courses and start your martial arts journey today. Various packages for kids, adults, and families.',
};

export default function CoursesPage() {
  return <KarateCoursesPage />;
}
