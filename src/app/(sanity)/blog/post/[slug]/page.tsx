import { toPlainText } from "@portabletext/react";
import { Metadata, ResolvingMetadata } from "next";
import dynamic from "next/dynamic";
import { draftMode } from "next/headers";
import { loadProject } from "../../../../../../sanity/loader/loadQuery";
import { urlForOpenGraphImage } from "../../../../../../sanity/lib/utils";
import { generateStaticSlugs } from "../../../../../../sanity/loader/generateStaticSlugs";
import ProjectPage from "@/components/blogs/pages/project/ProjectPage";
import ErrorPage from "@/app/not-found";
import Script from "next/script";

const ProjectPreview = dynamic(
  () => import("@/components/blogs/pages/project/ProjectPreview"),
);

type Props = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const { data: project } = await loadProject(slug);
  const ogImage = urlForOpenGraphImage(project?.coverImage);

  return {
    title: project?.title,
    description: project?.overview
      ? toPlainText(project.overview)
      : (await parent).description,
    openGraph: ogImage
      ? {
          images: [ogImage, ...((await parent).openGraph?.images || [])],
        }
      : {},
  };
}

export function generateStaticParams() {
  return generateStaticSlugs("project");
}

export default async function ProjectSlugRoute({ params }: Props) {
  const { slug } = await params;
  const initial = await loadProject(slug);

  if ((await draftMode()).isEnabled) {
    return <ProjectPreview params={await params} initial={initial} />;
  }

  if (!initial.data) {
    return <ErrorPage />;
  }

  const project = initial.data;
  const BASE_URL = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://karate.paradox-bd.com";
  
  // Generate NewsArticle structured data for Google News
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": project.title,
    "description": project.overview ? toPlainText(project.overview) : project.title,
    "image": project.coverImage ? urlForOpenGraphImage(project.coverImage) : undefined,
    "datePublished": (project as any)._createdAt || new Date().toISOString(),
    "dateModified": (project as any)._updatedAt || new Date().toISOString(),
    "author": {
      "@type": project.author?.name ? "Person" : "Organization",
      "name": project.author?.name || "HSTU Karate Dojo",
      ...(project.author?.image && {
        "image": project.author.image
      })
    },
    "publisher": {
      "@type": "Organization",
      "name": "HSTU Karate Dojo",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/post/${slug}`
    },
    ...(project.tags && project.tags.length > 0 && {
      "keywords": project.tags.join(", ")
    })
  };

  return (
    <>
      <Script
        id="article-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      <ProjectPage data={project} />
    </>
  );
}
