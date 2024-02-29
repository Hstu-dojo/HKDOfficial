"use client";
import { DiscussionEmbed } from "disqus-react";

const BlogComments = ({ post }: any) => {
  const pageURL = typeof window !== "undefined" ? window.location.href : "";

  return (
    <DiscussionEmbed
      shortname="deothemes"
      config={{
        url: pageURL,
        identifier: post.id.toString(),
        title: post.title.rendered || post.title,
      }}
    />
  );
};

export default BlogComments;
