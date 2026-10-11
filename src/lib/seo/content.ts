import "server-only";
import { unstable_cache } from "next/cache";
import { client } from "../../../sanity/lib/client";

export type PublishedDocument = {
  _id: string;
  _type: string;
  slug: string;
  title?: string;
  _createdAt?: string;
  _updatedAt?: string;
};
export const publishedDocuments = unstable_cache(
  async () => {
    const documents: PublishedDocument[] = [];
    for (let offset = 0; ; offset += 1000) {
      const batch = await client.fetch<PublishedDocument[]>(
        `*[_type in ["project", "page", "post"] && defined(slug.current)] | order(_id) [$start...$end] { _id, _type, "slug": slug.current, title, _createdAt, _updatedAt }`,
        { start: offset, end: offset + 1000 },
        { perspective: "published" },
      );
      documents.push(...batch);
      if (batch.length < 1000) break;
    }
    return documents;
  },
  ["seo-published-documents"],
  { revalidate: 600, tags: ["project", "page", "post", "seo"] },
);
