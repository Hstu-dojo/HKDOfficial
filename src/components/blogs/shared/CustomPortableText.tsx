import { PortableText, PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { Image } from "sanity";

import ImageBox from "./ImageBox";
import { TimelineSection } from "./TimelineSection";

export function CustomPortableText({
  paragraphClasses,
  value,
}: {
  paragraphClasses?: string;
  value: PortableTextBlock[];
}) {
  const components: PortableTextComponents = {
    block: {
      normal: ({ children }) => {
        return <p className={paragraphClasses}>{children}</p>;
      },
    },
    marks: {
      link: ({ children, value }) => {
        return (
          <a
            className="underline transition hover:opacity-50"
            href={value?.href}
            rel="noreferrer noopener"
          >
            {children}
          </a>
        );
      },
    },
    types: {
      image: ({
        value,
      }: {
        value: Image & { alt?: string; caption?: string };
      }) => {
        return (
          <figure className="my-6 space-y-2">
            <ImageBox
              image={value}
              preserveAspect
              alt={value.alt}
              classesWrapper="relative aspect-[16/9]"
            />
            {value?.caption && (
              <figcaption className="font-sans text-sm text-muted-foreground">
                {value.caption}
              </figcaption>
            )}
          </figure>
        );
      },
      timeline: ({ value }) => {
        const { items } = value || {};
        return <TimelineSection timelines={items} />;
      },
    },
  };

  return <PortableText components={components} value={value} />;
}
