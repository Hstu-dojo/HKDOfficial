import "../globals.css";
import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Toaster } from "sonner";
import { siteConfig } from "@/config/site";
import BackToTop from "@/components/back-to-top";
import React from "react";

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
    images: [`${siteConfig.url}/og-image.jpg`],
    creator: "shahriar hasan",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
  loginDialogue,
}: {
  children: React.ReactNode;
  loginDialogue?: React.ReactNode;
}) {
  return (
    <body className={`${roboto.className} `}>
      {children}
      {loginDialogue}

      <Toaster richColors />
      <BackToTop />
    </body>
  );
}
