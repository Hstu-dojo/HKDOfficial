"use client";
import type { EncodeDataAttributeCallback } from "@sanity/react-loader";
import Link from "next/link";
import { Header } from "../../shared/Header";
import ImageBox from "../../shared/ImageBox";
import { ProjectPayload } from "../../../../../sanity/lib/sanity_types";
import { CustomPortableText } from "../../shared/CustomPortableText";
import BlogComments from "@/components/blog-comments";
import { TracingBeam } from "@/components/ui/tracing-beam";
import SocialShare from "@/components/ui/socialShare";

export interface ProjectPageProps {
  data: ProjectPayload | null;
  encodeDataAttribute?: EncodeDataAttributeCallback;
}

export function ProjectPage({ data, encodeDataAttribute }: ProjectPageProps) {
  // Default to an empty object to allow previews on non-existent documents
  const {
    client,
    coverImage,
    description,
    duration,
    overview,
    site,
    tags,
    title,
    slug,
  } = data ?? {};
  const post = {
    id: slug,
    title: title,
  };

  const startYear = new Date(duration?.start!).getFullYear();
  const endYear = duration?.end ? new Date(duration?.end).getFullYear() : "Now";

  return (
    <div>
      <TracingBeam className="px-6 mb-12">
        <div className="mb-20 space-y-6">
          {/* Header */}
          <Header title={title} description={overview} />

          <div className="rounded-md border">
            {/* Image  */}
            <ImageBox
              data-sanity={encodeDataAttribute?.("coverImage")}
              image={coverImage}
              // @TODO add alt field in schema
              alt=""
              classesWrapper="relative aspect-[16/9]"
            />

            <div className="grid grid-cols-1 divide-y divide-inherit lg:grid-cols-4 lg:divide-x lg:divide-y-0">
              {/* Duration */}
              {!!(startYear && endYear) && (
                <div className="p-3 lg:p-4">
                  <div className="text-xs md:text-sm">Duration</div>
                  <div className="text-md md:text-lg">
                    <span data-sanity={encodeDataAttribute?.("duration.start")}>
                      {startYear}
                    </span>
                    {" - "}
                    <span data-sanity={encodeDataAttribute?.("duration.end")}>
                      {endYear}
                    </span>
                  </div>
                </div>
              )}

              {/* Client */}
              {client && (
                <div className="p-3 lg:p-4">
                  <div className="text-xs md:text-sm">Client</div>
                  <div className="text-md md:text-lg">{client}</div>
                </div>
              )}

              {/* Site */}
              {site && (
                <div className="p-3 lg:p-4">
                  <div className="text-xs md:text-sm">Site</div>
                  {site && (
                    <Link
                      target="_blank"
                      className="break-words text-md md:text-lg"
                      href={site}
                    >
                      {site}
                    </Link>
                  )}
                </div>
              )}

              {/* Tags */}
              <div className="p-3 lg:p-4">
                <div className="text-xs md:text-sm">Tags</div>
                <div className="flex flex-row flex-wrap text-md md:text-lg">
                  {tags?.map((tag, key) => (
                    <div key={key} className="mr-1 break-words ">
                      #{tag}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {description && (
            <CustomPortableText
              paragraphClasses="font-serif max-w-3xl text-xl text-gray-600"
              value={description}
            />
          )}
        </div>
        <SocialShare />
      </TracingBeam>
      <BlogComments post={post} />

      <div className="absolute left-0 w-screen border-t" />
    </div>
  );
}

export default ProjectPage;
