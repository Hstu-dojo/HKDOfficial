"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface AlbumFolder {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

interface AlbumImage {
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

interface AlbumDetailViewProps {
  folder: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: string;
  };
  images: AlbumImage[];
  childFolders: AlbumFolder[];
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function AlbumDetailView({ folder, images, childFolders }: AlbumDetailViewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null;

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goNext = useCallback(() => {
    setSelectedIndex((prev) => (prev !== null ? (prev + 1) % images.length : 0));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setSelectedIndex((prev) =>
      prev !== null ? (prev - 1 + images.length) % images.length : 0
    );
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIndex, goNext, goPrev]);

  const formattedDate = new Date(folder.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/10">
      {/* Album Header */}
      <section className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-10">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          >
            <Link href="/gallery">
              <Button variant="ghost" size="sm" className="mb-5 -ml-2 gap-2">
                <ArrowLeft className="h-4 w-4" />
                All Albums
              </Button>
            </Link>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
              <div>
                <Badge variant="outline" className="mb-3 gap-1.5">
                  <FolderOpen className="h-3 w-3" />
                  Album
                </Badge>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
                  {folder.name}
                </h1>
                {folder.description && (
                  <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-relaxed">
                    {folder.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-5 text-sm text-muted-foreground shrink-0">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4" />
                  {images.length} photo{images.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formattedDate}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sub-albums */}
      {childFolders.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-lg font-semibold mb-4">Sub-albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {childFolders.map((child) => (
              <Link key={child.id} href={`/gallery/${child.slug}`}>
                <div className="group relative overflow-hidden rounded-xl bg-muted/50 border hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/40 group-hover:scale-110 group-hover:text-primary/60 transition-all duration-300" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{child.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Image Masonry Grid */}
      <section className="container mx-auto px-4 py-8 pb-24">
        {images.length > 0 ? (
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-3 space-y-3">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.025, 0.5), ease: EASE_OUT_EXPO }}
                className="break-inside-avoid group relative overflow-hidden rounded-xl cursor-zoom-in"
                onClick={() => openLightbox(index)}
              >
                <div className="relative">
                  <Image
                    src={image.secureUrl}
                    alt={image.altText || image.title || "Gallery photo"}
                    width={image.width || 600}
                    height={image.height || 400}
                    className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-white">
                      <ZoomIn className="h-4 w-4 shrink-0" />
                      {image.title && (
                        <span className="text-xs font-medium truncate">{image.title}</span>
                      )}
                    </div>
                  </div>

                  {/* Featured badge */}
                  {image.isFeatured && (
                    <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5" variant="default">
                      ★ Featured
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="rounded-full bg-muted/50 p-6 mb-6">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <h2 className="text-xl font-bold mb-2">No photos yet</h2>
            <p className="text-muted-foreground">This album is empty. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] p-0 bg-black/97 border-0 rounded-2xl overflow-hidden">
          <DialogTitle className="sr-only">
            {selectedImage?.title || "Gallery photo"}
          </DialogTitle>

          <AnimatePresence mode="wait">
            {selectedImage && (
              <motion.div
                key={selectedImage.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative flex items-center justify-center min-h-[60vh] w-full"
              >
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-50 text-white hover:bg-white/15 h-10 w-10"
                  onClick={closeLightbox}
                >
                  <X className="h-5 w-5" />
                </Button>

                {/* Counter */}
                {images.length > 1 && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                    <span className="text-white/60 text-sm bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
                      {(selectedIndex ?? 0) + 1} / {images.length}
                    </span>
                  </div>
                )}

                {/* Prev / Next */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/15 h-12 w-12"
                      onClick={(e) => { e.stopPropagation(); goPrev(); }}
                    >
                      <ChevronLeft className="h-7 w-7" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/15 h-12 w-12"
                      onClick={(e) => { e.stopPropagation(); goNext(); }}
                    >
                      <ChevronRight className="h-7 w-7" />
                    </Button>
                  </>
                )}

                {/* Image */}
                <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center py-16 px-16">
                  <Image
                    src={selectedImage.secureUrl}
                    alt={selectedImage.altText || selectedImage.title || "Gallery photo"}
                    width={selectedImage.width || 1400}
                    height={selectedImage.height || 900}
                    className="object-contain max-h-[80vh] w-auto max-w-full rounded-lg"
                    priority
                  />
                </div>

                {/* Footer info */}
                {(selectedImage.title || selectedImage.description) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-8 py-6">
                    <div className="flex items-end justify-between max-w-4xl mx-auto">
                      <div>
                        {selectedImage.title && (
                          <h3 className="text-white text-lg font-bold mb-1">{selectedImage.title}</h3>
                        )}
                        {selectedImage.description && (
                          <p className="text-white/70 text-sm max-w-xl">{selectedImage.description}</p>
                        )}
                      </div>
                      <a
                        href={selectedImage.secureUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:block ml-4"
                      >
                        <Button variant="secondary" size="sm" className="gap-2">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </a>
                    </div>

                    {/* Dot indicators for small albums */}
                    {images.length <= 24 && (
                      <div className="flex justify-center mt-4 gap-1.5 flex-wrap">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedIndex(i)}
                            className={cn(
                              "rounded-full transition-all duration-300",
                              i === selectedIndex
                                ? "w-5 h-1.5 bg-white"
                                : "w-1.5 h-1.5 bg-white/35 hover:bg-white/60"
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
