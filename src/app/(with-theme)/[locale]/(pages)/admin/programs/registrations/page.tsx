import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import ProgramRegistrations from "@/components/admin/programs/ProgramRegistrations";


export const metadata = {
  title: "Program Registrations | Admin",
  description: "Manage registrations for programs",
};

export default async function RegistrationsPage() {
  await requireAdminPageAccess('/admin/programs/registrations');
  return <ProgramRegistrations />;
}
