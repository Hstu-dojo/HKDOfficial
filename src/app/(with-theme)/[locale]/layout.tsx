import { headers } from "next/headers";
import { requestMetadata } from "@/lib/seo/site";
import type { Metadata } from "next";

import { Toaster } from "sonner";
import BackToTop from "@/components/back-to-top";
import React, { Suspense } from "react";
import { I18nProviderClient } from "@/locales/client";
import { VerificationHandler } from "@/components/layout/verification-handler";

export async function generateMetadata({
  params,
}: Parameters<typeof RootLayout>[0]): Promise<Metadata> {
  const { locale } = await params;
  const pathname = (await headers()).get("x-seo-pathname") || `/${locale}`;
  return requestMetadata(pathname);
}

export default async function RootLayout({
  children,
  loginDialogue,
  params,
}: {
  children: React.ReactNode;
  loginDialogue: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "en";

  return (
    <div className="editorial-public bg-background text-foreground">
      <I18nProviderClient locale={locale}>
        <Suspense fallback={null}>
          <VerificationHandler />
        </Suspense>
        {children}
        {loginDialogue}

        <Toaster richColors />
        <BackToTop />
      </I18nProviderClient>
    </div>
  );
}
