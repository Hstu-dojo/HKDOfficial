import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import ProgramsManagement from "@/components/admin/programs/ProgramsManagement";

export const metadata = {
  title: "Program Management | Admin",
  description: "Manage karate programs, belt tests, and events",
};

export default async function ProgramsPage() {
  await requireAdminPageAccess('/admin/programs');
  return <ProgramsManagement />;
}
