"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { urlForImage } from "../../../sanity/lib/utils";
import { ProjectPayload } from "../../../sanity/lib/sanity_types";
import { useScopedI18n } from "@/locales/client";
import { SectionHeader } from "./section-header";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FeaturedPostsClientProps {
  featuredPosts: ProjectPayload[];
}

const FeaturedPostsClient: React.FC<FeaturedPostsClientProps> = ({ featuredPosts }) => {
  const t = useScopedI18n("homepage.featuredPosts");
  return (
    <section className="py-16 bg-muted    ">
      <div className="container mx-auto px-4">
        <SectionHeader
          kicker="Latest Articles"
          title="Featured"
          titleAccent="Posts"
          description={t("description")}
        />

        {/* Featured Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPosts.map((post, index) => (
            <div
              key={post.slug}
              className={`editorial-image group relative bg-card rounded-2xl shadow-none dark:shadow-gray-900/50 overflow-hidden hover:shadow-sm dark:hover:shadow-gray-900/70 transition-all duration-300 transform hover:-translate-y-1 border dark:border-border ${
                index === 0 && featuredPosts.length > 1 ? "md:col-span-2 lg:col-span-2" : ""
              }`}
            >
              {/* Featured Badge for first post */}
              {index === 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-muted   px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {t("topFeatured")}
                  </span>
                </div>
              )}

              {/* Post Image */}
              <div className="relative h-56 md:h-64 overflow-hidden">
                {post.coverImage ? (
                  <Image
                    src={urlForImage(post.coverImage)?.width(600).height(400).url() || ""}
                    alt={post.title || t("imageAlt")}
                    fill
                    className="object-cover group-hover:scale-[1.025] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-muted   flex items-center justify-center">
                    <span className="text-foreground text-4xl font-bold">
                      {post.title?.charAt(0) || "P"}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 dark:group-hover:bg-opacity-40 transition-all duration-300"></div>
              </div>

              {/* Post Content */}
              <div className="p-6">
                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="inline-block px-2 py-1 bg-muted text-primary dark:bg-muted dark:text-primary rounded-md text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold text-foreground dark:text-white mb-3 group-hover:text-primary dark:group-hover:text-primary transition-colors duration-200 overflow-hidden">
                  <span className="line-clamp-2">
                    {post.title}
                  </span>
                </h3>

                {/* Overview */}
                {post.overview && (
                  <p className="text-muted-foreground dark:text-gray-300 mb-4 text-sm leading-relaxed overflow-hidden">
                    <span className="line-clamp-3">
                      {post.overview[0]?.children?.[0]?.text || ""}
                    </span>
                  </p>
                )}

                {/* Author and Read More */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {post.author?.image && (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={urlForImage(post.author.image)?.width(32).height(32).url() || ""}
                          alt={post.author.name || "Author"}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground dark:text-gray-400 font-medium">
                      {post.author?.name || t("anonymous")}
                    </span>
                  </div>

                  <Link
                    href={`/blog/post/${post.slug}`}
                    className="inline-flex items-center space-x-1 text-primary hover:text-primary dark:text-primary dark:hover:text-primary font-medium text-sm group-hover:translate-x-1 transition-transform duration-200"
                  >
                    <span>{t("readMore")}</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12">
          <Link href="/blog">
            <Button size="lg" className="rounded-full px-8 font-semibold gap-2 shadow-md">
              <span>{t("viewAll")}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPostsClient;
