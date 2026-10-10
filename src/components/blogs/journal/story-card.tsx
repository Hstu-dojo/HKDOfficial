import Link from "next/link";
import { toPlainText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import type { Image } from "sanity";
import { ArrowUpRight } from "lucide-react";
import ImageBox from "../shared/ImageBox";

export interface JournalStory {
  _id?: string;
  slug?: string;
  title?: string;
  coverImage?: Image;
  overview?: PortableTextBlock[];
  tags?: string[];
  _createdAt?: string;
  _updatedAt?: string;
  author?: { name?: string; image?: Image } | string;
}

export function StoryCard({
  story,
  featured = false,
  sanityAttribute,
}: {
  story: JournalStory;
  featured?: boolean;
  sanityAttribute?: string;
}) {
  if (!story.slug) return null;
  const summary = story.overview?.length ? toPlainText(story.overview) : "";
  return (
    <article
      className={`journal-story ${featured ? "journal-story-featured" : ""}`}
    >
      <Link
        href={`/blog/post/${story.slug}`}
        className="journal-story-link"
        data-sanity={sanityAttribute}
      >
        <div className="journal-story-image editorial-image">
          <ImageBox
            image={story.coverImage}
            alt={story.title || "Academy story"}
            width={featured ? 1400 : 720}
            height={featured ? 1000 : 540}
            size={
              featured
                ? "(max-width: 768px) 100vw, 66vw"
                : "(max-width: 575px) 100vw, (max-width: 1024px) 50vw, 33vw"
            }
            classesWrapper="relative aspect-[4/3]"
          />
          <span className="journal-story-arrow" aria-hidden="true">
            <ArrowUpRight size={18} />
          </span>
        </div>
        <div className="journal-story-copy">
          <span className="journal-label">
            {story.tags?.[0] || "From the dojo"}
          </span>
          <h2>{story.title || "Untitled story"}</h2>
          {summary && <p className="journal-story-summary">{summary}</p>}
          <span className="journal-read-link">
            Read story <ArrowUpRight size={16} aria-hidden="true" />
          </span>
        </div>
      </Link>
    </article>
  );
}
