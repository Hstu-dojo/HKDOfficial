"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderOpen,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Star,
  StarOff,
  Plus,
  Upload,
  ChevronRight,
  Home,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { GalleryUploadButton } from "./GalleryUploadButton";
import { EditImageDialog } from "./EditImageDialog";
import { EditFolderDialog } from "./EditFolderDialog";
import { cn } from "@/lib/utils";

interface GalleryFolder {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  cloudinaryFolder: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  imageCount: number;
  coverImage: {
    id: string;
    secureUrl: string;
    title: string | null;
  } | null;
}

interface GalleryImage {
  id: string;
  folderId: string | null;
  publicId: string;
  secureUrl: string;
  format: string | null;
  width: number | null;
  height: number | null;
  title: string | null;
  description: string | null;
  altText: string | null;
  tags: string[];
  isFeatured: boolean;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// Mini folder card for the left panel sidebar
function AlbumSidebarCard({
  folder,
  isSelected,
  onSelect,
  onEdit,
  onTogglePublish,
  onDelete,
}: {
  folder: GalleryFolder;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const previews = folder.coverImage ? [folder.coverImage.secureUrl] : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      className={cn(
        "group relative rounded-2xl cursor-pointer transition-all duration-200",
        isSelected
          ? "ring-2 ring-primary shadow-lg shadow-primary/10"
          : "hover:ring-1 hover:ring-white/10"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
    >
      {/* Folder back panel */}
      <div
        className={cn(
          "relative rounded-2xl overflow-hidden transition-colors duration-200",
          isSelected ? "bg-primary/10" : "bg-muted/40 group-hover:bg-muted/60"
        )}
        style={{
          height: "120px",
          border: isSelected
            ? "1px solid hsl(var(--primary) / 0.3)"
            : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Preview images or placeholder */}
        {previews.length > 0 ? (
          <div className="absolute inset-0">
            <Image
              src={previews[0]}
              alt={folder.name}
              fill
              className="object-cover opacity-60"
              sizes="200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <FolderOpen
              className={cn(
                "h-10 w-10 transition-colors",
                isSelected ? "text-primary/60" : "text-muted-foreground/30"
              )}
            />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {!folder.isPublished && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
              <EyeOff className="h-2.5 w-2.5" />
              Draft
            </Badge>
          )}
        </div>

        {/* Context menu */}
        <div
          className={cn(
            "absolute top-2 right-2 transition-opacity",
            isHovered || isSelected ? "opacity-100" : "opacity-0"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-6 w-6 bg-black/40 hover:bg-black/60 border-0">
                <MoreVertical className="h-3 w-3 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePublish}>
                {folder.isPublished ? (
                  <><EyeOff className="mr-2 h-4 w-4" /> Unpublish</>
                ) : (
                  <><Eye className="mr-2 h-4 w-4" /> Publish</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Footer */}
      <div className="px-2 py-2">
        <p className="text-xs font-semibold truncate leading-tight">{folder.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {folder.imageCount} photo{folder.imageCount !== 1 ? "s" : ""}
        </p>
      </div>
    </motion.div>
  );
}

// Image thumbnail in the right panel workspace
function ImageThumbnail({
  image,
  onEdit,
  onTogglePublish,
  onToggleFeatured,
  onDelete,
}: {
  image: GalleryImage;
  onEdit: () => void;
  onTogglePublish: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
      className="group relative overflow-hidden rounded-xl bg-muted/30 cursor-pointer"
    >
      {/* Aspect square container */}
      <div className="aspect-square relative">
        <Image
          src={image.secureUrl}
          alt={image.altText || image.title || "Gallery image"}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {image.isFeatured && (
            <Badge className="text-[10px] px-1.5 py-0 h-4 gap-0.5 bg-yellow-500 text-black border-0">
              <Star className="h-2.5 w-2.5 fill-current" /> Featured
            </Badge>
          )}
          {!image.isPublished && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
              <EyeOff className="h-2.5 w-2.5" /> Draft
            </Badge>
          )}
        </div>

        {/* Hover action menu */}
        <div
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-7 w-7 bg-black/50 hover:bg-black/70 border-0 text-white">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" /> Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleFeatured}>
                {image.isFeatured ? (
                  <><StarOff className="mr-2 h-4 w-4" /> Unfeature</>
                ) : (
                  <><Star className="mr-2 h-4 w-4" /> Mark Featured</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePublish}>
                {image.isPublished ? (
                  <><EyeOff className="mr-2 h-4 w-4" /> Unpublish</>
                ) : (
                  <><Eye className="mr-2 h-4 w-4" /> Publish</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title tooltip on hover */}
        {image.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-white text-xs truncate font-medium">{image.title}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function GalleryManager() {
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<GalleryFolder | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [loadingImages, setLoadingImages] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "folder" | "image";
    id: string;
    name: string;
  } | null>(null);
  const [editImage, setEditImage] = useState<GalleryImage | null>(null);
  const [editFolder, setEditFolder] = useState<GalleryFolder | null>(null);
  const { toast } = useToast();

  // Load top-level folders
  const loadFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const res = await fetch("/api/gallery/folders?parentId=root");
      const data = await res.json();
      setFolders(data.folders || []);
    } catch {
      toast({ title: "Error", description: "Failed to load albums", variant: "destructive" });
    } finally {
      setLoadingFolders(false);
    }
  }, [toast]);

  // Load images for selected folder
  const loadImages = useCallback(async (folderId: string | null) => {
    setLoadingImages(true);
    try {
      const param = folderId ? `folderId=${folderId}` : "folderId=root";
      const res = await fetch(`/api/gallery/images?${param}`);
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      toast({ title: "Error", description: "Failed to load images", variant: "destructive" });
    } finally {
      setLoadingImages(false);
    }
  }, [toast]);

  useEffect(() => { loadFolders(); }, [loadFolders]);
  useEffect(() => {
    if (selectedFolder !== undefined) {
      loadImages(selectedFolder?.id ?? null);
    }
  }, [selectedFolder, loadImages]);

  const handleSelectFolder = (folder: GalleryFolder | null) => {
    setSelectedFolder(folder);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const endpoint =
        deleteTarget.type === "folder"
          ? `/api/gallery/folders/${deleteTarget.id}`
          : `/api/gallery/images/${deleteTarget.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);

      toast({
        title: "Deleted",
        description: `${deleteTarget.type === "folder" ? "Album" : "Image"} deleted`,
      });

      if (deleteTarget.type === "folder") {
        loadFolders();
        if (selectedFolder?.id === deleteTarget.id) setSelectedFolder(null);
      } else {
        loadImages(selectedFolder?.id ?? null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Delete failed",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const togglePublish = async (type: "folder" | "image", id: string, current: boolean) => {
    const endpoint =
      type === "folder" ? `/api/gallery/folders/${id}` : `/api/gallery/images/${id}`;
    await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    toast({ title: !current ? "Published" : "Unpublished", description: `${type === "folder" ? "Album" : "Image"} updated` });
    if (type === "folder") loadFolders();
    else loadImages(selectedFolder?.id ?? null);
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await fetch(`/api/gallery/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !current }),
    });
    toast({ title: !current ? "Marked as Featured" : "Removed from Featured" });
    loadImages(selectedFolder?.id ?? null);
  };

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* ── LEFT PANEL: Album list ── */}
      <div className="w-64 shrink-0 flex flex-col gap-4">
        {/* Panel header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Albums
          </h2>
          <CreateFolderDialog parentId={null} onFolderCreated={loadFolders} />
        </div>

        {/* "All" / root option */}
        <button
          onClick={() => handleSelectFolder(null)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left w-full",
            selectedFolder === null
              ? "bg-primary/10 text-primary border border-primary/20"
              : "text-muted-foreground hover:bg-muted/50"
          )}
        >
          <Home className="h-4 w-4 shrink-0" />
          <span className="font-medium">Root / Uncategorized</span>
        </button>

        {/* Folder grid */}
        {loadingFolders ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : folders.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
            {folders.map((folder) => (
              <AlbumSidebarCard
                key={folder.id}
                folder={folder}
                isSelected={selectedFolder?.id === folder.id}
                onSelect={() => handleSelectFolder(folder)}
                onEdit={() => setEditFolder(folder)}
                onTogglePublish={() => togglePublish("folder", folder.id, folder.isPublished)}
                onDelete={() => setDeleteTarget({ type: "folder", id: folder.id, name: folder.name })}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No albums yet</p>
            <p className="text-xs text-muted-foreground/60">Click + to create one</p>
          </div>
        )}
      </div>

      {/* ── RIGHT PANEL: Image workspace ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Workspace header */}
        <div className="flex items-center justify-between">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Gallery</span>
            {selectedFolder && (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                <span className="font-semibold">{selectedFolder.name}</span>
                {!selectedFolder.isPublished && (
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4 gap-0.5">
                    <EyeOff className="h-2.5 w-2.5" /> Draft
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Upload button */}
          {selectedFolder ? (
            <GalleryUploadButton
              folderId={selectedFolder.id}
              cloudinaryFolder={selectedFolder.cloudinaryFolder}
              onUploadComplete={() => loadImages(selectedFolder.id)}
            />
          ) : (
            <GalleryUploadButton
              folderId={undefined}
              cloudinaryFolder={undefined}
              onUploadComplete={() => loadImages(null)}
            />
          )}
        </div>

        {/* Album info bar when folder selected */}
        {selectedFolder?.description && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/30 border text-sm text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="line-clamp-2">{selectedFolder.description}</p>
          </div>
        )}

        {/* Image grid */}
        {loadingImages ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : images.length > 0 ? (
          <AnimatePresence>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {images.map((image) => (
                <ImageThumbnail
                  key={image.id}
                  image={image}
                  onEdit={() => setEditImage(image)}
                  onTogglePublish={() => togglePublish("image", image.id, image.isPublished)}
                  onToggleFeatured={() => toggleFeatured(image.id, image.isFeatured)}
                  onDelete={() =>
                    setDeleteTarget({ type: "image", id: image.id, name: image.title || "this image" })
                  }
                />
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center rounded-2xl border-2 border-dashed border-muted-foreground/20">
            <ImageIcon className="h-14 w-14 text-muted-foreground/20 mb-4" />
            <h3 className="text-base font-semibold mb-1">
              {selectedFolder ? `"${selectedFolder.name}" is empty` : "No uncategorized images"}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {selectedFolder
                ? "Upload photos to fill this album."
                : "Select an album on the left or upload here."}
            </p>
            {selectedFolder && (
              <GalleryUploadButton
                folderId={selectedFolder.id}
                cloudinaryFolder={selectedFolder.cloudinaryFolder}
                onUploadComplete={() => loadImages(selectedFolder.id)}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Dialogs ── */}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === "folder" ? "Album" : "Image"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "folder"
                ? `This will permanently delete the album "${deleteTarget?.name}" and all its images. This cannot be undone.`
                : `This will permanently delete ${deleteTarget?.name}. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit image */}
      {editImage && (
        <EditImageDialog
          image={editImage}
          folders={folders}
          open={!!editImage}
          onOpenChange={(open) => !open && setEditImage(null)}
          onSave={() => loadImages(selectedFolder?.id ?? null)}
        />
      )}

      {/* Edit folder */}
      {editFolder && (
        <EditFolderDialog
          folder={editFolder}
          open={!!editFolder}
          onOpenChange={(open) => !open && setEditFolder(null)}
          onSave={() => { loadFolders(); if (selectedFolder?.id === editFolder.id) loadImages(editFolder.id); }}
        />
      )}
    </div>
  );
}
