import { Sidebar } from "@/components/gallery/sidebar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery Admin",
  description: "Admin gallery management with Cloudinary.",
};

export default async function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="portal-gallery-layout">
        <Sidebar className="portal-gallery-nav rounded-xl border bg-card" />
        <main className="min-w-0 w-full">
          {children}
        </main>
    </div>
  );
}
