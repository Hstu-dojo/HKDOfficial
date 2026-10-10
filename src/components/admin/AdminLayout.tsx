"use client";

import { PortalContent } from "@/components/portal/portal-content";

import { useEffect } from "react";
import { useSession } from "@/hooks/useSessionCompat";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentLocale } from "@/locales/client";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { useRBAC } from "@/hooks/useRBAC";
import { PanelLoader } from "@/components/loading";
import { canAccessAdminRoute } from "@/lib/rbac/admin-route-access";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const { permissions, loading } = useRBAC();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useCurrentLocale();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(
        `/${locale}/login?callbackUrl=${encodeURIComponent(pathname || `/${locale}/admin`)}`,
      );
    }
  }, [status, router, locale, pathname]);

  // The server layout already verified authentication and supplied permissions.
  // Client auth hydration must not replay the route's opening loader.
  if (loading || status === "unauthenticated") return <PanelLoader />;
  if (!permissions || !canAccessAdminRoute(permissions, pathname || "/admin")) {
    return (
      <div className="portal-access-state">
        <h1>Access denied</h1>
        <p>You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <SidebarProvider className="editorial-portal portal-shell">
      <AdminSidebar />
      <SidebarInset className="portal-inset">
        <AdminHeader />
        <PortalContent label={"Admin content"}>{children}</PortalContent>
      </SidebarInset>
    </SidebarProvider>
  );
}
