import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import { Metadata } from 'next';
import MonthlyFeesManagement from '@/components/admin/monthly-fees/MonthlyFeesManagement';

export const metadata: Metadata = {
  title: 'Monthly Fees | Admin',
  description: 'Manage student monthly fee payments',
};

export default async function MonthlyFeesPage() {
  await requireAdminPageAccess('/admin/monthly-fees');
  return <MonthlyFeesManagement />;
}
