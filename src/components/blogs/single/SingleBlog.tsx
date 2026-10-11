// ./components/Post.tsx

import Image from "../shared/SanityImage";
import { CustomPortableText } from "../shared/CustomPortableText";
import imageUrlBuilder from "@sanity/image-url";
import { SanityDocument } from "next-sanity";

import { dataset, projectId } from "../../../../sanity/env";

const builder = imageUrlBuilder({ projectId, dataset });

export default function SingleBlog({ post }: { post: SanityDocument }) {
  const { title, mainImage, body } = post;

  return (
    <main
      style={{ color: "#64748B" }}
      className="container prose prose-lg mx-auto p-4"
    >
      {title ? <h1>{title}</h1> : null}
      {mainImage ? (
        <Image
          className="float-left m-0 mr-4 w-1/3 rounded-lg"
          src={builder
            .image(mainImage)
            .width(300)
            .height(300)
            .quality(80)
            .url()}
          width={300}
          height={300}
          alt={mainImage.alt || ""}
        />
      ) : null}
      {body ? <CustomPortableText value={body} /> : null}
    </main>
  );
}
