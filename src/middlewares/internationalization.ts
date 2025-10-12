import { type NextRequest } from "next/server";
import { createI18nMiddleware } from "next-international/middleware";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "bn"],
  defaultLocale: "en",
  // urlMappingStrategy: "rewrite",
});

export const withLocaleMiddleware: any = async (request: NextRequest) => {
  return I18nMiddleware(request);
};
