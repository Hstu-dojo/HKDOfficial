"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface GalleryFolder {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  displayOrder: number;
}

interface EditFolderDialogProps {
  folder: GalleryFolder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditFolderDialog({
  folder,
  open,
  onOpenChange,
  onSave,
}: EditFolderDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description || "");
  const [isPublished, setIsPublished] = useState(folder.isPublished);
  const [displayOrder, setDisplayOrder] = useState(folder.displayOrder);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Folder name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/gallery/folders/${folder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPublished,
          displayOrder,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update folder");
      }

      toast({
        title: "Success",
        description: "Folder updated successfully",
      });

      onOpenChange(false);
      onSave();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update folder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription>
              Update the folder details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                placeholder="e.g., Tournament 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="A brief description of this folder..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="published"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                disabled={loading}
              />
              <Label htmlFor="published">Published (visible to public)</Label>
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
