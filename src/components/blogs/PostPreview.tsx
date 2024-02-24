// ./components/PostPreview.tsx

"use client";


import { QueryResponseInitial, useQuery } from "@sanity/react-loader";
import { SanityDocument } from "next-sanity";
import SanityBlogs from "@/components/blogs/sanity-blogs";
import { POSTS_QUERY } from "../../../sanity/lib/queries";

export default function BlogsPreview({
  initial,
}: {
  initial: QueryResponseInitial<SanityDocument[]>;
}) {
  const { data } = useQuery<SanityDocument[] | null>(
    POSTS_QUERY,
    {},
    { initial }
  );

  return data ? (
    <SanityBlogs posts={data} />
  ) : (
    <div className="bg-red-100">No posts found</div>
  );
}