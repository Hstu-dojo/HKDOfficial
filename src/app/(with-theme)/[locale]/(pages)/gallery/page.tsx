import { Metadata } from "next";
import { PublicGallery } from "@/components/gallery/PublicGallery";

export const metadata: Metadata = {
  title: "Gallery | HKD",
  description: "Explore our collection of photos from events, tournaments, and training sessions.",
  openGraph: {
    title: "Gallery | HKD",
    description: "Explore our collection of photos from events, tournaments, and training sessions.",
  },
};

export const dynamic = "force-dynamic";

export default function GalleryPage() {
  return <PublicGallery />;
}
