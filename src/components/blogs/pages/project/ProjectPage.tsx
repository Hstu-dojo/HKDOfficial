"use client";
import type { EncodeDataAttributeCallback } from "@sanity/react-loader";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import ImageBox from "../../shared/ImageBox";
import type { ProjectPayload } from "../../../../../sanity/lib/sanity_types";
import { CustomPortableText } from "../../shared/CustomPortableText";
import BlogComments from "@/components/blog-comments";
import SocialShare from "@/components/ui/socialShare";

export interface ProjectPageProps {
  data: ProjectPayload | null;
  encodeDataAttribute?: EncodeDataAttributeCallback;
}
export function ProjectPage({ data, encodeDataAttribute }: ProjectPageProps) {
  const {
    coverImage,
    description,
    overview,
    site,
    tags,
    title,
    slug,
    duration,
    client,
  } = data ?? {};
  const published = (data as (ProjectPayload & { _createdAt?: string }) | null)
    ?._createdAt;
  const date =
    published && !Number.isNaN(Date.parse(published))
      ? new Intl.DateTimeFormat("en", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(new Date(published))
      : null;
  const startYear =
    duration?.start && !Number.isNaN(Date.parse(duration.start))
      ? new Date(duration.start).getFullYear()
      : null;
  const endYear =
    duration?.end && !Number.isNaN(Date.parse(duration.end))
      ? new Date(duration.end).getFullYear()
      : null;
  return (
    <article className="journal-article">
      <Link href="/blog" className="journal-back">
        <ArrowLeft size={16} aria-hidden="true" /> Back to the journal
      </Link>
      <header className="journal-article-header">
        <span className="journal-kicker">{tags?.[0] || "From the dojo"}</span>
        <h1 data-sanity={encodeDataAttribute?.("title")}>
          {title || "Academy story"}
        </h1>
        {!!overview?.length && (
          <div className="journal-standfirst">
            <CustomPortableText value={overview} />
          </div>
        )}
        <div className="journal-byline">
          <span>By {data?.author?.name || "Kaizen Karate Academy"}</span>
          {date && <time dateTime={published}>{date}</time>}
        </div>
      </header>
      {coverImage && (
        <figure className="journal-article-cover editorial-lead-image">
          <ImageBox
            data-sanity={encodeDataAttribute?.("coverImage")}
            image={coverImage}
            fit="contain"
            alt={title || "Academy story"}
            width={1600}
            height={900}
            size="(max-width: 1280px) 100vw, 1200px"
            classesWrapper="relative aspect-[16/9]"
          />
        </figure>
      )}
      <div className="journal-reading-layout">
        <div
          className="journal-prose"
          data-sanity={encodeDataAttribute?.("description")}
        >
          {!!description?.length && <CustomPortableText value={description} />}
        </div>
        <aside
          className="journal-article-sidebar"
          aria-label="About this story"
        >
          <section className="journal-author">
            <span className="journal-kicker">Written by</span>
            {data?.author?.image && (
              <ImageBox
                image={data.author.image}
                alt={data.author.name || "Author"}
                width={96}
                height={96}
                size="56px"
                classesWrapper="relative aspect-square"
              />
            )}
            <h2>{data?.author?.name || "Kaizen Karate Academy"}</h2>
          </section>
          {!!tags?.length && (
            <section>
              <span className="journal-label">Filed under</span>
              <div className="journal-tags">
                {tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </section>
          )}
          {startYear && (
            <section>
              <span className="journal-label">Timeline</span>
              <p>
                {startYear}
                {endYear && endYear !== startYear
                  ? `–${endYear}`
                  : !duration?.end
                    ? "–Present"
                    : ""}
              </p>
            </section>
          )}
          {client && (
            <section>
              <span className="journal-label">Organization</span>
              <p>{client}</p>
            </section>
          )}
          {site && (
            <Link
              href={site}
              target="_blank"
              rel="noopener noreferrer"
              className="journal-read-link"
            >
              Related website <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          )}
        </aside>
      </div>
      <div className="journal-article-end">
        <SocialShare key={slug} />
        <Link href="/blog#latest" className="journal-read-link">
          Explore more stories <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      {slug && (
        <section className="journal-comments">
          <span className="journal-kicker">Join the conversation</span>
          <h2>
            From our <em>community.</em>
          </h2>
          <BlogComments post={{ id: slug, title: title || "Academy story" }} />
        </section>
      )}
    </article>
  );
}
export default ProjectPage;
