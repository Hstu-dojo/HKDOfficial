import { Sidebar } from "@/components/gallery/sidebar";
import { Menu } from "@/components/gallery/menu";
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
    <>
      <div className="block">
        <Menu />
        <div className="border-t">
          <div className="">
            <div className="grid lg:grid-cols-5">
              <Sidebar className="hidden lg:block" />
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
