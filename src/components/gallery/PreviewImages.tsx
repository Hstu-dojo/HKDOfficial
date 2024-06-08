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
      <div className="relative">
        {/* <ScrollArea> */}
        <div className="flex flex-wrap space-x-4 pb-4">
          {results?.resources?.map((album: Album) => (
            <AlbumArtwork
              key={album.name}
              album={album}
              className="w-1/4 min-w-[150px] max-w-[250px]"
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
