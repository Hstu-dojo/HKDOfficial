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
  FolderOpen,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Download,
  ZoomIn,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryFolder {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isPublished: boolean;
  imageCount: number;
  coverImage: {
    id: string;
    secureUrl: string;
    title: string | null;
  } | null;
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

export function PublicGallery() {
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [featuredImages, setFeaturedImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        // Load published folders
        const foldersRes = await fetch("/api/gallery/folders?public=true&parentId=root");
        const foldersData = await foldersRes.json();
        setFolders(foldersData.folders || []);

        // Load featured images
        const imagesRes = await fetch("/api/gallery/images?public=true&featured=true&limit=12");
        const imagesData = await imagesRes.json();
        setFeaturedImages(imagesData.images || []);
      } catch (error) {
        console.error("Error loading gallery:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const openLightbox = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIndex = (imageIndex + 1) % featuredImages.length;
    setImageIndex(nextIndex);
    setSelectedImage(featuredImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = (imageIndex - 1 + featuredImages.length) % featuredImages.length;
    setImageIndex(prevIndex);
    setSelectedImage(featuredImages[prevIndex]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero/pattern.svg')] opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="mb-4">
              <ImageIcon className="mr-2 h-3 w-3" />
              Photo Gallery
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Capture the{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Moments
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Explore our collection of photos from tournaments, training sessions,
              belt ceremonies, and community events.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Featured Images */}
      {featuredImages.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Featured Photos</h2>
                <p className="text-muted-foreground">Highlights from our events</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {featuredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "group relative overflow-hidden rounded-xl cursor-pointer",
                    index === 0 && "col-span-2 row-span-2"
                  )}
                  onClick={() => openLightbox(image, index)}
                >
                  <div className={cn(
                    "aspect-square relative",
                    index === 0 && "aspect-square"
                  )}>
                    <Image
                      src={image.secureUrl}
                      alt={image.altText || image.title || "Gallery image"}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes={index === 0 
                        ? "(max-width: 768px) 100vw, 50vw" 
                        : "(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                      }
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2">
                        <ZoomIn className="h-5 w-5 text-white" />
                        {image.title && (
                          <span className="text-white text-sm font-medium truncate">
                            {image.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Gallery Folders */}
      {folders.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Photo Albums</h2>
                <p className="text-muted-foreground">Browse by category or event</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {folders.map((folder, index) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link href={`/gallery/${folder.slug}`}>
                    <div className="group relative overflow-hidden rounded-2xl bg-card border shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="aspect-[4/3] relative">
                        {folder.coverImage ? (
                          <Image
                            src={folder.coverImage.secureUrl}
                            alt={folder.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <FolderOpen className="h-16 w-16 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                          {folder.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-white/80">
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4" />
                            {folder.imageCount} photos
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(folder.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {folder.description && (
                          <p className="text-sm text-white/70 mt-2 line-clamp-2">
                            {folder.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Empty State */}
      {folders.length === 0 && featuredImages.length === 0 && (
        <section className="container mx-auto px-4 py-20">
          <div className="text-center">
            <ImageIcon className="h-20 w-20 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No photos yet</h2>
            <p className="text-muted-foreground">
              Check back soon for photos from our events and activities!
            </p>
          </div>
        </section>
      )}

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

                {featuredImages.length > 1 && (
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
                  <div className="flex justify-center mt-4 gap-1">
                    {featuredImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setImageIndex(i);
                          setSelectedImage(featuredImages[i]);
                        }}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          i === imageIndex ? "bg-white w-6" : "bg-white/40"
                        )}
                      />
                    ))}
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
