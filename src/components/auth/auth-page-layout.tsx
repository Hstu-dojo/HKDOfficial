import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import SiteLogo from "@/components/layout/site-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthPageLayoutProps {
  children: ReactNode;
  locale: string;
  brand: string;
  alternateHref: string;
  alternateLabel: string;
  imageSrc: string;
  imageSide: "left" | "right";
  imageTitle: string;
  imageDescription: string;
}

export default function AuthPageLayout({
  children,
  locale,
  brand,
  alternateHref,
  alternateLabel,
  imageSrc,
  imageSide,
  imageTitle,
  imageDescription,
}: AuthPageLayoutProps) {
  return (
    <main className="min-h-dvh w-full bg-background lg:grid lg:grid-cols-2">
      <div className={cn("flex min-h-dvh min-w-0 flex-col", imageSide === "left" && "lg:order-2")}>
        <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
          <Link href={`/${locale}`} aria-label={brand} className="shrink-0 transition-opacity hover:opacity-80">
            <SiteLogo
              width={196}
              height={56}
              lightClasses="h-auto w-40 sm:w-48 dark:hidden"
              darkClasses="hidden h-auto w-40 sm:w-48 dark:block"
            />
          </Link>
          <Link href={alternateHref} className={cn(buttonVariants({ variant: "outline" }), "shrink-0 rounded-full")}>
            {alternateLabel}
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-12 pt-8 sm:px-10 lg:py-12">
          {children}
        </div>
      </div>
      <aside className={cn("relative hidden min-h-dvh min-w-0 overflow-hidden bg-secondary lg:flex lg:flex-col lg:justify-end", imageSide === "left" && "lg:order-1")}>
        <Image src={imageSrc} alt={brand} fill priority sizes="50vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10" />
        <div className="relative z-10 max-w-2xl p-10 text-white xl:p-14">
          <h2 className="mb-4 text-3xl font-normal leading-tight text-white xl:text-4xl">{imageTitle}</h2>
          <p className="max-w-xl text-base leading-relaxed text-white/90 xl:text-lg">{imageDescription}</p>
        </div>
      </aside>
    </main>
  );
}
