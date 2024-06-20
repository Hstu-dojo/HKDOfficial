"use client";
import { Button } from "@/components/ui/button";
import { HeartIcon } from "@radix-ui/react-icons";
import { AddImageToFav } from "@/actions/AddImageToFav";
import { useTransition } from "react";

const FavBtn = ({ public_id }: any) => {
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

  return (
    <Button
      onClick={() => {
        startTransition(() => {
          AddImageToFav(public_id);
        });
      }}
      size={"icon"}
      variant={"outline"}
      className="font absolute right-3 top-3 z-10 hidden items-center justify-center hover:text-destructive group-hover:flex"
    >
      <HeartIcon className="h-6 w-6" />
    </Button>
  );
};

export default FavBtn;
