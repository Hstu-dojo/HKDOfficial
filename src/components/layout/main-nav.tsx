"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCurrentLocale, useChangeLocale } from "@/locales/client";
import { usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

interface MainNavProps {
  items?: MainNavItem[];
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

export default function MainNav({ items }: MainNavProps) {
  const locale = useCurrentLocale();
  const pathname = usePathname();
  
  return (
    <>
      <NavigationMenu className="hidden lg:block">
        <NavigationMenuList>
          {items &&
            items.map((item) => (
              <NavigationMenuItem key={item.title}>
                {item?.items ? (
                  <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                ) : (
                  item.href && (
                    <Link href={getItemHref(item, locale, pathname)}>
                      <NavigationMenuLink
                        className={navigationMenuTriggerStyle()}
                      >
                        {item.title}
                      </NavigationMenuLink>
                    </Link>
                  )
                )}
                {item?.items ? (
                  <NavigationMenuContent>
                    <ul className="flex w-[220px] flex-col p-4">
                      {item?.items.map((subItem) => (
                        <ListItem
                          key={subItem.title}
                          href={getItemHref(subItem, locale, pathname)}
                          title={subItem.title}
                        ></ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                ) : null}
              </NavigationMenuItem>
            ))}
          <NavigationMenuIndicator />
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 px-3 py-1.5 leading-none no-underline outline-none transition-colors hover:text-primary focus:text-primary",
            className,
          )}
          {...props}
        >
          <div className="text-sm leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
