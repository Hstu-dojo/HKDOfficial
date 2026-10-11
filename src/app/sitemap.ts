import type { MetadataRoute } from "next";
import { db } from "@/lib/connect-db";
import { courses, programs, partners, galleryFolders } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  absoluteUrl,
  localizedAlternates,
  publicPages,
  seoLocales,
  partnerOrigin,
} from "@/lib/seo/site";
import { publishedDocuments } from "@/lib/seo/content";
export const revalidate = 600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const addLocalized = (path: string, updated?: Date | null) => {
    for (const locale of seoLocales)
      entries.push({
        url: absoluteUrl(`/${locale}${path}`),
        ...(updated ? { lastModified: updated } : {}),
        alternates: { languages: localizedAlternates(path) },
      });
  };
  Object.keys(publicPages)
    .filter((path) => !["/pricing", "/services", "/dev"].includes(path))
    .forEach((path) => addLocalized(path));
  entries.push({ url: absoluteUrl("/blog") }, { url: absoluteUrl("/notice") });
  const sources = await Promise.allSettled([
    db
      .select({ id: courses.id, updatedAt: courses.updatedAt })
      .from(courses)
      .where(eq(courses.isActive, true)),
    db
      .select({ slug: programs.slug, updatedAt: programs.updatedAt })
      .from(programs)
      .where(eq(programs.isActive, true)),
    db
      .select({ slug: partners.slug, updatedAt: partners.updatedAt })
      .from(partners)
      .where(eq(partners.isActive, true)),
    db
      .select({
        slug: galleryFolders.slug,
        updatedAt: galleryFolders.updatedAt,
      })
      .from(galleryFolders)
      .where(eq(galleryFolders.isPublished, true)),
    publishedDocuments(),
  ]);
  const labels = ["courses", "programs", "branches", "gallery", "notices"];
  sources.forEach((result, index) => {
    if (result.status === "rejected")
      console.error(
        `[SEO sitemap] ${labels[index]} unavailable`,
        result.reason instanceof Error ? result.reason.message : "Query failed",
      );
  });
  if (sources[0].status === "fulfilled")
    sources[0].value.forEach((row) =>
      addLocalized(
        `/karate/courses/${encodeURIComponent(row.id)}`,
        row.updatedAt,
      ),
    );
  if (sources[1].status === "fulfilled")
    sources[1].value.forEach((row) =>
      addLocalized(
        `/karate/programs/${encodeURIComponent(row.slug)}`,
        row.updatedAt,
      ),
    );
  if (sources[2].status === "fulfilled")
    sources[2].value.forEach((row) => {
      if (row.slug && /^[a-z0-9-]+$/i.test(row.slug))
        entries.push({
          url: `${partnerOrigin(row.slug)}/`,
          lastModified: row.updatedAt,
        });
    });
  if (sources[3].status === "fulfilled")
    sources[3].value.forEach((row) =>
      addLocalized(`/gallery/${encodeURIComponent(row.slug)}`, row.updatedAt),
    );
  if (sources[4].status === "fulfilled")
    sources[4].value
      .filter((row) => row._type === "post")
      .forEach((row) =>
        entries.push({
          url: absoluteUrl(`/notice/${encodeURIComponent(row.slug)}`),
          ...(row._updatedAt ? { lastModified: row._updatedAt } : {}),
        }),
      );
  return entries;
}
