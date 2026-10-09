"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import SiteLogo from "./site-logo";
import MainNav from "./main-nav";
import { DarkModeSwitch } from "../dark-mode-switch";
import { mainNav } from "@/config/site";
import { cn } from "@/lib/utils";
import { MobileNav } from "./mobile-nav";
import MaxWidthWrapper from "../maxWidthWrapper";
import { useI18n, useCurrentLocale } from "@/locales/client";
import { UserNav } from "./user-nav";
import { OnboardingAlert } from "./onboarding-alert";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const t = useI18n();
  const locale = useCurrentLocale();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed left-0 top-0 z-40 w-full">
      <OnboardingAlert />
      <div
        className={cn(
          "border-b border-border/60 bg-background/95 py-4 backdrop-blur-md transition-shadow duration-200",
          scrolled && "shadow-sm",
        )}
      >
        <MaxWidthWrapper>
          <div className="flex min-h-11 items-center justify-between gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
            <div className="hidden min-w-0 lg:block">
              <MainNav items={mainNav} />
            </div>
            <Link
              href={`/${locale}`}
              className="flex shrink-0 items-center"
              aria-label="Kaizen Karate Academy"
            >
              <SiteLogo
                width={175}
                height={40}
                lightClasses="h-auto w-[145px] sm:w-[175px] dark:hidden"
                darkClasses="hidden h-auto w-[145px] sm:w-[175px] dark:block"
              />
            </Link>
            <div className="flex min-w-0 items-center justify-end gap-2">
              <DarkModeSwitch />
              <div className="hidden lg:block">
                <UserNav />
              </div>
              <a
                href="tel:+8801777-300309"
                className="hidden items-center gap-2 rounded-full border border-foreground/50 px-4 py-2 text-xs text-foreground transition-colors hover:bg-foreground hover:text-background xl:inline-flex"
              >
                <span>{t("cta.callForInfo")}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <MobileNav mainNavItems={mainNav} />
            </div>
          </div>
        </MaxWidthWrapper>
      </div>
    </header>
  );
}
