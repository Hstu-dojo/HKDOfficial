"use client";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveHref } from "../../../../../sanity/lib/utils";
import type { MenuItem } from "../../../../../sanity/lib/sanity_types";
export default function PageSelection({
  menuItems,
}: {
  menuItems: MenuItem[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full">
          Explore <ChevronDown size={14} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/blog">The journal</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/blog#latest">Latest stories</Link>
        </DropdownMenuItem>
        {menuItems
          .filter((item) => item._type !== "home")
          .map((item) => {
            const resolved = resolveHref(item._type, item.slug);
            if (!resolved) return null;
            const href = resolved.startsWith("/blog")
              ? resolved
              : `/blog${resolved}`;
            return (
              <DropdownMenuItem key={href} asChild>
                <Link href={href}>{item.title || "Academy page"}</Link>
              </DropdownMenuItem>
            );
          })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">Academy home</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
