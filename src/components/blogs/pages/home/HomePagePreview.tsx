"use client";

import { useQuery, type QueryResponseInitial } from "@sanity/react-loader";

import HomePage from "./HomePage";
import { HomePagePayload } from "../../../../../sanity/lib/sanity_types";
import { homePageQuery } from "../../../../../sanity/lib/queries";

type Props = {
  initial: QueryResponseInitial<HomePagePayload | null>;
};

export default function HomePagePreview(props: Props) {
  const { initial } = props;
  const { data, encodeDataAttribute } = useQuery<HomePagePayload | null>(
    homePageQuery,
    {},
    { initial },
  );

  if (!data) {
    return (
      <div className="text-center">
        Please start editing your Home document to see the preview!
      </div>
    );
  }

  return <HomePage data={data} encodeDataAttribute={encodeDataAttribute} />;
}
