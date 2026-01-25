"use client";

import * as React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment, usePathname, useRouter } from "next/navigation";
import SiteLogo from "./site-logo";
import { cn } from "@/lib/utils";
import { useCurrentLocale, useI18n } from "@/locales/client";
import { useSession } from "@/hooks/useSessionCompat";
import { useAuth } from "@/context/AuthContext";
import { getOnboardingStatus } from "@/actions/onboarding-actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  UserCircleIcon, 
  ArrowRightOnRectangleIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon
} from "@heroicons/react/24/outline";

interface MobileNavProps {
  mainNavItems?: MainNavItem[];
  triggerIcon?: string;
}

// Helper to get the href for a nav item
const getItemHref = (item: NavItem, locale: string, currentPath: string): string => {
  // If this is a locale switcher item, switch the locale in the current path
  if (item.locale) {
    // Get the path without locale prefix
    const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
    return `/${item.locale}${pathWithoutLocale}`;
  }
  
  // If skipLocale is true, return the href as-is
  if (item.skipLocale && item.href) {
    return item.href;
  }
  
  // Default: prefix with locale
  return item.href ? `/${locale}${item.href}` : '#';
};

export function MobileNav({
  mainNavItems,
  triggerIcon = "default",
}: MobileNavProps) {
  const segment = useSelectedLayoutSegment();
  const [isOpen, setIsOpen] = React.useState(false);
  const locale = useCurrentLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useI18n();
  
  const { data: session, status } = useSession();
  const { signOut } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = React.useState(false);

  React.useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (session?.user) {
        try {
          const result = await getOnboardingStatus();
          setNeedsOnboarding(!result.existing);
        } catch (error) {
          console.error("Failed to check onboarding status", error);
        }
      }
    };

    if (status === 'authenticated' && session?.user) {
      checkOnboardingStatus();
    }
  }, [session, status]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push(`/${locale}`);
    router.refresh();
  };

  const isLoggedIn = status === 'authenticated' && session?.user;
  const userName = session?.user?.user_metadata?.full_name || 
                   session?.user?.user_metadata?.name ||
                   session?.user?.email?.split('@')[0] || 
                   'User';

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {triggerIcon === "default" && (
        <SheetTrigger asChild>
          <button className="group flex h-8 w-8 items-center justify-center rounded-full border transition-colors hover:border-transparent hover:bg-primary focus:border-transparent focus:bg-primary dark:border-transparent dark:bg-white/[.15] dark:hover:bg-primary lg:ml-5 lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              className="h-4 w-4 transition-colors group-hover:fill-white group-focus:fill-white dark:fill-white"
            >
              <path fill="none" d="M0 0h24v24H0z"></path>
              <path d="M18 18v2H6v-2h12zm3-7v2H3v-2h18zm-3-7v2H6V4h12z"></path>
            </svg>
            <span className="sr-only">Toggle Menu</span>
          </button>
        </SheetTrigger>
      )}

      {triggerIcon === "style-2" && (
        <SheetTrigger asChild>
          <button className="group ml-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors lg:ml-5 lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              className="h-6 w-6 fill-foreground transition-colors group-hover:fill-primary group-focus:fill-primary dark:fill-white"
            >
              <path d="M3 4H21V6H3V4ZM3 11H21V13H3V11ZM3 18H21V20H3V18Z"></path>
            </svg>
            <span className="sr-only">Toggle Menu</span>
          </button>
        </SheetTrigger>
      )}
      <SheetContent side="left" className="w-full pl-1 pr-0 sm:max-w-full">
        <div className="px-7">
          <Link
            href={`/${locale}`}
            className="mr-12 block shrink-0"
            onClick={() => setIsOpen(false)}
          >
            <SiteLogo
              width={96}
              height={30}
              lightClasses="dark:hidden"
              darkClasses="hidden dark:block"
            />
          </Link>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="pl-1 pr-7">
            <Accordion
              type="multiple"
              defaultValue={
                mainNavItems && mainNavItems.map((item) => item.title)
              }
              className="w-full"
            >
              {mainNavItems?.map((item, index) => (
                <React.Fragment key={index}>
                  {item?.items ? (
                    <AccordionItem value={item.title}>
                      <AccordionTrigger className="text-sm">
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col space-y-2">
                          {item.items?.map((subItem, subIndex) =>
                            subItem.href || subItem.locale ? (
                              <MobileLink
                                key={subIndex}
                                href={getItemHref(subItem, locale, pathname)}
                                segment={String(segment)}
                                setIsOpen={setIsOpen}
                                disabled={subItem.disabled}
                              >
                                {subItem.title}
                              </MobileLink>
                            ) : (
                              <div
                                key={subIndex}
                                className="text-muted-foreground transition-colors"
                              >
                                {subItem.title}
                              </div>
                            ),
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ) : (
                    item.href && (
                      <div>
                        <Link
                          href={getItemHref(item, locale, pathname)}
                          className="block border-b py-4 text-sm transition-colors hover:text-primary focus:text-primary"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.title}
                        </Link>
                      </div>
                    )
                  )}
                </React.Fragment>
              ))}
            </Accordion>

            {/* User Section */}
            <div className="mt-6 border-t pt-6">
              {isLoggedIn ? (
                <div className="space-y-1">
                  {/* User info */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-white font-bold">
                      {session?.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  </div>

                  {/* Dashboard link */}
                  <Link
                    href={`/${locale}/dashboard`}
                    className="flex items-center gap-3 py-3 text-sm transition-colors hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                    {t('header.dashboard') || 'Dashboard'}
                  </Link>

                  {/* Profile link */}
                  <Link
                    href={`/${locale}/dashboard/profile`}
                    className="flex items-center gap-3 py-3 text-sm transition-colors hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    {t('header.profile') || 'Profile'}
                  </Link>

                  {/* Onboarding link - only if needed */}
                  {needsOnboarding && (
                    <Link
                      href={`/${locale}/onboarding`}
                      className="flex items-center gap-3 py-3 text-sm text-amber-600 dark:text-amber-400 transition-colors hover:text-amber-700"
                      onClick={() => setIsOpen(false)}
                    >
                      <ClipboardDocumentListIcon className="h-5 w-5" />
                      {t('header.completeProfile') || 'Complete Profile'}
                      <span className="ml-auto flex h-2 w-2 rounded-full bg-amber-500" />
                    </Link>
                  )}

                  {/* Logout button */}
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 py-3 text-sm text-red-600 dark:text-red-400 transition-colors hover:text-red-700"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    {t('header.logout') || 'Logout'}
                  </button>
                </div>
              ) : (
                <Link
                  href={`/${locale}/login`}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-gradient-to-r from-primary to-tertiary text-white font-semibold text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  {t('header.login') || 'Login'}
                </Link>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface MobileLinkProps extends React.PropsWithChildren {
  href: string;
  disabled?: boolean;
  segment: string;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function MobileLink({
  children,
  href,
  disabled,
  segment,
  setIsOpen,
}: MobileLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors hover:text-primary",
        href.includes(segment) && "text-foreground",
        disabled && "pointer-events-none opacity-60",
      )}
      onClick={() => setIsOpen(false)}
    >
      {children}
    </Link>
  );
}
