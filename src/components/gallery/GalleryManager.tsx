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
  Star,
  StarOff,
  ArrowLeft,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { GalleryUploadButton } from "./GalleryUploadButton";
import { EditImageDialog } from "./EditImageDialog";
import { EditFolderDialog } from "./EditFolderDialog";
import { cn } from "@/lib/utils";
import { AlbumFolder } from "../folders-ui/project-folder/AlbumFolder";
import { NewAlbumSlot } from "../folders-ui/NewAlbumSlot";

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

export function GalleryManager() {
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  // null = showing all folders. Object = showing images inside that folder
  const [activeFolder, setActiveFolder] = useState<GalleryFolder | null>(null);
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
    if (activeFolder !== null) {
      loadImages(activeFolder.id);
    }
  }, [activeFolder, loadImages]);

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
        if (activeFolder?.id === deleteTarget.id) setActiveFolder(null);
      } else {
        loadImages(activeFolder?.id ?? null);
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
    else loadImages(activeFolder?.id ?? null);
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await fetch(`/api/gallery/images/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !current }),
    });
    toast({ title: !current ? "Marked as Featured" : "Removed from Featured" });
    loadImages(activeFolder?.id ?? null);
  };

  return (
    <div className="w-full flex flex-col min-h-[600px] bg-background">
      
      {/* ── Drill-down Logic ── */}
      {!activeFolder ? (
        /* ALBUMS VIEW (ROOT) */
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Gallery Albums</h1>
              <p className="text-muted-foreground">Manage your photo collections</p>
            </div>
            <CreateFolderDialog parentId={null} onFolderCreated={loadFolders} />
          </div>

          {loadingFolders ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[288/224] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-16 items-start py-6 w-full">
              <CreateFolderDialog parentId={null} onFolderCreated={loadFolders}>
                <div className="flex items-center justify-center w-full">
                  <NewAlbumSlot />
                </div>
              </CreateFolderDialog>
              
              {folders.map((folder, i) => (
                <div key={folder.id} className="relative group w-full flex items-center justify-center">
                  <AlbumFolder
                    index={i}
                    album={{
                      id: folder.id,
                      name: folder.name,
                      slug: folder.slug,
                      description: folder.description,
                      imageCount: folder.imageCount,
                      createdAt: folder.createdAt,
                      previewImages: folder.coverImage ? [{ secureUrl: folder.coverImage.secureUrl }] : [],
                    }}
                    onClick={() => setActiveFolder(folder)}
                  />
                  
                  {/* Context Menu Overlay */}
                  <div className="absolute top-2 right-2 z-[60] opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditFolder(folder); }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); togglePublish("folder", folder.id, folder.isPublished); }}>
                          {folder.isPublished ? (
                            <><EyeOff className="mr-2 h-4 w-4" /> Unpublish Album</>
                          ) : (
                            <><Eye className="mr-2 h-4 w-4" /> Publish Album</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "folder", id: folder.id, name: folder.name }); }}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Album
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {!folder.isPublished && (
                    <Badge variant="secondary" className="absolute top-2 left-2 z-[60] bg-background/80 backdrop-blur-sm shadow-sm pointer-events-none">
                      <EyeOff className="h-3 w-3 mr-1" /> Draft
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* IMAGES VIEW (INSIDE FOLDER) */
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex flex-col gap-2">
              <Button variant="ghost" size="sm" onClick={() => setActiveFolder(null)} className="w-fit -ml-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Albums
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{activeFolder.name}</h1>
                {!activeFolder.isPublished && <Badge variant="secondary">Draft</Badge>}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setEditFolder(activeFolder)}>
                <Edit className="mr-2 h-4 w-4" /> Edit Album
              </Button>
              <GalleryUploadButton
                folderId={activeFolder.id}
                cloudinaryFolder={activeFolder.cloudinaryFolder}
                onUploadComplete={() => { loadImages(activeFolder.id); loadFolders(); }}
              />
            </div>
          </div>

          {activeFolder.description && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border text-muted-foreground">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{activeFolder.description}</p>
            </div>
          )}

          {loadingImages ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((image) => (
                <div key={image.id} className="group relative aspect-square rounded-xl overflow-hidden bg-muted border">
                  <Image
                    src={image.secureUrl}
                    alt={image.title || "Gallery image"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                    {image.isFeatured && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black border-0 shadow-sm">
                        <Star className="h-3 w-3 fill-current mr-1" /> Featured
                      </Badge>
                    )}
                    {!image.isPublished && (
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        <EyeOff className="h-3 w-3 mr-1" /> Draft
                      </Badge>
                    )}
                  </div>

                  {/* Menu */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditImage(image)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleFeatured(image.id, image.isFeatured)}>
                          {image.isFeatured ? (
                            <><StarOff className="mr-2 h-4 w-4" /> Remove Feature</>
                          ) : (
                            <><Star className="mr-2 h-4 w-4" /> Feature Image</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish("image", image.id, image.isPublished)}>
                          {image.isPublished ? (
                            <><EyeOff className="mr-2 h-4 w-4" /> Unpublish</>
                          ) : (
                            <><Eye className="mr-2 h-4 w-4" /> Publish</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ type: "image", id: image.id, name: image.title || "this image" })}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">Album is empty</h3>
              <p className="text-muted-foreground mb-6">Upload some photos to this album to get started.</p>
              <GalleryUploadButton
                folderId={activeFolder.id}
                cloudinaryFolder={activeFolder.cloudinaryFolder}
                onUploadComplete={() => { loadImages(activeFolder.id); loadFolders(); }}
              />
            </div>
          )}
        </div>
      )}

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
          onSave={() => loadImages(activeFolder?.id ?? null)}
        />
      )}

      {/* Edit folder */}
      {editFolder && (
        <EditFolderDialog
          folder={editFolder}
          open={!!editFolder}
          onOpenChange={(open) => !open && setEditFolder(null)}
          onSave={() => { loadFolders(); if (activeFolder?.id === editFolder.id) loadImages(editFolder.id); }}
        />
      )}
    </div>
  );
}
