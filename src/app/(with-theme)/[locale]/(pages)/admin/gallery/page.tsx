import { Metadata } from "next";
import { GalleryManager } from "@/components/gallery/GalleryManager";

export const metadata: Metadata = {
  title: "Gallery Management | Admin",
  description: "Manage your gallery folders and images with Cloudinary.",
};

export const dynamic = "force-dynamic";

export default function GalleryAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gallery Management</h1>
        <p className="text-muted-foreground">
          Organize your images into folders and manage your gallery content.
        </p>
      </div>
      <GalleryManager />
    </div>
  );
}
