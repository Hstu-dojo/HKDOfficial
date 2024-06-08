import React from "react";
import { Album, listenNowAlbums } from "@/db/albums";
import { AlbumArtwork } from "@/components/gallery/album-artwork";
import { Separator } from "@/components/ui/separator";
import cloudinary from "@/utils/cloudinary";

const PreviewImages = async () => {
  const assetFolder = process.env.CLOUDINARY_FOLDER || "/";
  const results = await cloudinary.v2.search
    .expression(`resource_type:image AND asset_folder:${assetFolder}`)
    .sort_by("public_id", "desc")
    .max_results(30)
    .execute();
  console.log(results.resources);
  return (
    <div>
      <div className="flex items-center justify-between ">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Listen Now</h2>
          <p className="text-sm text-muted-foreground">
            Top picks for you. Updated daily.
          </p>
        </div>
      </div>
      <Separator className="my-4" />
      <div className="mx-auto max-w-[1960px] p-4">
        {/* <ScrollArea> */}
        <div className="2xl:columns-4 columns-1 sm:columns-2 xl:columns-3">
          {results?.resources?.map((album: Album) => (
            <AlbumArtwork
              key={album.name}
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
