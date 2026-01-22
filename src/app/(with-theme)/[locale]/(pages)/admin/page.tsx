import { db } from "@/lib/connect-db";
import { user } from "@/db/schemas/auth";
import { courses } from "@/db/schemas/karate";
import { galleryImages } from "@/db/schemas/content";
import { count, desc } from "drizzle-orm";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Fetch counts
  const userCountQuery = await db.select({ count: count() }).from(user);
  const courseCountQuery = await db.select({ count: count() }).from(courses);
  const mediaCountQuery = await db.select({ count: count() }).from(galleryImages);

  const stats = {
    users: userCountQuery[0]?.count || 0,
    courses: courseCountQuery[0]?.count || 0,
    media: mediaCountQuery[0]?.count || 0,
  };

  // Fetch recent activity
  const recentUsers = await db.select({
    id: user.id,
    name: user.userName,
    timestamp: user.createdAt,
  })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(5);
  
  const recentCourses = await db.select({
    id: courses.id,
    name: courses.name,
    timestamp: courses.createdAt,
  })
    .from(courses)
    .orderBy(desc(courses.createdAt))
    .limit(5);

  const recentMedia = await db.select({
    id: galleryImages.id,
    title: galleryImages.title,
    publicId: galleryImages.publicId,
    timestamp: galleryImages.createdAt,
  })
    .from(galleryImages)
    .orderBy(desc(galleryImages.createdAt))
    .limit(5);

  // Normalize and combine
  const activity = [
    ...recentUsers.map(u => ({
      id: u.id,
      type: 'USER' as const,
      message: `New user joined: ${u.name || 'Unknown User'}`,
      timestamp: u.timestamp.toISOString(),
      rawTimestamp: u.timestamp,
    })),
    ...recentCourses.map(c => ({
      id: c.id,
      type: 'COURSE' as const,
      message: `New course created: ${c.name}`,
      timestamp: c.timestamp.toISOString(),
      rawTimestamp: c.timestamp,
    })),
    ...recentMedia.map(m => ({
      id: m.id,
      type: 'MEDIA' as const,
      message: `New media uploaded: ${m.title || m.publicId}`,
      timestamp: m.timestamp.toISOString(),
      rawTimestamp: m.timestamp,
    })),
  ]
  .sort((a, b) => b.rawTimestamp.getTime() - a.rawTimestamp.getTime())
  .slice(0, 10)
  .map(({ rawTimestamp, ...rest }) => rest);

  const dashboardData = {
    stats,
    recentActivity: activity,
  };

  return <AdminDashboard dashboardData={dashboardData} />;
}
