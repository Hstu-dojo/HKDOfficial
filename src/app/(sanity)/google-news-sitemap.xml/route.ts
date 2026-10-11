import { publishedDocuments } from "@/lib/seo/content";
import { absoluteUrl, academyName } from "@/lib/seo/site";
export const revalidate = 600;
const xml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
export async function GET() {
  const now = Date.now();
  let entries = "";
  try {
    const documents = await publishedDocuments();
    entries = documents
      .filter(
        (row) =>
          row._type === "project" &&
          row.title &&
          row._createdAt &&
          Date.parse(row._createdAt) >= now - 48 * 60 * 60 * 1000 &&
          Date.parse(row._createdAt) <= now,
      )
      .slice(0, 1000)
      .map(
        (row) =>
          `<url><loc>${xml(absoluteUrl(`/blog/post/${encodeURIComponent(row.slug)}`))}</loc><news:news><news:publication><news:name>${xml(academyName)}</news:name><news:language>en</news:language></news:publication><news:publication_date>${row._createdAt}</news:publication_date><news:title>${xml(row.title!)}</news:title></news:news></url>`,
      )
      .join("\n");
  } catch (error) {
    console.error(
      "[SEO] News sitemap source unavailable",
      error instanceof Error ? error.message : "Query failed",
    );
  }
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${entries}</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
      },
    },
  );
}
