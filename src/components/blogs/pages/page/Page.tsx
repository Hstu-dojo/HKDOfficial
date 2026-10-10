import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PagePayload } from "../../../../../sanity/lib/sanity_types";
import { CustomPortableText } from "../../shared/CustomPortableText";
export interface PageProps {
  data: PagePayload | null;
}
export function Page({ data }: PageProps) {
  return (
    <article className="journal-article journal-information">
      <Link href="/blog" className="journal-back">
        <ArrowLeft size={16} aria-hidden="true" /> Back to the journal
      </Link>
      <header className="journal-article-header">
        <span className="journal-kicker">Academy journal</span>
        <h1>{data?.title}</h1>
        {!!data?.overview?.length && (
          <div className="journal-standfirst">
            <CustomPortableText value={data.overview} />
          </div>
        )}
      </header>
      {!!data?.body?.length && (
        <div className="journal-prose">
          <CustomPortableText value={data.body} />
        </div>
      )}
    </article>
  );
}
export default Page;
