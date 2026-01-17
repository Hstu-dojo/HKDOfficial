"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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

interface GalleryFolder {
  id: string;
  name: string;
}

interface EditImageDialogProps {
  image: GalleryImage;
  folders: GalleryFolder[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditImageDialog({
  image,
  folders,
  open,
  onOpenChange,
  onSave,
}: EditImageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(image.title || "");
  const [description, setDescription] = useState(image.description || "");
  const [altText, setAltText] = useState(image.altText || "");
  const [folderId, setFolderId] = useState(image.folderId || "root");
  const [isFeatured, setIsFeatured] = useState(image.isFeatured);
  const [isPublished, setIsPublished] = useState(image.isPublished);
  const [tagsInput, setTagsInput] = useState(image.tags?.join(", ") || "");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const response = await fetch(`/api/gallery/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || null,
          description: description.trim() || null,
          altText: altText.trim() || null,
          folderId: folderId === "root" ? null : folderId,
          isFeatured,
          isPublished,
          tags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update image");
      }

      toast({
        title: "Success",
        description: "Image updated successfully",
      });

      onOpenChange(false);
      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Image Details</DialogTitle>
            <DialogDescription>
              Update the metadata for this image.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Preview */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={image.secureUrl}
                alt={image.altText || "Preview"}
                fill
                className="object-contain"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {image.width} × {image.height} • {image.format?.toUpperCase()}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Image title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="folder">Folder</Label>
                <Select value={folderId} onValueChange={setFolderId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">Root (No folder)</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="altText">Alt Text (for accessibility)</Label>
              <Input
                id="altText"
                placeholder="Describe the image for screen readers"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., tournament, karate, 2024"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={isFeatured}
                  onCheckedChange={setIsFeatured}
                  disabled={loading}
                />
                <Label htmlFor="featured">Featured image</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                  disabled={loading}
                />
                <Label htmlFor="published">Published</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
