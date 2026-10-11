import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import { publishedDocuments } from "@/lib/seo/content";
export const revalidate = 600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let documents: Awaited<ReturnType<typeof publishedDocuments>> = [];
  try {
    documents = await publishedDocuments();
  } catch (error) {
    console.error(
      "[SEO] Blog sitemap source unavailable",
      error instanceof Error ? error.message : "Query failed",
    );
  }
  return [
    { url: absoluteUrl("/blog") },
    ...documents
      .filter(
        (row) =>
          row._type === "project" ||
          (row._type === "page" && row.slug !== "post"),
      )
      .map((row) => ({
        url: absoluteUrl(
          `/blog/${row._type === "project" ? "post/" : ""}${encodeURIComponent(row.slug)}`,
        ),
        ...(row._updatedAt ? { lastModified: row._updatedAt } : {}),
      })),
  ];
}
