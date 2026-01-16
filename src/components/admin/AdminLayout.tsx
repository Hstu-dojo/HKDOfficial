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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Redirecting to login...</h2>
        </div>
      </div>
    );
  }

  // RBAC still loading - show admin interface with limited access
  if (rbacLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div
          className={`fixed inset-y-0 left-0 z-50 lg:static lg:inset-0 transform transition-transform duration-200 ease-in-out lg:transform-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <LoadingSpinner size="small" className="mr-3" />
                    <p className="text-blue-800">Loading your permissions...</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-lg w-full text-center p-8">
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-gray-600">
              You don&apos;t have the required permissions to access the admin panel.
            </p>
            
            {/* Debug info for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-left text-xs">
                <p className="font-semibold text-gray-700">Debug Info:</p>
                <p className="text-gray-600">
                  Local User ID: {localUserId || 'Not found'}
                </p>
                <p className="text-gray-600">
                  Roles: {permissions?.roles?.map(r => r.name).join(', ') || 'None'}
                </p>
                <p className="text-gray-600">
                  Permissions: {permissions?.permissions?.length || 0}
                </p>
                {rbacError && (
                  <p className="text-red-600 mt-2">
                    Error: {rbacError}
                  </p>
                )}
                <p className="text-gray-600 mt-2 text-yellow-600">
                  If you&apos;re a SUPER_ADMIN, you may need to run the RBAC seed script
                  and assign your role in the userRole table.
                </p>
              </div>
            )}

            <div className="mt-6 space-x-4">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
              Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and has admin access
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
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
