// ./sanity/lib/queries.ts

import { groq } from "next-sanity";

export const POSTS_QUERY = groq`*[_type == "post" && defined(slug)]`;

export const POST_QUERY = groq`*[_type == "post" && slug.current == $slug][0]`;

export const homePageQuery = groq`
  *[_type == "home"][0]{
    _id,
    overview,
    showcaseProjects[]->{
      _type,
      coverImage,
      overview,
      "slug": slug.current,
      author->{
        name,
        "slug": slug.current,
        image,
      },
      tags,
      title,
    },
    title,
  }
`;

export const pagesBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    body,
    overview,
    title,
    "slug": slug.current,
  }
`;

export const projectBySlugQuery = groq`
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    client,
    coverImage,
    description,
    duration,
    overview,
    site,
    "slug": slug.current,
    tags,
    title,
    author->{
        name,
        "slug": slug.current,
        image,
    },
  }
`;

export const projectByTagQuery = (tag: string) => groq`
  *[_type == "project" && $tag in tags] {
    _id,
    client,
    coverImage,
    description,
    duration,
    overview,
    site,
    "slug": slug.current,
    tags,
    title,
    author->{
        name,
        "slug": slug.current,
        image,
    },
  }
`;
export const allProjectSlugQuery = (page: number, limit: number) => groq`
  *[_type == "project"] | order(_updatedAt desc)[${(page - 1) * limit}...${
    page * limit
  }] {
    _id,
    client,
    coverImage,
    duration,
    overview,
    site,
    "slug": slug.current,
    tags,
    title,
    _updatedAt
  }
`;

export const settingsQuery = groq`
  *[_type == "settings"][0]{
    footer,
    menuItems[]->{
      _type,
      "slug": slug.current,
      title
    },
    ogImage,
  }
`;

export const findTagQuery = (tag: string) => groq`
  *[_type == "post" && $tag in tags] {
    _id,
    title,
    "slug": slug.current,
    tags,
  }
`;

export const findByCategoryQuery = (category: string) => groq`
  *[_type == "post" && category == $category] {
    _id,
    title,
    "slug": slug.current,
    category,
  }
`;

export const findByAuthorQuery = (authorSlug: string) => groq`
  *[_type == "post" && author.slug.current == $authorSlug] {
    _id,
    title,
    "slug": slug.current,
    author->{
      name,
      "slug": slug.current,
      image,
    },
  }
`;

export const allAuthorsQuery = groq`
  *[_type == "author"] {
    _id,
    name,
    "slug": slug.current,
    image,
    bio
  }
`;
