"use client";
import { CldUploadButton } from "next-cloudinary";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
type Props = {
  uploadPreset?: string;
};
export default function ClourinnaryUpButton({ uploadPreset }: Props) {
  const { setTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  return (
    <>
      {isClient ? (
        <CldUploadButton uploadPreset={`${uploadPreset}`}>
          <Button onClick={() => setTheme("light")}>
            <PlusCircledIcon className="mr-2 h-4 w-4" /> Upload
          </Button>
        </CldUploadButton>
      ) : (
        "loading.."
      )}
    </>
  );
}
