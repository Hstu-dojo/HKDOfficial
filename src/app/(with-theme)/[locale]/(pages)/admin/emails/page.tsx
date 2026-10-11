import { requireAdminPageAccess } from "@/lib/rbac/page-access";
import EmailCenter from "@/components/admin/emails/EmailCenter";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPageAccess("/admin/emails", locale);
  return <EmailCenter />;
}
