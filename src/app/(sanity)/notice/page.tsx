// ./app/page.tsx

import { SanityDocument } from "next-sanity";
import { draftMode } from "next/headers";

import SanityBlogs from "@/components/blogs/sanity-blogs";
import { POSTS_QUERY } from "../../../../sanity/lib/queries";
import { loadQuery } from "../../../../sanity/lib/store";
import BlogsPreview from "@/components/blogs/PostPreview";

export default async function Page() {
  const draftModeEnabled = (await draftMode()).isEnabled;
  const initial = await loadQuery<SanityDocument[]>(
    POSTS_QUERY,
    {},
    {
      perspective: draftModeEnabled ? "drafts" : "published",
    },
  );

  return draftModeEnabled ? (
    <BlogsPreview initial={initial} />
  ) : (
    <SanityBlogs posts={initial.data} />
  );
}
