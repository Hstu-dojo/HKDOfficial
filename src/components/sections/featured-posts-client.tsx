"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { urlForImage } from "../../../sanity/lib/utils";
import { ProjectPayload } from "../../../sanity/lib/sanity_types";
import { useScopedI18n } from "@/locales/client";

interface FeaturedPostsClientProps {
  featuredPosts: ProjectPayload[];
}

const FeaturedPostsClient: React.FC<FeaturedPostsClientProps> = ({ featuredPosts }) => {
  const t = useScopedI18n("homepage.featuredPosts");
  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
            {t("title")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            {t("subtitle")}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("description")}
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Featured Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPosts.map((post, index) => (
            <div
              key={post.slug}
              className={`group bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 overflow-hidden hover:shadow-2xl dark:hover:shadow-gray-900/70 transition-all duration-300 transform hover:-translate-y-1 border dark:border-gray-700 ${
                index === 0 && featuredPosts.length > 1 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Featured Badge for first post */}
              {index === 0 && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    {t("topFeatured")}
                  </span>
                </div>
              )}

              {/* Post Image */}
              <div className="relative h-48 md:h-56 overflow-hidden">
                {post.coverImage ? (
                  <Image
                    src={urlForImage(post.coverImage)?.width(600).height(400).url() || ""}
                    alt={post.title || "Featured post"}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
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
                        className="inline-block px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded-md text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 overflow-hidden">
                  <span className="line-clamp-2">
                    {post.title}
                  </span>
                </h3>

                {/* Overview */}
                {post.overview && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed overflow-hidden">
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
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {post.author?.name || "Anonymous"}
                    </span>
                  </div>
                  
                  <Link
                    href={`/blog/post/${post.slug}`}
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm group-hover:translate-x-1 transition-transform duration-200"
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
          <Link
            href="/blog"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white px-8 py-3 rounded-full font-medium transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl dark:shadow-gray-900/50"
          >
            <span>{t("viewAll")}</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPostsClient;
