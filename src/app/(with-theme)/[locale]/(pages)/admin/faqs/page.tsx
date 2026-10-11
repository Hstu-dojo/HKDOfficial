import { requireAdminPageAccess } from "@/lib/rbac/page-access";
import FaqManager from "@/components/admin/FaqManager";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPageAccess("/admin/faqs", locale);
  return <FaqManager />;
}
