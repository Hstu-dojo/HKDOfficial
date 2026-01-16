import CourseApplicationForm from '@/components/karate/CourseApplicationForm';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

async function getCourse(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/courses/${slug}`, {
    cache: 'no-store',
  });
  
  if (!response.ok) {
    return null;
  }
  
  return response.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  
  if (!course) {
    return {
      title: 'Course Not Found',
    };
  }
  
  return {
    title: `Apply for ${course.name} | HKD Dojo`,
    description: `Apply for the ${course.name} karate course. ${course.shortDescription}`,
  };
}

export default async function CourseApplicationPage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourse(slug);
  
  if (!course) {
    notFound();
  }
  
  if (!course.isEnrollmentOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Enrollment Closed</h1>
          <p className="mt-2 text-gray-600">This course is not currently accepting applications.</p>
        </div>
      </div>
    );
  }
  
  return <CourseApplicationForm course={course} />;
}
