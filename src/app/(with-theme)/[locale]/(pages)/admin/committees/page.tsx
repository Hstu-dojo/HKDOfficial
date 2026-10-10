import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import CommitteesManagement from '@/components/admin/committees/CommitteesManagement';

export const metadata = {
  title: 'Committee Management | Admin',
  description: 'Create committee terms and manage applications',
};

export default async function CommitteesAdminPage() {
  await requireAdminPageAccess('/admin/committees');
  return <CommitteesManagement />;
}