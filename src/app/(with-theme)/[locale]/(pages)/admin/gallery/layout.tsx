import { Sidebar } from "@/components/gallery/sidebar";
import { Menu } from "@/components/gallery/menu";
import { playlists } from "@/db/playlists";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery admin",
  description: "Admin's gallery management.",
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
              <Sidebar playlists={playlists} className="hidden lg:block" />
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
