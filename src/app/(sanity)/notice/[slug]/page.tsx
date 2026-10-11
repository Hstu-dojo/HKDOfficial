import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { pageMetadata, noIndex, jsonLd, absoluteUrl } from "@/lib/seo/site";
import { getPublicNotice } from "@/lib/notices/server";
import { isNoticeExpired, noticeDate, noticeText } from "@/lib/notices/model";
import { noticeCopy, noticeLocale } from "@/lib/notices/copy";
import { safePublicUrl } from "@/lib/org/settings";
export const revalidate = 60;
type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
};
export async function generateMetadata({ params, searchParams }: Props) {
  const { slug } = await params,
    { lang } = await searchParams,
    notice = await getPublicNotice(slug);
  if (!notice) return { title: "Notice not found", robots: noIndex };
  const copy = noticeText(notice, noticeLocale(lang));
  return pageMetadata({
    path: `/notice/${encodeURIComponent(slug)}`,
    title: copy.title,
    description: copy.content.slice(0, 160),
  });
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params,
    { lang } = await searchParams,
    locale = noticeLocale(lang),
    t = noticeCopy[locale],
    notice = await getPublicNotice(slug);
  if (!notice) notFound();
  const copy = noticeText(notice, locale);
  return (
    <article className="public-page-container public-page-inset">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: copy.title,
            datePublished: notice.publishedAt || undefined,
            publisher: {
              "@type": "Organization",
              name: "Kaizen Karate Academy",
            },
            mainEntityOfPage: absoluteUrl(`/notice/${notice.id}`),
          }),
        }}
      />
      <Link
        className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary"
        href={`/notice${locale === "en" ? "" : `?lang=${locale}`}`}
      >
        ← {t.back}
      </Link>
      <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="text-primary">{t.academy}</span>
        <time dateTime={notice.publishedAt || undefined}>
          {noticeDate(notice.publishedAt, locale)}
        </time>
        {notice.isPinned && <span>{t.pinned}</span>}
        {isNoticeExpired(notice) && (
          <span className="rounded-full border px-3 py-1">{t.expired}</span>
        )}
      </div>
      <h1 className="public-page-title mt-6">
        {copy.title}
      </h1>
      {notice.expiresAt && (
        <p className="mt-5 text-sm text-muted-foreground">
          {t.expires}: {noticeDate(notice.expiresAt, locale)}
        </p>
      )}
      <div className="prose prose-neutral mt-10 max-w-[70ch] break-words dark:prose-invert">
        <ReactMarkdown
          skipHtml
          disallowedElements={["img"]}
          components={{
            a: ({ href, children }) => {
              const safe = safePublicUrl(href, true);
              return safe ? (
                <a href={safe} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ) : (
                <span>{children}</span>
              );
            },
          }}
        >
          {copy.content}
        </ReactMarkdown>
      </div>
      {notice.attachmentUrl && (
        <a
          className="mt-10 inline-flex min-h-11 items-center rounded-full border px-6 text-sm text-primary"
          href={notice.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.attachment} ↗
        </a>
      )}
    </article>
  );
}
