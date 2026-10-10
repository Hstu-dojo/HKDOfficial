import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import RegistrationsManagement from "@/components/admin/registrations/RegistrationsManagement";

export const metadata = {
  title: "Member Registrations | Admin",
  description: "View and manage member onboarding registrations",
};

export default async function RegistrationsPage() {
  await requireAdminPageAccess('/admin/registrations');
  return <RegistrationsManagement />;
}
