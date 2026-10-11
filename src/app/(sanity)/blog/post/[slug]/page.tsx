import {
  pageMetadata,
  absoluteUrl,
  academyName,
  jsonLd,
  noIndex,
} from "@/lib/seo/site";
import { toPlainText } from "@portabletext/react";
import { Metadata, ResolvingMetadata } from "next";
import dynamic from "next/dynamic";
import { draftMode } from "next/headers";
import { loadProject } from "../../../../../../sanity/loader/loadQuery";
import { urlForOpenGraphImage } from "../../../../../../sanity/lib/utils";
import { generateStaticSlugs } from "../../../../../../sanity/loader/generateStaticSlugs";
import ProjectPage from "@/components/blogs/pages/project/ProjectPage";
import ErrorPage from "@/app/not-found";

const ProjectPreview = dynamic(
  () => import("@/components/blogs/pages/project/ProjectPreview"),
);

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const { data: project } = await loadProject(slug);
  const ogImage = urlForOpenGraphImage(project?.coverImage);

  if (!project) return { title: "Story not found", robots: noIndex };
  const metadata = pageMetadata({
    path: `/blog/post/${encodeURIComponent(slug)}`,
    title: project.title || "Academy story",
    description: project.overview?.length
      ? toPlainText(project.overview)
      : undefined,
    image: ogImage,
    index: !(await draftMode()).isEnabled,
  });
  const dated = project as typeof project & {
    _createdAt?: string;
    _updatedAt?: string;
  };
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: "article",
      publishedTime: dated._createdAt,
      modifiedTime: dated._updatedAt,
      authors: project.author?.name ? [project.author.name] : [academyName],
    },
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
  const BASE_URL = new URL(absoluteUrl("/")).origin;

  // Generate NewsArticle structured data for Google News
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: project.title,
    description: project.overview
      ? toPlainText(project.overview)
      : project.title,
    image: project.coverImage
      ? urlForOpenGraphImage(project.coverImage)
      : undefined,
    datePublished: (project as any)._createdAt,
    dateModified: (project as any)._updatedAt,
    author: {
      "@type": project.author?.name ? "Person" : "Organization",
      name: project.author?.name || "Kaizen Karate Academy",
      ...(project.author?.image && {
        image: urlForOpenGraphImage(project.author.image),
      }),
    },
    publisher: {
      "@type": "Organization",
      name: "Kaizen Karate Academy",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/post/${slug}`,
    },
    ...(project.tags &&
      project.tags.length > 0 && {
        keywords: project.tags.join(", "),
      }),
  };

  return (
    <>
      <script
        id="article-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(structuredData),
        }}
      />
      <ProjectPage data={project} />
    </>
  );
}
