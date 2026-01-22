'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSessionCompat';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useRBAC } from '@/hooks/useRBAC';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Roles that have access to the admin panel
const ADMIN_ACCESS_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'INSTRUCTOR',
  'STAFF',
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const { hasRole, hasAnyRole, permissions, loading: rbacLoading, error: rbacError, localUserId } = useRBAC();
  const router = useRouter();

  // Check if user has admin access via RBAC roles
  const hasAdminAccessByRole = hasAnyRole(ADMIN_ACCESS_ROLES);
  
  // Check if user has ANY permission (meaning they're in the RBAC system)
  const hasAnyPermission = permissions && permissions.permissions && permissions.permissions.length > 0;
  
  // User has admin access if they have an admin role OR if they have any permission in the system
  // This allows users who are assigned permissions to access the admin panel
  const hasAdminAccess = hasAdminAccessByRole || hasAnyPermission;

  // Handle authentication redirect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin');
    }
  }, [status, router]);

  // Loading states
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Redirecting to login...</h2>
        </div>
      </div>
    );
  }

  // RBAC still loading - show admin interface with limited access
  if (rbacLoading) {
    return (
      <div className="flex h-screen bg-muted/40">
        <div
          className={`fixed inset-y-0 left-0 z-50 lg:static lg:inset-0 transform transition-transform duration-200 ease-in-out lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 bg-background border-r`}
        >
          <AdminSidebar />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
          />
          
          <main className="flex-1 overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <LoadingSpinner size="small" className="mr-3" />
                    <p className="text-primary">Loading your permissions...</p>
                  </div>
                </div>
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // No admin access after RBAC loaded
  if (!rbacLoading && !hasAdminAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-lg w-full text-center p-8">
          <div className="bg-card shadow-lg rounded-lg p-6 border border-border">
            <h2 className="text-2xl font-bold text-foreground">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              You don&apos;t have the required permissions to access the admin panel.
            </p>
            
            {/* Debug info - always show for troubleshooting */}
            <div className="mt-4 p-3 bg-muted/50 rounded text-left text-xs">
              <p className="font-semibold text-foreground">Debug Info:</p>
              <p className="text-muted-foreground">
                Local User ID: {localUserId || 'Not found'}
              </p>
              <p className="text-muted-foreground">
                Roles: {permissions?.roles?.map(r => r.name).join(', ') || 'None'}
              </p>
              <p className="text-muted-foreground">
                Permissions Count: {permissions?.permissions?.length || 0}
              </p>
              <p className="text-muted-foreground">
                Has Admin Role: {hasAdminAccessByRole ? 'Yes' : 'No'}
              </p>
              <p className="text-muted-foreground">
                Has Any Permission: {hasAnyPermission ? 'Yes' : 'No'}
              </p>
              {rbacError && (
                <p className="text-destructive mt-2">
                  Error: {rbacError}
                </p>
              )}
              <p className="text-muted-foreground mt-2 text-yellow-600">
                If you&apos;re a SUPER_ADMIN, you may need to run the RBAC seed script
                and assign your role in the userRole table.
              </p>
            </div>

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
    <div className="flex h-screen bg-slate-50 text-slate-900 [&_h1]:text-slate-900 [&_h1]:dark:text-slate-900 [&_h2]:text-slate-900 [&_h2]:dark:text-slate-900 [&_h3]:text-slate-900 [&_h3]:dark:text-slate-900 [&_h4]:text-slate-900 [&_h4]:dark:text-slate-900">
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
        } lg:translate-x-0 bg-white border-r border-slate-200 shadow-sm`}
      >
        <AdminSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
