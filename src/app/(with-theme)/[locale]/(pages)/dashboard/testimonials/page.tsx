import { redirect } from "next/navigation";
import { getRBACContext } from "@/lib/rbac/middleware";
import MemberTestimonial from "@/components/testimonials/MemberTestimonial";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(await getRBACContext())) redirect(`/${locale}/login`);
  return <MemberTestimonial />;
}
