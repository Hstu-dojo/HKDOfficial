import { requireAdminPageAccess } from "@/lib/rbac/page-access";
import NoticeManager from "@/components/admin/NoticeManager";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPageAccess("/admin/announcements", locale);
  return <NoticeManager />;
}
