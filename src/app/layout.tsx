import "./globals.css";
import { tenantFromHost } from "@/lib/org/host";
import { editorialFonts } from "@/styles/fonts";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  academyName,
  absoluteUrl,
  siteOrigin,
  descriptions,
  localeFor,
  jsonLd,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  applicationName: academyName,
  title: { default: academyName, template: `%s | ${academyName}` },
  description: descriptions.en,
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/AppImages/android/android-launchericon-192-192.png",
  },
  openGraph: {
    type: "website",
    siteName: academyName,
    title: academyName,
    description: descriptions.en,
    images: [absoluteUrl("/og-image.png")],
  },
  twitter: {
    card: "summary_large_image",
    title: academyName,
    description: descriptions.en,
    images: [absoluteUrl("/og-image.png")],
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { PageLoaderProvider } from "@/components/loading/PageLoaderProvider";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const tenant = tenantFromHost(requestHeaders.get("host"));
  const pathname = requestHeaders.get("x-seo-pathname") || "";
  const locale = localeFor(pathname.match(/^\/(en|bn|ne)(?:\/|$)/)?.[1]);

  return (
    <html lang={locale} className={editorialFonts} suppressHydrationWarning>
      <body className="editorial-site">
        {!tenant && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLd({
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "Organization",
                    "@id": absoluteUrl("/#organization"),
                    name: academyName,
                    url: siteOrigin(),
                    logo: absoluteUrl("/logo.png"),
                  },
                  {
                    "@type": "WebSite",
                    "@id": absoluteUrl("/#website"),
                    name: academyName,
                    url: siteOrigin(),
                    publisher: { "@id": absoluteUrl("/#organization") },
                    inLanguage: ["en", "bn", "ne"],
                  },
                ],
              }),
            }}
          />
        )}
        <PageLoaderProvider introEnabled={!tenant}>
          {children}
        </PageLoaderProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
