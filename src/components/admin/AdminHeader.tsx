'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/useSessionCompat';
import { useAuth } from '@/context/AuthContext';
import { useRBAC } from '@/hooks/useRBAC';
import { ADMIN_ROLES } from '@/lib/rbac/constants';
import Image from 'next/image';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function AdminHeader({ onToggleSidebar, sidebarOpen }: AdminHeaderProps) {
  const { data: session } = useSession();
  const { signOut } = useAuth();
  const { hasRole } = useRBAC();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    MODERATOR: 'Moderator',
    INSTRUCTOR: 'Instructor',
  };
  const userRoles = ADMIN_ROLES.filter((r) => hasRole(r)).map((r) => ROLE_LABELS[r] ?? r);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left side - Toggle and title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
          
          <h1 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
            Admin Dashboard
          </h1>
          {userRoles.length > 0 && (
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 shrink-0 whitespace-nowrap">
              {userRoles.join(', ')}
            </span>
          )}
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Quick actions */}
          <Link href="/" className="hidden sm:block">
            <Button variant="outline" size="sm" className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
              View Site
            </Button>
          </Link>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded-lg px-2 py-1.5 transition-colors"
              aria-label="User menu"
            >
              {session?.user?.image ? (
                <Image
                  className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700"
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={32}
                  height={32}
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-slate-400 dark:text-slate-500" />
              )}
              <span className="hidden md:block font-medium">
                {session?.user?.name || 'Admin'}
              </span>
            </button>

            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-medium">{session?.user?.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 truncate">{session?.user?.email}</div>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserCircleIcon className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                      Profile Settings
                    </Link>
                    
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        await signOut();
                        window.location.href = '/';
                      }}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
