import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import OrgBillingOverview from '@/components/admin/billing/OrgBillingOverview';

export default async function OrgBillingPage() {
  await requireAdminPageAccess('/admin/org-billing');
  return <OrgBillingOverview />;
}
