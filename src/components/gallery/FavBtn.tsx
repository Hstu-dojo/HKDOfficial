"use client";
import { Button } from "@/components/ui/button";
import { HeartFilledIcon } from "@radix-ui/react-icons";
import { AddImageToFav } from "@/actions/AddImageToFav";
import { startTransition, useTransition } from "react";
import { start } from "repl";

const FavBtn = ({ public_id }: any) => {
  const [transition, setTransition] = useTransition();
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

  return (
    <Button
      onClick={() => {
        startTransition(() => {
          AddImageToFav(public_id);
        });
      }}
      size={"icon"}
      variant={"secondary"}
      className="font absolute right-3 top-3 z-10 hidden items-center justify-center hover:text-destructive group-hover:flex"
    >
      <HeartFilledIcon className="h-6 w-6" />
    </Button>
  );
};

export default FavBtn;
