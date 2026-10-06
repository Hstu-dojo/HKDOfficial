import { loadAllProject } from "../../../../sanity/loader/loadQuery";
import RSS from "rss";
import { toPlainText } from "@portabletext/react";

export async function GET() {
  const page = 1; // specify the desired page number
  const limit = 1500; // specify the number of items per page
  const initial2 = await loadAllProject(page, limit);
  const data = initial2?.data;
  const BASE_URL = process.env.SITE_URL;
  const feed = new RSS({
    title: "Kaizen Karate Academy Blog POSTS",
    description:
      "Kaizen Karate Academy blog posts section. Here you can find updated news of our karate academy",
    site_url: BASE_URL,
    feed_url: `${BASE_URL}/feed.xml`,
    copyright: `${new Date().getFullYear()} - All Rights Reserved by Kaizen Karate Academy.`,
    language: "en",
    pubDate: new Date(),
  });
  data.forEach((post) => {
    feed.item({
      title: post?.title,
      description: post?.overview ? toPlainText(post.overview) : post?.title,
      guid: `${BASE_URL}/blog/post/${post.slug}`,
      url: `${BASE_URL}/blog/post/${post.slug}`,
      date: post?._updatedAt,
      categories: post?.tags?.map(({name})=>name) || []
    });
  });
  return new Response(feed.xml(), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
    },
  });
}
