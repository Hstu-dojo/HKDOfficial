import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import EnrollmentsManagement from "@/components/admin/enrollments/EnrollmentsManagement";

export const metadata = {
  title: "Enrollment Management | Admin",
  description: "Manage student enrollment applications",
};

export default async function EnrollmentsPage() {
  await requireAdminPageAccess('/admin/enrollments');
  return <EnrollmentsManagement />;
}
