"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderOpen,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  Home,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { GalleryUploadButton } from "./GalleryUploadButton";
import { EditImageDialog } from "./EditImageDialog";
import { EditFolderDialog } from "./EditFolderDialog";

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

interface GalleryManagerProps {
  initialFolderId?: string | null;
}

export function GalleryManager({ initialFolderId = null }: GalleryManagerProps) {
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [currentFolder, setCurrentFolder] = useState<GalleryFolder | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: "Gallery" },
  ]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "folder" | "image"; id: string; name: string } | null>(null);
  const [editImage, setEditImage] = useState<GalleryImage | null>(null);
  const [editFolder, setEditFolder] = useState<GalleryFolder | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const folderId = currentFolder?.id || initialFolderId;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load folders
      const foldersRes = await fetch(`/api/gallery/folders?parentId=${folderId || "root"}`);
      const foldersData = await foldersRes.json();
      setFolders(foldersData.folders || []);

      // Load images
      const imagesRes = await fetch(`/api/gallery/images?folderId=${folderId || "root"}`);
      const imagesData = await imagesRes.json();
      setImages(imagesData.images || []);
    } catch (error) {
      console.error("Error loading gallery data:", error);
      toast({
        title: "Error",
        description: "Failed to load gallery data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [folderId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateToFolder = async (folder: GalleryFolder | null) => {
    if (folder) {
      setCurrentFolder(folder);
      setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    } else {
      setCurrentFolder(null);
      setBreadcrumbs([{ id: null, name: "Gallery" }]);
    }
  };

  const navigateToBreadcrumb = (index: number) => {
    const breadcrumb = breadcrumbs[index];
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    if (breadcrumb.id) {
      // Load that folder
      const folder = folders.find((f) => f.id === breadcrumb.id);
      setCurrentFolder(folder || null);
    } else {
      setCurrentFolder(null);
    }
  };

  const goBack = () => {
    if (breadcrumbs.length > 1) {
      navigateToBreadcrumb(breadcrumbs.length - 2);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const endpoint =
        deleteTarget.type === "folder"
          ? `/api/gallery/folders/${deleteTarget.id}`
          : `/api/gallery/images/${deleteTarget.id}`;

      const response = await fetch(endpoint, { method: "DELETE" });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete ${deleteTarget.type}`);
      }

      toast({
        title: "Deleted",
        description: `${deleteTarget.type === "folder" ? "Folder" : "Image"} deleted successfully`,
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const togglePublish = async (type: "folder" | "image", id: string, currentState: boolean) => {
    try {
      const endpoint = type === "folder" ? `/api/gallery/folders/${id}` : `/api/gallery/images/${id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentState }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      toast({
        title: "Updated",
        description: `${type === "folder" ? "Folder" : "Image"} ${!currentState ? "published" : "unpublished"}`,
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update publish status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {breadcrumbs.length > 1 && (
            <Button variant="ghost" size="icon" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || "root"} className="flex items-center">
              {index > 0 && <span className="mx-2 text-muted-foreground">/</span>}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToBreadcrumb(index)}
                className={index === breadcrumbs.length - 1 ? "font-semibold" : ""}
              >
                {index === 0 ? <Home className="mr-1 h-4 w-4" /> : null}
                {crumb.name}
              </Button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <CreateFolderDialog
            parentId={currentFolder?.id}
            onFolderCreated={loadData}
          />
          <GalleryUploadButton
            folderId={currentFolder?.id}
            cloudinaryFolder={currentFolder?.cloudinaryFolder}
            onUploadComplete={loadData}
          />
        </div>
      </div>

      <Separator />

      {/* Folders */}
      {folders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Folders</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="group relative cursor-pointer transition-all hover:shadow-md"
              >
                <div onClick={() => navigateToFolder(folder)}>
                  <CardHeader className="p-3">
                    <div className="aspect-square relative rounded-md bg-muted flex items-center justify-center overflow-hidden">
                      {folder.coverImage ? (
                        <Image
                          src={folder.coverImage.secureUrl}
                          alt={folder.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                      ) : (
                        <FolderOpen className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <CardTitle className="text-sm font-medium truncate">{folder.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {folder.imageCount} image{folder.imageCount !== 1 ? "s" : ""}
                    </p>
                  </CardContent>
                </div>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!folder.isPublished && (
                    <Badge variant="secondary" className="text-xs">
                      <EyeOff className="mr-1 h-3 w-3" />
                      Draft
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="secondary" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditFolder(folder)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePublish("folder", folder.id, folder.isPublished)}>
                        {folder.isPublished ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Publish
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteTarget({ type: "folder", id: folder.id, name: folder.name })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div className="space-y-4">
          {folders.length > 0 && <Separator />}
          <h3 className="text-lg font-semibold">Images</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {images.map((image) => (
              <Card
                key={image.id}
                className="group relative overflow-hidden transition-all hover:shadow-md"
              >
                <div className="aspect-square relative">
                  <Image
                    src={image.secureUrl}
                    alt={image.altText || image.title || "Gallery image"}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16vw"
                  />
                  {image.isFeatured && (
                    <Badge className="absolute left-2 top-2" variant="default">
                      Featured
                    </Badge>
                  )}
                  {!image.isPublished && (
                    <Badge className="absolute left-2 bottom-2" variant="secondary">
                      <EyeOff className="mr-1 h-3 w-3" />
                      Draft
                    </Badge>
                  )}
                </div>
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditImage(image)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePublish("image", image.id, image.isPublished)}>
                        {image.isPublished ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Publish
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            type: "image",
                            id: image.id,
                            name: image.title || "this image",
                          })
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {image.title && (
                  <CardFooter className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white truncate">{image.title}</p>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {folders.length === 0 && images.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No content yet</h3>
          <p className="text-muted-foreground mb-4">
            Create a folder or upload images to get started.
          </p>
          <div className="flex gap-2">
            <CreateFolderDialog parentId={currentFolder?.id} onFolderCreated={loadData} />
            <GalleryUploadButton
              folderId={currentFolder?.id}
              cloudinaryFolder={currentFolder?.cloudinaryFolder}
              onUploadComplete={loadData}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "folder"
                ? `This will permanently delete the folder "${deleteTarget.name}" and all its contents. This action cannot be undone.`
                : `This will permanently delete ${deleteTarget?.name}. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Image Dialog */}
      {editImage && (
        <EditImageDialog
          image={editImage}
          folders={folders}
          open={!!editImage}
          onOpenChange={(open) => !open && setEditImage(null)}
          onSave={loadData}
        />
      )}

      {/* Edit Folder Dialog */}
      {editFolder && (
        <EditFolderDialog
          folder={editFolder}
          open={!!editFolder}
          onOpenChange={(open) => !open && setEditFolder(null)}
          onSave={loadData}
        />
      )}
    </div>
  );
}
