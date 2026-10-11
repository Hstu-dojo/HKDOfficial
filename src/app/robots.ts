import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";
export default function robots(): MetadataRoute.Robots {
  // Keep HTML crawlable so search engines can see its noindex metadata.
  // Block machine endpoints that cannot provide indexable content.
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/auth/", "/oauth2/"],
      },
    ],
    sitemap: [
      absoluteUrl("/sitemap.xml"),
      absoluteUrl("/blog/sitemap.xml"),
      absoluteUrl("/google-news-sitemap.xml"),
    ],
  };
}
