"use client";
import { buttonVariants } from "@/components/ui/button";
import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import { AddImageToFav } from "@/actions/AddImageToFav";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const FavBtn = ({ album }: any) => {
  const [transition, startTransition] = useTransition();
  // const addFavorite = async () => {
  //   try {
  //     const response = await fetch("/api/gallery/upload", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ public_id }),
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to add tag");
  //     }

  //     const data = await response.json();
  //     console.log("Tag added:", data);
  //   } catch (error) {
  //     console.error("Error adding tag:", error);
  //   }
  // };
  const isFavourite = album?.tags?.includes("favorite");
  // console.log(album);
  const public_id = album?.public_id;
  return (
    <button
      onClick={() => {
        startTransition(async () => {
          await AddImageToFav(public_id, isFavourite);
        });
      }}
      className={cn(
        "font absolute right-3 top-3 z-10 hidden items-center justify-center hover:text-destructive group-hover:flex",
        buttonVariants({
          className: "hidden group-hover:flex",
          variant: "ghost",
          size: "icon",
        }),
      )}
    >
      {isFavourite ? (
        <HeartFilledIcon className="h-6 w-6" />
      ) : (
        <HeartIcon className="h-6 w-6" />
      )}
    </button>
  );
};

export default FavBtn;
