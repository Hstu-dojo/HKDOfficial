import { requireAdminPageAccess } from "@/lib/rbac/page-access";
import EmailHistory from "@/components/admin/emails/EmailHistory";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPageAccess("/admin/emails", locale);
  return <EmailHistory />;
}
