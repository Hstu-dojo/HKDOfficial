import CourseApplicationForm from '@/components/karate/CourseApplicationForm';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/connect-db';
import { courses, courseSchedules } from '@/db/schemas/karate/courses';
import { eq } from 'drizzle-orm';

// ISR: revalidate every 120 seconds
export const revalidate = 120;

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

async function getCourse(slug: string) {
  try {
    const course = await db.query.courses.findFirst({
      where: eq(courses.id, slug),
    });

    if (!course) return null;

    const schedules = await db.select().from(courseSchedules).where(eq(courseSchedules.courseId, course.id));

    return {
      ...course,
      slug: course.id,
      imageUrl: course.thumbnailUrl,
      shortDescription: course.description,
      beltLevelFrom: course.minimumBelt,
      beltLevelTo: course.targetBelt,
      durationMonths: course.duration,
      schedules: schedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        location: s.location,
      })),
    };
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
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
