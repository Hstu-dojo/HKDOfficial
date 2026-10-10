"use client";

import { DarkModeSwitch } from "@/components/dark-mode-switch";

import { useSession } from "@/hooks/useSessionCompat";
import { useAuth } from "@/context/AuthContext";
import { useCurrentLocale } from "@/locales/client";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function AdminHeader() {
  const { data: session } = useSession();
  const { signOut } = useAuth();
  const locale = useCurrentLocale();
  const pathname = usePathname();
  const section = pathname?.split("/admin")[1]?.split("/").filter(Boolean)[0];
  const title = section ? section.replace(/-/g, " ") : "Overview";

  return (
    <header className="portal-header">
      <SidebarTrigger className="shrink-0" />
      <span className="portal-header-title capitalize">{title}</span>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <DarkModeSwitch className="mr-0" />
        <Button
          asChild
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
        >
          <Link href={`/${locale}`}>
            View site <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="min-w-0">
              <p className="truncate">
                {session?.user?.name || "Academy admin"}
              </p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {session?.user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${locale}/dashboard/profile`}>
                Account settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={async () => {
                await signOut();
                window.location.href = `/${locale}`;
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
