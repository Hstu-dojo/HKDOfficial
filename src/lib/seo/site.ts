import type { Metadata } from "next";

export const academyName = "Kaizen Karate Academy";
export const seoLocales = ["en", "bn", "ne"] as const;
export type SeoLocale = (typeof seoLocales)[number];
export function siteOrigin() {
  return new URL(
    process.env.SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://www.hstuma.com",
  ).origin;
}
export function absoluteUrl(path: string) {
  return new URL(path, `${siteOrigin()}/`).toString();
}
export function localeFor(value?: string): SeoLocale {
  return seoLocales.includes(value as SeoLocale) ? (value as SeoLocale) : "en";
}
export const descriptions: Record<SeoLocale, string> = {
  en: "Learn Shito-Ryu karate at Kaizen Karate Academy. Explore our courses, branches, competitions and community in Bangladesh.",
  bn: "কাইজেন কারাতে একাডেমিতে শিতো-রিউ কারাতে শিখুন। বাংলাদেশে আমাদের প্রশিক্ষণ কোর্স, শাখা, প্রতিযোগিতা ও কমিউনিটি সম্পর্কে জানুন।",
  ne: "काइजन कराते एकेडेमीमा शितो-र्यु कराते सिक्नुहोस्। बंगलादेशमा हाम्रा प्रशिक्षण कोर्स, शाखा, प्रतियोगिता र समुदायबारे जान्नुहोस्।",
};
export const publicPages: Record<string, [string, string, string]> = {
  "": [
    "Karate training and community",
    "কারাতে প্রশিক্ষণ ও কমিউনিটি",
    "कराते प्रशिक्षण र समुदाय",
  ],
  "/about": [
    "About our academy",
    "আমাদের একাডেমি সম্পর্কে",
    "हाम्रो एकेडेमीबारे",
  ],
  "/contact": [
    "Contact our academy",
    "আমাদের সঙ্গে যোগাযোগ",
    "हामीलाई सम्पर्क गर्नुहोस्",
  ],
  "/gallery": ["Photo gallery", "ছবি গ্যালারি", "फोटो ग्यालरी"],
  "/karate/courses": [
    "Karate training courses",
    "কারাতে প্রশিক্ষণ কোর্স",
    "कराते प्रशिक्षण कोर्स",
  ],
  "/karate/programs": [
    "Programs and competitions",
    "প্রোগ্রাম ও প্রতিযোগিতা",
    "कार्यक्रम र प्रतियोगिता",
  ],
  "/org": ["Our branches", "আমাদের শাখা", "हाम्रा शाखा"],
  "/committee": ["Academy committee", "একাডেমি কমিটি", "एकेडेमी समिति"],
  "/partner": [
    "Partner with our academy",
    "আমাদের একাডেমির অংশীদার হোন",
    "हाम्रो एकेडेमीको साझेदार बन्नुहोस्",
  ],
  "/services": [
    "Karate training services",
    "কারাতে প্রশিক্ষণ সেবা",
    "कराते प्रशिक्षण सेवा",
  ],
  "/pricing": ["Training fees", "প্রশিক্ষণ ফি", "प्रशिक्षण शुल्क"],
  "/dev": ["Website developer", "ওয়েবসাইট ডেভেলপার", "वेबसाइट विकासकर्ता"],
};
export function localizedAlternates(path: string) {
  return Object.fromEntries([
    ...seoLocales.map((locale) => [locale, absoluteUrl(`/${locale}${path}`)]),
    ["x-default", absoluteUrl(`/en${path}`)],
  ]);
}
export function privatePath(pathname: string) {
  const path = pathname.replace(/^\/(en|bn|ne)(?=\/|$)/, "") || "/";
  return (
    /^\/(admin|dashboard|partner-admin|docs|studio|api|auth|oauth2|settings|login|register|forget|reset-password|onboarding|profile|avatar|search|templates|unauthorized|auth-debug|oauth-error|cert-verify|~offline)(\/|$)/.test(
      path,
    ) || /\/apply(\/|$)/.test(path)
  );
}
export const noIndex: Metadata["robots"] = { index: false, follow: false };
export function pageMetadata({
  path,
  title,
  description,
  locale = "en",
  image,
  index = true,
  localized = false,
}: {
  path: string;
  title: string;
  description?: string | null;
  locale?: string;
  image?: string | null;
  index?: boolean;
  localized?: boolean;
}): Metadata {
  const language = localeFor(locale);
  const summary =
    description
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 300) || descriptions[language];
  const url = absoluteUrl(path);
  const images = [
    {
      url: image || absoluteUrl("/og-image.png"),
      alt: title,
      ...(!image ? { width: 1200, height: 630 } : {}),
    },
  ];
  const localPath = path.replace(/^\/(en|bn|ne)(?=\/|$)/, "");
  return {
    title,
    description: summary,
    alternates: {
      canonical: url,
      ...(localized ? { languages: localizedAlternates(localPath) } : {}),
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : noIndex,
    openGraph: {
      type: "website",
      title,
      description: summary,
      url,
      siteName: academyName,
      locale: { en: "en_US", bn: "bn_BD", ne: "ne_NP" }[language],
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: summary,
      images: images.map((i) => i.url),
    },
  };
}
export function requestMetadata(pathname: string): Metadata {
  const match = pathname.match(/^\/(en|bn|ne)(\/.*)?$/);
  const locale = localeFor(match?.[1]);
  const path = match?.[2]?.replace(/\/$/, "") || "";
  const titles = publicPages[path];
  const title = titles?.[seoLocales.indexOf(locale)] || academyName;
  const summary = path
    ? `${title}. ${descriptions[locale]}`
    : descriptions[locale];
  const metadata = pageMetadata({
    path: pathname || "/en",
    title,
    description: summary,
    locale,
    localized: !!match && !privatePath(pathname),
    index: !privatePath(pathname),
  });
  return {
    ...metadata,
    title: {
      default: `${title} | ${academyName}`,
      template: `%s | ${academyName}`,
    },
  };
}
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function partnerOrigin(slug: string) {
  return `https://${slug}.${process.env.TENANT_BASE_DOMAIN || "p.hstuma.com"}`;
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
