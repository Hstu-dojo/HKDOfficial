import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import CoursesManagement from "@/components/admin/courses/CoursesManagement";

export const metadata = {
  title: "Course Management | Admin",
  description: "Manage karate courses",
};

export default async function CoursesPage() {
  await requireAdminPageAccess('/admin/courses');
  return <CoursesManagement />;
}
