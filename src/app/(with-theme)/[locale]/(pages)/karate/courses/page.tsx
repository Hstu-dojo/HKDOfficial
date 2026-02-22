import { Metadata } from 'next';
import KarateCoursesPage from '@/components/karate/KarateCoursesPage';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import { db } from "@/lib/connect-db";
import { courses, courseSchedules } from "@/db/schemas/karate/courses";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: 'Karate Courses | HKD Dojo',
  description: 'Explore our karate courses and start your martial arts journey today. Various packages for kids, adults, and families.',
};

// ISR: revalidate every 120 seconds
export const revalidate = 120;

async function getCourses() {
  try {
    const activeCourses = await db.select().from(courses).where(eq(courses.isActive, true));

    const coursesWithSchedules = await Promise.all(activeCourses.map(async (course) => {
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
          location: s.location
        }))
      };
    }));

    return coursesWithSchedules;
  } catch (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
}

export default async function CoursesPage() {
  const coursesData = await getCourses();

  return (
    <>
      <Header />
      <main className="relative pt-24 pb-16 min-h-screen bg-slate-50 dark:bg-slate-900">
        <MaxWidthWrapper>
            <KarateCoursesPage initialCourses={coursesData} />
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
