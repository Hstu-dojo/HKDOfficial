import Image from "next/image";

import { urlForImage } from "../../../../sanity/lib/utils";

interface ImageBoxProps {
  image?: { asset?: any };
  alt?: string;
  width?: number;
  height?: number;
  size?: string;
  classesWrapper?: string;
  "data-sanity"?: string;
}

export default function AvatarBox({
  image,
  alt = "Cover image",
  width = 200,
  height = 200,
  size = "10vw",
  classesWrapper,
  ...props
}: ImageBoxProps) {
  const imageUrl =
    image && urlForImage(image)?.height(height).width(width).fit("crop").url();

  return (
    <div className={` border-2 border-white rounded-full`} data-sanity={props["data-sanity"]}>
      {imageUrl && (
        <Image
          className=""
          alt={alt}
          width={20}
          height={20}
          // sizes={size}
          src={imageUrl}
        />
      )}
    </div>
  );
}
