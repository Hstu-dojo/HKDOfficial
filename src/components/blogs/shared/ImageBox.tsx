import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { urlForImage } from "../../../../sanity/lib/utils";

interface ImageBoxProps {
  image?: { asset?: any };
  alt?: string;
  width?: number;
  height?: number;
  size?: string;
  classesWrapper?: string;
  fit?: "cover" | "contain";
  preserveAspect?: boolean;
  "data-sanity"?: string;
}

export default function ImageBox({
  image,
  alt = "Cover image",
  width = 1600,
  height = 900,
  size = "100vw",
  classesWrapper,
  fit = "cover",
  preserveAspect = false,
  ...props
}: ImageBoxProps) {
  const dimensions =
    typeof image?.asset?._ref === "string"
      ? image.asset._ref.match(/-(\d+)x(\d+)-[a-z0-9]+$/i)
      : null;
  const ratio =
    dimensions && Number(dimensions[1]) > 0 && Number(dimensions[2]) > 0
      ? Number(dimensions[1]) / Number(dimensions[2])
      : undefined;
  const builder = image && urlForImage(image);
  const imageUrl =
    builder &&
    (preserveAspect || fit === "contain"
      ? builder.width(width).fit("max")
      : builder.height(height).width(width).fit("crop")
    ).url();

  return (
    <div
      className={`w-full overflow-hidden rounded-xl bg-muted ${classesWrapper || "relative aspect-[16/9]"}`}
      data-sanity={props["data-sanity"]}
      style={preserveAspect && ratio ? { aspectRatio: ratio } : undefined}
    >
      {imageUrl ? (
        <Image
          className={`absolute inset-0 h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
          alt={alt}
          width={width}
          height={height}
          sizes={size}
          src={imageUrl}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
