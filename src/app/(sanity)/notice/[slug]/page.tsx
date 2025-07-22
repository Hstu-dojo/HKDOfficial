// ./app/[slug]/page.tsx

import { QueryParams, SanityDocument } from "next-sanity";
import { draftMode } from "next/headers";

import { POSTS_QUERY, POST_QUERY } from "../../../../../sanity/lib/queries";
import { loadQuery } from "../../../../../sanity/lib/store";
import { client } from "../../../../../sanity/lib/client";
import SingleBlog from "@/components/blogs/single/SingleBlog";
import SingleBlogPreview from "@/components/blogs/single/SingleBlogPreview";

export async function generateStaticParams() {
  const posts = await client.fetch<SanityDocument[]>(POSTS_QUERY);

  return posts.map((post) => ({
    slug: post.slug.current,
  }));
}

export default async function Page({ params }: { params: QueryParams }) {
  const draftModeEnabled = (await draftMode()).isEnabled;
  const initial = await loadQuery<SanityDocument>(POST_QUERY, params, {
    // Because of Next.js, RSC and Dynamic Routes this currently
    // cannot be set on the loadQuery function at the "top level"
    perspective: draftModeEnabled ? "drafts" : "published",
  });

  return draftModeEnabled ? (
    <SingleBlogPreview initial={initial} params={params} />
  ) : (
    <SingleBlog post={initial.data} />
  );
}
