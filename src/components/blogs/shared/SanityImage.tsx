"use client";

import Image, { type ImageProps } from "next/image";
import { sanityImageLoader } from "@/lib/sanity-image-loader";

type SanityImageProps = Omit<ImageProps, "src" | "loader"> & { src: string };

/** Responsive Sanity CDN images, independent of the deployment's optimizer quota. */
export default function SanityImage(props: SanityImageProps) {
  return <Image {...props} loader={sanityImageLoader} />;
}
