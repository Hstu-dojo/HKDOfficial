"use client";

import { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface GalleryUploadButtonProps {
  folderId?: string | null;
  cloudinaryFolder?: string;
  onUploadComplete: () => void;
}

interface CloudinaryUploadResult {
  public_id: string;
  asset_id: string;
  secure_url: string;
  format: string;
  resource_type: string;
  width: number;
  height: number;
  bytes: number;
  original_filename: string;
}

export function GalleryUploadButton({
  folderId,
  cloudinaryFolder,
  onUploadComplete,
}: GalleryUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<CloudinaryUploadResult[]>([]);
  const { toast } = useToast();

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "yddebkab";
  const baseFolder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "hkd-gallery";
  const folder = cloudinaryFolder || baseFolder;

  const handleUploadSuccess = (result: any) => {
    if (result?.info && typeof result.info !== "string") {
      const imageInfo: CloudinaryUploadResult = {
        public_id: result.info.public_id,
        asset_id: result.info.asset_id,
        secure_url: result.info.secure_url,
        format: result.info.format,
        resource_type: result.info.resource_type,
        width: result.info.width,
        height: result.info.height,
        bytes: result.info.bytes,
        original_filename: result.info.original_filename,
      };
      setUploadedImages((prev) => [...prev, imageInfo]);
    }
  };

  const handleQueueEnd = async () => {
    if (uploadedImages.length === 0) {
      setUploading(false);
      return;
    }

    try {
      // Save all uploaded images to our database
      const response = await fetch("/api/gallery/images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          images: uploadedImages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save images");
      }

      const { images } = await response.json();

      toast({
        title: "Upload Complete",
        description: `${images.length} image${images.length > 1 ? "s" : ""} uploaded successfully`,
      });

      setUploadedImages([]);
      onUploadComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <CldUploadWidget
      uploadPreset={uploadPreset}
      options={{
        folder,
        multiple: true,
        maxFiles: 20,
        resourceType: "image",
        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
        maxFileSize: 10000000, // 10MB
        cropping: false,
        showUploadMoreButton: true,
        sources: ["local", "url", "camera"],
        styles: {
          palette: {
            window: "#1e1e2e",
            windowBorder: "#3b3b4f",
            tabIcon: "#FFFFFF",
            menuIcons: "#FFFFFF",
            textDark: "#FFFFFF",
            textLight: "#FFFFFF",
            link: "#6366F1",
            action: "#6366F1",
            inactiveTabIcon: "#9CA3AF",
            error: "#EF4444",
            inProgress: "#6366F1",
            complete: "#10B981",
            sourceBg: "#2e2e3e",
          },
        },
      }}
      onOpen={() => setUploading(true)}
      onClose={() => handleQueueEnd()}
      onSuccess={handleUploadSuccess}
      onError={(error: any) => {
        console.error("Upload error:", error);
        toast({
          title: "Upload Error",
          description: "Failed to upload one or more images",
          variant: "destructive",
        });
      }}
    >
      {({ open }) => (
        <Button onClick={() => open()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Upload Images
        </Button>
      )}
    </CldUploadWidget>
  );
}
