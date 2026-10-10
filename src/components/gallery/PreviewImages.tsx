import React from "react";
import { Album, listenNowAlbums } from "@/db/albums";
import { AlbumArtwork } from "@/components/gallery/album-artwork";
import { Separator } from "@/components/ui/separator";
import cloudinary from "@/utils/cloudinary";
import type { ImageProps } from "@/utils/types";
import getBase64ImageUrl from "@/utils/generateBlurPlaceholder";

const PreviewImages = async ({ tag }: { tag?: string }) => {
  const assetFolder = process.env.CLOUDINARY_FOLDER || "/";
  const expression =
    tag !== ""
      ? `resource_type:image AND tags=${tag} AND asset_folder:${assetFolder}`
      : `resource_type:image AND asset_folder:${assetFolder}`;
  let results = await cloudinary.v2.search
    .expression(expression)
    .sort_by("public_id", "desc")
    .with_field("tags")
    .max_results(30)
    .execute();
  const blurImagePromises = results.resources.map((image: ImageProps) => {
    return getBase64ImageUrl(image);
  });
  const imagesWithBlurDataUrls = await Promise.all(blurImagePromises);

  for (let i = 0; i < results?.resources?.length; i++) {
    results.resources[i] = {
      ...results?.resources[i],
      blurDataUrl: imagesWithBlurDataUrls[i],
    };
  }

  // console.log(reducedResults)
  return (
    <div className="portal-page space-y-6">
      <div className="flex items-center justify-between ">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Featured Media</h1>
          <p className="text-sm text-muted-foreground">
            Images selected for the featured gallery.
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="w-full min-w-0">
        {/* <ScrollArea> */}
        <div className="2xl:columns-4 columns-1 sm:columns-2 xl:columns-3">
          {results?.resources?.map((album: Album) => (
            <AlbumArtwork
              key={album.asset_id}
              album={album}
              className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110"
              aspectRatio="portrait"
              width={250}
              height={330}
              secure_url={""}
            />
          ))}
        </div>
        {/* <ScrollBar orientation="horizontal" />
                        </ScrollArea> */}
      </div>
    </div>
  );
};

export default PreviewImages;
