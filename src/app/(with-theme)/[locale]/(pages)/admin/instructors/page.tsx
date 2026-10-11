import { requireAdminPageAccess } from "@/lib/rbac/page-access";
import AcademyPeopleManager from "@/components/admin/AcademyPeopleManager";
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requireAdminPageAccess("/admin/instructors", locale);
  return <AcademyPeopleManager />;
}
