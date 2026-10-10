import { requireAdminPanelAccess } from "@/lib/rbac/page-access";
import { AdminPermissionsProvider } from "@/context/AdminPermissionsContext";
import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Admin Panel | Karate Dojo",
  description: "Administrative dashboard for managing the karate dojo",
};

export default async function RootAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { permissions } = await requireAdminPanelAccess(locale);
  return (
    <AdminPermissionsProvider permissions={permissions!}>
      <AdminLayout>{children}</AdminLayout>
    </AdminPermissionsProvider>
  );
}
