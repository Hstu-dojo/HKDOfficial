import { loadAllProject } from "../../../../sanity/loader/loadQuery";
import RSS from "rss";
import { toPlainText } from "@portabletext/react";
import { absoluteUrl, academyName } from "@/lib/seo/site";
export async function GET() {
  const { data = [] } = await loadAllProject(1, 1500);
  const feed = new RSS({
    title: `${academyName} Journal`,
    description:
      "Training stories, competition results and news from our academy.",
    site_url: absoluteUrl("/blog"),
    feed_url: absoluteUrl("/feed.xml"),
    language: "en",
  });
  for (const post of data.filter((post) => post.slug))
    feed.item({
      title: post.title,
      description: post.overview?.length
        ? toPlainText(post.overview)
        : post.title,
      guid: absoluteUrl(`/blog/post/${encodeURIComponent(post.slug)}`),
      url: absoluteUrl(`/blog/post/${encodeURIComponent(post.slug)}`),
      date: post._createdAt || post._updatedAt,
      categories: post.tags || [],
    });
  return new Response(feed.xml(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
    },
  });
}
