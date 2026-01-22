'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/useSessionCompat';
import { useAuth } from '@/context/AuthContext';
import { useRBAC } from '@/hooks/useRBAC';
import Image from 'next/image';
import { 
  Bars3Icon, 
  XMarkIcon, 
  BellIcon, 
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

  const userRoles = [];
  if (hasRole('SUPER_ADMIN')) userRoles.push('Super Admin');
  if (hasRole('ADMIN')) userRoles.push('Admin');
  if (hasRole('MODERATOR')) userRoles.push('Moderator');
  if (hasRole('INSTRUCTOR')) userRoles.push('Instructor');

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left side - Toggle and breadcrumb */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            {sidebarOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
          
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-semibold text-slate-900">
              Admin Dashboard
            </h1>
            {userRoles.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                {userRoles.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Right side - Actions and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
            <BellIcon className="h-6 w-6" />
          </button>

          {/* Quick actions */}
          <div className="hidden sm:flex items-center space-x-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="text-slate-700 border-slate-300 hover:bg-slate-50">
                View Site
              </Button>
            </Link>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-sm text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 rounded-full p-2 transition-colors"
            >
              {session?.user?.image ? (
                <Image
                  className="h-8 w-8 rounded-full border border-slate-200"
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  width={32}
                  height={32}
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-slate-400" />
              )}
              <span className="hidden sm:block font-medium">
                {session?.user?.name || 'Admin'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                    <div className="font-medium">{session?.user?.name}</div>
                    <div className="text-gray-500">{session?.user?.email}</div>
                  </div>
                  
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Profile Settings
                  </Link>
                  
                  <button
                    onClick={async () => {
                      setShowUserMenu(false);
                      await signOut();
                      window.location.href = '/';
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Sign Out
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
