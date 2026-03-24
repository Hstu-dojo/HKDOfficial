import { NextResponse, type NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

export const SUPPORTED_LOCALES = ["en", "bn", "ne"] as const;
export const DEFAULT_LOCALE: (typeof SUPPORTED_LOCALES)[number] = "en";

const I18nMiddleware = createI18nMiddleware({
  locales: [...SUPPORTED_LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  // urlMappingStrategy: "rewrite",
});

export const withLocaleMiddleware: any = async (request: NextRequest) => {
  // Tenant subdomains must not use locale-prefixed URLs.
  // Make i18n middleware a no-op for those hosts so it won't rewrite to /en/... etc.
  const hostname = (request.headers.get("host") || "").toLowerCase().split(":")[0] || "";
  const tenantBaseDomain = process.env.TENANT_BASE_DOMAIN || "p.hstuma.com";
  if (hostname.endsWith(`.${tenantBaseDomain}`)) {
    return NextResponse.next();
  }

  return I18nMiddleware(request);
};
