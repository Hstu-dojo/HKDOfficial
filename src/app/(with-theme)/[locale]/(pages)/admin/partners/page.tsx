import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import PartnersManagement from "@/components/admin/partners/PartnersManagement";

export const metadata = {
  title: "Partner Organizations | Admin",
  description: "Manage partner organizations and their admin accounts",
};

export default async function PartnersPage() {
  await requireAdminPageAccess('/admin/partners');
  return <PartnersManagement />;
}
