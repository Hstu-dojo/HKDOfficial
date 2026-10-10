import Content from './page-content';
import { requireAdminPageAccess } from '@/lib/rbac/page-access';
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireAdminPageAccess('/admin/emails/create-account', locale);
  return <Content />;
}
