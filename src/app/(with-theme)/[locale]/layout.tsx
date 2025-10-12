import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Toaster } from "sonner";
import { siteConfig } from "@/config/site";
import BackToTop from "@/components/back-to-top";
import React from "react";
import { I18nProviderClient } from "@/locales/client";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
  applicationName: siteConfig.name,
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  manifest: "/manifest.json",
  keywords: siteConfig.keywords,
  authors: [
    {
      name: "Shahriar Hasan",
      url: "https://shahriarhasan.vercel.app",
    },
  ],
  creator: "Shahriar Hasan",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.png`],
    creator: "shahriar hasan",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
  loginDialogue,
  params,
}: {
  children: React.ReactNode;
  loginDialogue?: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  return (
    <body
      className={`${roboto.className} dark:bg-slate-850 dark:text-slate-200`}
    >
      <I18nProviderClient locale={locale}>
        {children}
        {loginDialogue}

        <Toaster richColors />
        <BackToTop />
      </I18nProviderClient>
    </body>
  );
}
