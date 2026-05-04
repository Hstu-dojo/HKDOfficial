import CommitteesManagement from '@/components/admin/committees/CommitteesManagement';

export const metadata = {
  title: 'Committee Management | Admin',
  description: 'Create committee terms and manage applications',
};

export default function CommitteesAdminPage() {
  return <CommitteesManagement />;
}