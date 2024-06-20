"use client";
import { HeartFilledIcon, PlusCircledIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
// import { CldImage } from "next-cloudinary";

import { Album } from "@/db/albums";
import { playlists } from "@/db/playlists";
import Image from "next/image";
import FavBtn from "./FavBtn";
import { RmvFromFav } from "@/actions/AddImageToFav";

interface AlbumArtworkProps extends React.HTMLAttributes<HTMLDivElement> {
  album: Album;
  aspectRatio?: "portrait" | "square";
  width?: number;
  secure_url: string;
  height?: number;
}

export function AlbumArtwork({
  album,
  aspectRatio = "portrait",
  width,
  height,
  className,
  ...props
}: AlbumArtworkProps) {
  const isFavourite = album?.tags?.includes("favorite");

  // console.log(album?.tags);
  const blurDataUrl =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  return (
    <div className={cn("space-y-3", className)} {...props}>
      <ContextMenu>
        <ContextMenuTrigger className="group">
          {isFavourite ? (
            <HeartFilledIcon className="font absolute right-3 top-3 z-10 flex h-6 w-6 items-center justify-center text-destructive drop-shadow-sm transition-shadow" />
          ) : (
            <FavBtn public_id={album.public_id} />
          )}
          <div className="overflow-hidden rounded-md">
            <Image
              //@ts-ignore
              src={album?.secure_url ?? ""}
              alt={album.name}
              width={720}
              height={480}
              placeholder="blur"
              blurDataURL={album?.blurDataUrl || blurDataUrl}
              sizes="(max-width: 640px) 100vw,
                  (max-width: 1280px) 50vw,
                  (max-width: 1536px) 33vw,
                  25vw"
              className={cn(
                "h-auto w-auto object-cover transition-all hover:scale-105 group-hover:opacity-40",
                // aspectRatio === "portrait" ? "aspect-[3/4]" : "aspect-square",
              )}
              // className="transform rounded-lg brightness-90 transition will-change-auto group-hover:brightness-110"
              style={{ transform: "translate3d(0, 0, 0)" }}
            />
            <div className="fixed bottom-0 hidden w-full bg-black/25 py-5 group-hover:block">
              <p className="mx-2 overflow-hidden font-sans font-bold text-slate-700 dark:text-slate-300">
                {album?.filename}
              </p>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-40">
          {isFavourite && (
            <ContextMenuItem
              onClick={async () => {
                await RmvFromFav(album.public_id);
                await new Promise((resolve)=>setTimeout(resolve, 1000))
              }}
            >
              Remove Favorite
            </ContextMenuItem>
          )}
          <ContextMenuSub>
            <ContextMenuSubTrigger>Add to Playlist</ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              <ContextMenuItem>
                <PlusCircledIcon className="mr-2 h-4 w-4" />
                New Playlist
              </ContextMenuItem>
              <ContextMenuSeparator />
              {playlists.map((playlist: any) => (
                <ContextMenuItem key={playlist}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3" />
                  </svg>
                  {playlist}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem>Play Next</ContextMenuItem>
          <ContextMenuItem>Play Later</ContextMenuItem>
          <ContextMenuItem>Create Station</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>Like</ContextMenuItem>
          <ContextMenuItem>Share</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <div className="space-y-1 text-sm">
        <h3 className="font-medium leading-none">{album.name}</h3>
        <p className="text-xs text-muted-foreground">{album.artist}</p>
      </div>
    </div>
  );
}
