"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteLogo from "@/components/layout/site-logo";
import { DarkModeSwitch } from "@/components/dark-mode-switch";
import { noticeLocale } from "@/lib/notices/copy";
const labels = {
  en: { home: "Academy", blog: "Journal" },
  bn: { home: "একাডেমি", blog: "জার্নাল" },
  ne: { home: "एकेडेमी", blog: "जर्नल" },
};
export default function NoticeShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = noticeLocale(useSearchParams()?.get("lang") || undefined);
  return (
    <div lang={locale}>
      <header className="fixed inset-x-0 top-0 z-40 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4">
          <Link href={`/${locale}`} aria-label="Kaizen Karate Academy">
            <SiteLogo
              width={175}
              height={40}
              lightClasses="h-auto w-[130px] sm:w-[175px] dark:hidden"
              darkClasses="hidden h-auto w-[130px] sm:w-[175px] dark:block"
            />
          </Link>
          <nav
            className="flex items-center gap-3 text-xs sm:gap-6 sm:text-sm"
            aria-label={labels[locale].home}
          >
            <Link href={`/${locale}`} className="hover:text-primary">
              {labels[locale].home}
            </Link>
            <Link href="/blog" className="hidden hover:text-primary sm:block">
              {labels[locale].blog}
            </Link>
            <DarkModeSwitch />
          </nav>
        </div>
      </header>
      <main className="pt-20 text-foreground">{children}</main>
    </div>
  );
}
