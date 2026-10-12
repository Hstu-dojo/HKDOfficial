import AttendanceWorkspace from "@/components/attendance/AttendanceWorkspace";
import { requireAdminPageAccess } from "@/lib/rbac/page-access";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPageAccess("/admin/attendance", locale);
  return <AttendanceWorkspace admin />;
}
