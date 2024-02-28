"use client";

import { type QueryResponseInitial } from "@sanity/react-loader";

import ProjectPage from "./ProjectPage";
import { projectBySlugQuery } from "../../../../../sanity/lib/queries";
import { useQuery } from "../../../../../sanity/loader/useQuery";
import { ProjectPayload } from "../../../../../sanity/lib/sanity_types";

type Props = {
  params: { slug: string };
  initial: QueryResponseInitial<ProjectPayload | null>;
};

export default function ProjectPreview(props: Props) {
  const { params, initial } = props;
  const { data, encodeDataAttribute } = useQuery<ProjectPayload | null>(
    projectBySlugQuery,
    params,
    { initial },
  );

  return <ProjectPage data={data!} encodeDataAttribute={encodeDataAttribute} />;
}
