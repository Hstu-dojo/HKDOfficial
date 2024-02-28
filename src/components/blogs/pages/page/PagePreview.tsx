"use client";

import { type QueryResponseInitial } from "@sanity/react-loader";
import { PagePayload } from "../../../../../sanity/lib/sanity_types";

import Page from "./Page";
import { useQuery } from "../../../../../sanity/loader/useQuery";
import { pagesBySlugQuery } from "../../../../../sanity/lib/queries";

type Props = {
  params: { slug: string };
  initial: QueryResponseInitial<PagePayload | null>;
};

export default function PagePreview(props: Props) {
  const { params, initial } = props;
  const { data } = useQuery<PagePayload | null>(pagesBySlugQuery, params, {
    initial,
  });

  return <Page data={data!} />;
}
