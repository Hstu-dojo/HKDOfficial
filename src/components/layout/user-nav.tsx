"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSessionCompat";
import { useAuth } from "@/context/AuthContext";
import { getOnboardingStatus } from "@/actions/onboarding-actions";
import { useCurrentLocale, useI18n } from "@/locales/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

export function UserNav() {
  const { data: session, status } = useSession();
  const { signOut } = useAuth();
  const router = useRouter();
  const locale = useCurrentLocale();
  const t = useI18n();
  
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (session?.user) {
        try {
          const result = await getOnboardingStatus();
          setNeedsOnboarding(!result.existing);
        } catch (error) {
          console.error("Failed to check onboarding status", error);
        }
      }
      setCheckingOnboarding(false);
    };

    if (status === 'authenticated' && session?.user) {
      checkOnboardingStatus();
    } else if (status === 'unauthenticated') {
      setCheckingOnboarding(false);
    }
  }, [session, status]);

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="h-9 w-20 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
    );
  }

  // Not logged in - show login button
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <Link
        href={`/${locale}/login`}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-md",
          "text-sm font-semibold",
          "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
          "text-slate-900 dark:text-white",
          "transition-colors"
        )}
      >
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
        <span>{t('header.login') || 'Login'}</span>
      </Link>
    );
  }

  // Logged in - show user dropdown
  const userInitial = session.user.email?.charAt(0).toUpperCase() || 'U';
  const userName = session.user.name || 
                   session.user.email?.split('@')[0] || 
                   'User';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-md",
            "text-sm font-medium",
            "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700",
            "text-slate-900 dark:text-white",
            "transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary/50"
          )}
        >
          {/* Avatar */}
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-white text-xs font-bold">
            {userInitial}
          </div>
          <span className="hidden sm:inline max-w-[100px] truncate">{userName}</span>
          <ChevronDownIcon className="h-4 w-4 text-slate-500" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* User info header */}
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {userName}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {session.user.email}
          </p>
        </div>

        {/* Dashboard */}
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/dashboard`} className="cursor-pointer">
            <Squares2X2Icon className="h-4 w-4 mr-2" />
            {t('header.dashboard') || 'Dashboard'}
          </Link>
        </DropdownMenuItem>

        {/* Profile */}
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/dashboard/profile`} className="cursor-pointer">
            <UserCircleIcon className="h-4 w-4 mr-2" />
            {t('header.profile') || 'Profile'}
          </Link>
        </DropdownMenuItem>

        {/* Onboarding - only show if not completed */}
        {needsOnboarding && !checkingOnboarding && (
          <DropdownMenuItem asChild>
            <Link 
              href={`/${locale}/onboarding`} 
              className="cursor-pointer text-amber-600 dark:text-amber-400"
            >
              <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
              Complete Profile
              <span className="ml-auto flex h-2 w-2 rounded-full bg-amber-500" />
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
          {t('header.logout') || 'Logout'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
