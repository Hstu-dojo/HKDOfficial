"use client";
import { CldUploadButton } from "next-cloudinary";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
export default function ClourinnaryUpButton() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  return (
    <>
      {isClient ? (
        <Button>
          <PlusCircledIcon className="mr-2 h-4 w-4" />
          <CldUploadButton uploadPreset="vms4f3ld">Upload</CldUploadButton>{" "}
        </Button>
      ) : (
        "loading.."
      )}
    </>
  );
}
