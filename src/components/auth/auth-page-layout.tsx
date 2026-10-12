import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveTenantHost } from "@/lib/org/domain-server";
import { getOrgIdentity } from "@/lib/org/server";
import { orgTheme } from "@/lib/org/theme";
import { OrgImage } from "@/components/org/OrgImage";
import "@/styles/org-globals.css";
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

export default async function AuthPageLayout({
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
  const tenant = await resolveTenantHost((await headers()).get("host"));
  const organization = tenant ? await getOrgIdentity(tenant) : null;
  if (tenant && !organization) notFound();
  const actualBrand = organization?.partner.name || brand;
  return (
    <main
      style={orgTheme(organization?.settings.accentColor)}
      className={cn(
        tenant && "org-site",
        "min-h-dvh w-full bg-background lg:grid lg:grid-cols-2",
      )}
    >
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col",
          imageSide === "left" && "lg:order-2",
        )}
      >
        <header className="flex items-center justify-between gap-4 px-6 py-6 sm:px-10">
          <Link
            href={tenant ? "/" : `/${locale}`}
            aria-label={actualBrand}
            className="flex min-w-0 max-w-[65%] items-center gap-3 transition-opacity hover:opacity-80"
          >
            {organization ? (
              <>
                {organization.settings.logoUrl && (
                  <span className="relative h-12 w-12 shrink-0">
                    <OrgImage
                      src={organization.settings.logoUrl}
                      alt={actualBrand}
                      sizes="48px"
                      className="object-contain"
                    />
                  </span>
                )}
                <span className="break-words text-sm font-semibold">
                  {actualBrand}
                </span>
              </>
            ) : (
              <SiteLogo
                width={196}
                height={56}
                lightClasses="h-auto w-40 sm:w-48 dark:hidden"
                darkClasses="hidden h-auto w-40 sm:w-48 dark:block"
              />
            )}
          </Link>
          <Link
            href={alternateHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "shrink-0 rounded-full",
            )}
          >
            {alternateLabel}
          </Link>
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-12 pt-8 sm:px-10 lg:py-12">
          {children}
        </div>
      </div>
      <aside
        className={cn(
          "relative hidden min-h-dvh min-w-0 overflow-hidden bg-secondary lg:flex lg:flex-col lg:justify-end",
          imageSide === "left" && "lg:order-1",
        )}
      >
        <Image
          src={organization?.settings.heroImageUrl || imageSrc}
          alt={actualBrand}
          fill
          priority
          sizes="50vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-purple-950/45 to-purple-800/30" />
        <div className="relative z-10 max-w-2xl p-10 text-white xl:p-14">
          <h2 className="mb-4 text-3xl font-normal leading-tight text-white xl:text-4xl">
            {organization?.partner.name || imageTitle}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-white/90 xl:text-lg">
            {organization?.settings.heroTagline ||
              organization?.partner.description ||
              imageDescription}
          </p>
        </div>
      </aside>
    </main>
  );
}
