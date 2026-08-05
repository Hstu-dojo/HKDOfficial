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
    <div className="w-full flex flex-col min-h-screen bg-background">
      <div className="w-full flex-1 flex flex-col lg:flex-row">
        <Sidebar className="hidden lg:block w-64 shrink-0 border-r min-h-[calc(100vh-4rem)]" />
        <main className="flex-1 p-6 md:p-10 overflow-x-hidden w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
