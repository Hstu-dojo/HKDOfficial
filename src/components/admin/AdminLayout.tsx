'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSessionCompat';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useRBAC } from '@/hooks/useRBAC';
import { PageLoader } from '@/components/loading';
import { canAccessAdminRoute } from '@/lib/rbac/admin-route-access';

interface AdminLayoutProps {
  children: React.ReactNode;
}

import { usePathname } from 'next/navigation';

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const { permissions, loading: rbacLoading } = useRBAC();
  const router = useRouter();
  const pathname = usePathname();

  const hasAdminAccess = !!permissions && canAccessAdminRoute(permissions, pathname || '/admin');

  // Check if current page should bypass max-width constraint
  const isFullWidthPage = pathname?.includes('/admin/gallery');

  // Handle authentication redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin');
    }
  }, [status, router]);

  // Handle access denied redirect after RBAC fully loads
  useEffect(() => {
    if (!rbacLoading && status === 'authenticated' && !hasAdminAccess) {
      // Optional: redirect to home after a delay, or just show access denied
    }
  }, [rbacLoading, status, hasAdminAccess]);

  // CRITICAL: Show loading screen until BOTH session AND RBAC are fully loaded
  // This prevents any flash of admin content for unauthorized users
  if (status === 'loading' || rbacLoading) {
    return <PageLoader variant="admin" />;
  }

  // Not authenticated - redirect handled by useEffect
  if (status === 'unauthenticated') {
    return (
      <div className="editorial-portal min-h-screen flex flex-col items-center justify-center bg-muted dark:bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-14 w-14 rounded-full border-[3px] border-border dark:border-border" />
            <div className="absolute inset-0 h-14 w-14 rounded-full border-[3px] border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
          </div>
          <p className="text-sm font-medium text-foreground dark:text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // No admin access after RBAC loaded
  if (!hasAdminAccess) {
    return (
      <div className="editorial-portal min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-lg w-full text-center p-8">
          <div className="bg-card shadow-lg rounded-lg p-6 border border-border">
            <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              You don&apos;t have the required permissions to access the admin panel.
            </p>

            <div className="mt-6 space-x-4">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
              >
                Go Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and has admin access
  return (
    <div className="editorial-portal flex h-[100dvh] bg-muted dark:bg-background text-foreground dark:text-foreground">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:static lg:inset-0 transform transition-transform duration-200 ease-in-out lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <AdminSidebar onLinkClick={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className={isFullWidthPage ? "px-4 sm:px-6 md:px-8 w-full" : "max-w-7xl mx-auto px-4 sm:px-6 md:px-8"}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
