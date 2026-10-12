import { requireAdminPageAccess } from "@/lib/rbac/page-access";
import StudentDirectory from "@/components/student-enrollment/StudentDirectory";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPageAccess("/admin/students", locale);
  return <StudentDirectory />;
}
