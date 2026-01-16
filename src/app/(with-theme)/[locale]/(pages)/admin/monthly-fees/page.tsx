import { Metadata } from 'next';
import MonthlyFeesManagement from '@/components/admin/monthly-fees/MonthlyFeesManagement';

export const metadata: Metadata = {
  title: 'Monthly Fees | Admin',
  description: 'Manage student monthly fee payments',
};

export default function MonthlyFeesPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <MonthlyFeesManagement />
    </div>
  );
}
