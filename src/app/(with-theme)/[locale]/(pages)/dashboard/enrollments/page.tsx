import { Metadata } from 'next';
import StudentEnrollmentDashboard from '@/components/student/StudentEnrollmentDashboard';

export const metadata: Metadata = {
  title: 'My Enrollments | Dashboard',
  description: 'View your karate course enrollments and payments',
};

export default function StudentEnrollmentsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <StudentEnrollmentDashboard />
    </div>
  );
}
