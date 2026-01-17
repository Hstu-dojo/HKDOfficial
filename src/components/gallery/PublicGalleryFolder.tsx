"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  ZoomIn,
  ArrowLeft,
  ImageIcon,
  Calendar,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryFolder {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  isPublished: boolean;
  createdAt: string;
}

interface GalleryImage {
  id: string;
  secureUrl: string;
  title: string | null;
  description: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  isFeatured: boolean;
  createdAt: string;
}

interface PublicGalleryFolderProps {
  folder: GalleryFolder;
}

export function PublicGalleryFolder({ folder }: PublicGalleryFolderProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [childFolders, setChildFolders] = useState<GalleryFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`/api/gallery/folders/${folder.id}?public=true`);
        const data = await response.json();
        setImages(data.images || []);
        setChildFolders(data.childFolders || []);
      } catch (error) {
        console.error("Error loading folder:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [folder.id]);

  const openLightbox = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIndex = (imageIndex + 1) % images.length;
    setImageIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = (imageIndex - 1 + images.length) % images.length;
    setImageIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-12 w-64 mb-2" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <section className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/gallery">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Gallery
              </Button>
            </Link>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <Badge variant="outline" className="mb-2">
                  <FolderOpen className="mr-2 h-3 w-3" />
                  Album
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {folder.name}
                </h1>
                {folder.description && (
                  <p className="text-muted-foreground mt-2 max-w-2xl">
                    {folder.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  {images.length} photos
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(folder.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Child Folders */}
      {childFolders.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Sub-albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {childFolders.map((childFolder) => (
              <Link key={childFolder.id} href={`/gallery/${childFolder.slug}`}>
                <div className="group relative overflow-hidden rounded-xl bg-card border hover:shadow-md transition-all">
                  <div className="aspect-square relative bg-muted flex items-center justify-center">
                    <FolderOpen className="h-12 w-12 text-muted-foreground/50 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                      {childFolder.name}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Images Grid */}
      <section className="container mx-auto px-4 py-8">
        {images.length > 0 ? (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="break-inside-avoid group relative overflow-hidden rounded-xl cursor-pointer"
                onClick={() => openLightbox(image, index)}
              >
                <div className="relative">
                  <Image
                    src={image.secureUrl}
                    alt={image.altText || image.title || "Gallery image"}
                    width={image.width || 600}
                    height={image.height || 400}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-white">
                      <ZoomIn className="h-5 w-5" />
                      {image.title && (
                        <span className="text-sm font-medium truncate">
                          {image.title}
                        </span>
                      )}
                    </div>
                  </div>
                  {image.isFeatured && (
                    <Badge className="absolute top-2 left-2" variant="default">
                      Featured
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No photos yet</h2>
            <p className="text-muted-foreground">
              This album is empty. Check back soon!
            </p>
          </div>
        )}
      </section>

      {/* Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => closeLightbox()}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-0">
          <DialogTitle className="sr-only">
            {selectedImage?.title || "Gallery Image"}
          </DialogTitle>
          <AnimatePresence mode="wait">
            {selectedImage && (
              <motion.div
                key={selectedImage.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative flex items-center justify-center min-h-[50vh]"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                  onClick={closeLightbox}
                >
                  <X className="h-6 w-6" />
                </Button>

                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 h-12 w-12"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  </>
                )}

                <div className="relative max-w-[90vw] max-h-[85vh]">
                  <Image
                    src={selectedImage.secureUrl}
                    alt={selectedImage.altText || selectedImage.title || "Gallery image"}
                    width={selectedImage.width || 1200}
                    height={selectedImage.height || 800}
                    className="object-contain max-h-[85vh] w-auto"
                    priority
                  />
                </div>

                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      {selectedImage.title && (
                        <h3 className="text-white text-xl font-bold mb-1">
                          {selectedImage.title}
                        </h3>
                      )}
                      {selectedImage.description && (
                        <p className="text-white/80 text-sm max-w-xl">
                          {selectedImage.description}
                        </p>
                      )}
                    </div>
                    <a
                      href={selectedImage.secureUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:flex"
                    >
                      <Button variant="secondary" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </a>
                  </div>
                  <div className="flex justify-center mt-4 gap-1 flex-wrap max-w-md mx-auto">
                    {images.length <= 20 && images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setImageIndex(i);
                          setSelectedImage(images[i]);
                        }}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          i === imageIndex ? "bg-white w-6" : "bg-white/40"
                        )}
                      />
                    ))}
                    {images.length > 20 && (
                      <span className="text-white/80 text-sm">
                        {imageIndex + 1} / {images.length}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
