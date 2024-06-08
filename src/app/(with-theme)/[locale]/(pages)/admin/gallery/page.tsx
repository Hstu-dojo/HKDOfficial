import { Metadata } from "next";

import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AlbumArtwork } from "@/components/gallery/album-artwork";
import { Menu } from "@/components/gallery/menu";
import ClourinnaryUpButton from "@/components/gallery/ClourinnaryUpButton";
import { PodcastEmptyPlaceholder } from "@/components/gallery/podcast-empty-placeholder";
import { Sidebar } from "@/components/gallery/sidebar";
import PreviewImages from "@/components/gallery/PreviewImages";
import { listenNowAlbums, madeForYouAlbums } from "@/db/albums";
import { playlists } from "@/db/playlists";

export const metadata: Metadata = {
  title: "Gallery admin",
  description: "Admin's gallery management.",
};
const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
export default function MusicPage() {
  return (
    <>
      <div className="block">
        <Menu />
        <div className="border-t">
          <div className="">
            <div className="grid lg:grid-cols-5">
              <Sidebar playlists={playlists} className="hidden lg:block" />
              <div className="col-span-3 lg:col-span-4 lg:border-l">
                <div className="h-full px-4 py-6 lg:px-8">
                  <Tabs defaultValue="music" className="h-full space-y-6">
                    <div className="space-between flex items-center">
                      <TabsList>
                        <TabsTrigger value="music" className="relative">
                          Music
                        </TabsTrigger>
                        <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
                        <TabsTrigger value="live" disabled>
                          Live
                        </TabsTrigger>
                      </TabsList>
                      <div className="ml-auto mr-4">
                        <ClourinnaryUpButton uploadPreset={uploadPreset} />
                      </div>
                    </div>
                    <TabsContent
                      value="music"
                      className="border-none p-0 outline-none"
                    >
                      <PreviewImages />
                    </TabsContent>
                    <TabsContent
                      value="podcasts"
                      className="h-full flex-col border-none p-0 data-[state=active]:flex"
                    >
                      {" "}
                      <div className="space-y-1">
                        <h2 className="text-2xl font-semibold tracking-tight">
                          Made for You
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Your personal playlists. Updated daily.
                        </p>
                      </div>
                      <Separator className="my-4" />
                      <div className="">
                        {/* <ScrollArea> */}
                        <div className="flex max-w-full flex-wrap space-x-4 pb-4">
                          {madeForYouAlbums.map((album) => (
                            <AlbumArtwork
                              key={album.asset_id}
                              album={album}
                              className="w-[150px]"
                              aspectRatio="square"
                              width={150}
                              height={150}
                              secure_url={""}
                            />
                          ))}
                        </div>
                        {/* <ScrollBar orientation="horizontal" /> */}
                        {/* </ScrollArea> */}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="mt-6 space-y-1 ">
                          <h2 className="text-2xl font-semibold tracking-tight">
                            New Episodes
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Your favorite podcasts. Updated daily.
                          </p>
                        </div>
                      </div>
                      <Separator className="my-4" />
                      <PodcastEmptyPlaceholder />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
