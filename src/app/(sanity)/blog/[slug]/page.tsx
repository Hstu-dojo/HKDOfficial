import { toPlainText } from "@portabletext/react";
import { Metadata, ResolvingMetadata } from "next";
import dynamic from "next/dynamic";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { loadPage } from "../../../../../sanity/loader/loadQuery";
import { generateStaticSlugs } from "../../../../../sanity/loader/generateStaticSlugs";
import Page from "@/components/blogs/pages/page/Page";

// import { Page } from "@/components/pages/page/Page";
// import { generateStaticSlugs } from "@/sanity/loader/generateStaticSlugs";
// import { loadPage } from "@/sanity/loader/loadQuery";
const PagePreview = dynamic(
  () => import("@/components/blogs/pages/page/PagePreview"),
);

type Props = {
  params: { slug: string };
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const { data: page } = await loadPage(slug);

  return {
    title: page?.title,
    description: page?.overview
      ? toPlainText(page.overview)
      : (await parent).description,
  };
}

export function generateStaticParams() {
  return generateStaticSlugs("page");
}

export default async function PageSlugRoute({ params }: Props) {
  const { slug } = await params;
  const initial = await loadPage(slug);

  if ((await draftMode()).isEnabled) {
    return <PagePreview params={await params} initial={initial} />;
  }

  if (!initial.data) {
    notFound();
  }

  return <Page data={initial.data} />;
}
