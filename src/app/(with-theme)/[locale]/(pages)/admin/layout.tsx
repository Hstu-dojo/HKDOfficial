import { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";

export const metadata: Metadata = {
  title: "Admin Panel | Karate Dojo",
  description: "Administrative dashboard for managing the karate dojo",
};

export default function RootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRouteGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminRouteGuard>
  );
}