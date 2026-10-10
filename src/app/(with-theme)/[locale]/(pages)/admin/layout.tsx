import { requireAdminPanelAccess } from '@/lib/rbac/page-access';
import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const metadata: Metadata = {
  title: "Admin Panel | Karate Dojo",
  description: "Administrative dashboard for managing the karate dojo",
};

export default async function RootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminPanelAccess();
  return (
    <AdminLayout>{children}</AdminLayout>
  );
}