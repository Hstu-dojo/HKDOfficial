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
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { data: project } = await loadProject(params.slug);
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
  const initial = await loadProject(params.slug);

  if ((await draftMode()).isEnabled) {
    return <ProjectPreview params={params} initial={initial} />;
  }

  if (!initial.data) {
    return <ErrorPage />;
  }

  return <ProjectPage data={initial.data} />;
}
