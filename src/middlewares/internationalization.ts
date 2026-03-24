import { type NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

export const DEFAULT_LOCALE = "en";
export const I18N_LOCALES = [DEFAULT_LOCALE, "bn", "ne"] as const;

const I18nMiddleware = createI18nMiddleware({
  locales: [...I18N_LOCALES],
  defaultLocale: DEFAULT_LOCALE,
  // urlMappingStrategy: "rewrite",
});

export const withLocaleMiddleware: any = async (request: NextRequest) => {
  return I18nMiddleware(request);
};
