import { requireAdminPageAccess } from "@/lib/rbac/page-access";
import TestimonialManager from "@/components/admin/TestimonialManager";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireAdminPageAccess("/admin/testimonials", locale);
  return <TestimonialManager />;
}
