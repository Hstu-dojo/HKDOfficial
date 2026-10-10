import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import ProgramTypesManagement from '@/components/admin/programs/ProgramTypesManagement';

export const metadata = {
  title: 'Program Types | Admin',
  description: 'Manage dynamic program types and certificate templates',
};

export default async function ProgramTypesPage() {
  await requireAdminPageAccess('/admin/programs/types');
  return <ProgramTypesManagement />;
}
