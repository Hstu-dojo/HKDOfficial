"use client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter, usePathname } from "next/navigation";
import { 
  FolderOpen, 
  ImageIcon, 
  Star, 
  Settings, 
  LayoutGrid,
  Upload
} from "lucide-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname?.includes(path);

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Gallery
          </h2>
          <div className="space-y-1">
            <Button
              onClick={() => router.push("/admin/gallery")}
              variant={isActive("/admin/gallery") && !isActive("favorite") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              All Media
            </Button>
            <Button
              onClick={() => router.push("/admin/gallery/favorite")}
              variant={isActive("favorite") ? "secondary" : "ghost"}
              className="w-full justify-start"
            >
              <Star className="mr-2 h-4 w-4" />
              Featured
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Actions
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                // Will be handled by GalleryManager
                router.push("/admin/gallery");
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/admin/gallery")}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              Manage Folders
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Quick Links
          </h2>
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => router.push("/gallery")}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              View Public Gallery
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
