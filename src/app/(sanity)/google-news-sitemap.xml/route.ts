import { loadAllProject } from "../../../../sanity/loader/loadQuery";

/**
 * Google News Sitemap
 * Only includes articles from the last 2 days (Google News requirement)
 * Uses news:news XML tags for better indexing
 */
export async function GET() {
  try {
    // Get articles from the last 2 days (Google News requirement)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const page = 1;
    const limit = 100;
    const initial = await loadAllProject(page, limit);
    const data = initial?.data || [];

    // Filter articles from the last 2 days
    const recentArticles = data.filter((post: any) => {
      const postDate = new Date(post._createdAt || post._updatedAt);
      return postDate >= twoDaysAgo;
    });

    const BASE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://karate.paradox-bd.com";
    const PUBLICATION_NAME = "HSTU Karate Dojo";
    const PUBLICATION_LANGUAGE = "en";

    // Sanitize XML content
    const sanitizeXML = (str: string) => {
      if (!str) return "";
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    // Generate Google News sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recentArticles
  .map((post: any) => {
    // Format date in W3C format (YYYY-MM-DDThh:mm:ssTZD)
    const publicationDate = new Date(post._createdAt || post._updatedAt);
    const formattedDate = publicationDate.toISOString();

    const title = sanitizeXML(post.title || "");
    const url = `${BASE_URL}/blog/post/${post.slug}`;

    return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>${PUBLICATION_LANGUAGE}</news:language>
      </news:publication>
      <news:publication_date>${formattedDate}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
  })
  .join("\n")}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("Error generating Google News sitemap:", error);
    // Return empty but valid sitemap on error
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`,
      {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
        },
      }
    );
  }
}
