// ./components/PostPreview.tsx

"use client";

import { POST_QUERY } from "../../../../sanity/lib/queries";
import { QueryResponseInitial, useQuery } from "@sanity/react-loader";
import { QueryParams, SanityDocument } from "next-sanity";

import SingleBlog from "@/components/blogs/single/SingleBlog";


export default function SingleBlogPreview({
  initial,
  params
}: {
  initial: QueryResponseInitial<SanityDocument>;
  params: QueryParams
}) {
  const { data } = useQuery<SanityDocument | null>(
    POST_QUERY,
    { slug: (params as any).slug },
    { initial }
  );

  return data ? (
    <SingleBlog post={data} />
  ) : (
    <div className="bg-red-100">Post not found</div>
  );
}