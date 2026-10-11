import { pageMetadata, noIndex } from "@/lib/seo/site";
import { urlForOpenGraphImage } from "../../../../../sanity/lib/utils";
import { toPlainText } from "@portabletext/react";
import { notFound } from "next/navigation";
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

export default async function Page({
  params,
}: {
  params: Promise<QueryParams>;
}) {
  const resolvedParams = await params;
  const draftModeEnabled = (await draftMode()).isEnabled;
  const initial = await loadQuery<SanityDocument>(
    POST_QUERY,
    { slug: (resolvedParams as any).slug },
    {
      // Because of Next.js, RSC and Dynamic Routes this currently
      // cannot be set on the loadQuery function at the "top level"
      perspective: draftModeEnabled ? "drafts" : "published",
    },
  );

  if (!initial.data) notFound();
  return draftModeEnabled ? (
    <SingleBlogPreview initial={initial} params={resolvedParams} />
  ) : (
    <SingleBlog post={initial.data} />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await client.fetch(POST_QUERY, { slug });
  if (!post) return { title: "Notice not found", robots: noIndex };
  return pageMetadata({
    path: `/notice/${encodeURIComponent(slug)}`,
    title: post.title || "Academy notice",
    description: post.body?.length ? toPlainText(post.body) : undefined,
    image: urlForOpenGraphImage(post.mainImage),
    index: !(await draftMode()).isEnabled,
  });
}
