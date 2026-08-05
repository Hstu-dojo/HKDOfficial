"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ParallaxScrollSecond } from "@/components/ui/parallax-scroll";

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: folder.name,
        url: window.location.href,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pt-[4.5rem] lg:pt-[161px]">
      <div className="container mx-auto px-4 py-8">
        
        {/* Navigation & Header matching moments.tsx */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="mb-8"
        >
          <Link href="/gallery">
            <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              All Albums
            </Button>
          </Link>

          {/* Hero Banner styled like moments.tsx hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card/80 to-muted/40 border p-8 md:p-12 shadow-2xl">
            <div className="absolute inset-0 bg-grid-white/5 opacity-20 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <Badge variant="outline" className="mb-4 gap-1.5 bg-background/50 backdrop-blur-md">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Collection
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  {folder.name}
                </h1>
                {folder.description && (
                  <p className="text-muted-foreground mt-3 text-base md:text-lg leading-relaxed max-w-2xl">
                    {folder.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground shrink-0">
                <div className="flex items-center gap-2 bg-background/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">{images.length}</span> photos
                </div>
                <div className="flex items-center gap-2 bg-background/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{formattedDate}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleShare} className="rounded-full gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sub-albums if any */}
        {childFolders.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Sub-Albums
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {childFolders.map((child) => (
                <Link key={child.id} href={`/gallery/${child.slug}`}>
                  <div className="group relative overflow-hidden rounded-2xl bg-card border hover:border-primary/50 hover:shadow-xl transition-all duration-300 cursor-pointer p-4 flex flex-col items-center text-center">
                    <FolderOpen className="h-10 w-10 text-muted-foreground/40 group-hover:scale-110 group-hover:text-primary transition-all duration-300 mb-2" />
                    <p className="text-sm font-semibold truncate w-full group-hover:text-primary transition-colors">{child.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Parallax Scroll 2 Grid */}
        {images.length > 0 ? (
          <ParallaxScrollSecond
            items={images}
            renderItem={(image, index) => {
              const caption = image.description || image.title || image.altText || `${folder.name} - Photo ${index + 1}`;

              return (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-2xl border bg-muted/20 cursor-zoom-in transition-all duration-300 hover:shadow-2xl"
                  onClick={() => openLightbox(index)}
                >
                  <div className="relative w-full">
                    <Image
                      src={image.secureUrl}
                      alt={caption}
                      width={image.width || 720}
                      height={image.height || 480}
                      className="w-full h-auto transform rounded-2xl brightness-95 transition-all duration-500 will-change-auto group-hover:scale-[1.03] group-hover:brightness-110 object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
                    />

                    {/* Hover gradient overlay with caption */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                    
                    <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between text-white z-10">
                      <div className="pr-3 leading-snug">
                        <p className="text-sm font-semibold line-clamp-2">{caption}</p>
                      </div>
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-md shrink-0">
                        <ZoomIn className="h-4 w-4" />
                      </div>
                    </div>

                    {image.isFeatured && (
                      <Badge className="absolute top-3 left-3 bg-yellow-500 text-black border-0 shadow-md font-bold text-[11px] px-2 py-0.5" variant="default">
                        ★ Featured
                      </Badge>
                    )}
                  </div>
                </div>
              );
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed rounded-3xl bg-muted/10">
            <div className="rounded-full bg-muted p-6 mb-4">
              <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold mb-1">No photos in this album yet</h3>
            <p className="text-muted-foreground">Upload photos from the admin panel to populate this collection.</p>
          </div>
        )}
      </div>

      {/* True Full-Screen Lightbox Modal matching SharedModal / moments.tsx */}
      <AnimatePresence>
        {selectedIndex !== null && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-2xl select-none"
            onClick={closeLightbox}
          >
            {/* Top Toolbar */}
            <div className="relative z-50 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
                  onClick={closeLightbox}
                >
                  <X className="h-6 w-6" />
                </Button>
                <div>
                  <h3 className="text-white font-semibold text-sm truncate max-w-xs sm:max-w-md">
                    {selectedImage.description || selectedImage.title || selectedImage.altText || `${folder.name} - Photo ${selectedIndex + 1}`}
                  </h3>
                  <p className="text-white/50 text-xs">
                    {selectedIndex + 1} of {images.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedImage.secureUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button variant="outline" size="sm" className="rounded-full gap-2 border-white/20 text-white bg-white/10 hover:bg-white/20">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download</span>
                  </Button>
                </a>
              </div>
            </div>

            {/* Main Stage Image */}
            <div className="relative flex-1 flex items-center justify-center p-4 md:p-8 overflow-hidden">
              {/* Navigation Chevrons */}
              {images.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/60 p-3 text-white/80 backdrop-blur-md transition hover:bg-black/90 hover:text-white hover:scale-110 active:scale-95 border border-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                  >
                    <ChevronLeft className="h-7 w-7" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/60 p-3 text-white/80 backdrop-blur-md transition hover:bg-black/90 hover:text-white hover:scale-110 active:scale-95 border border-white/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                  >
                    <ChevronRight className="h-7 w-7" />
                  </button>
                </>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImage.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative max-w-full max-h-full flex items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={selectedImage.secureUrl}
                    alt={selectedImage.altText || selectedImage.title || folder.name}
                    className="max-h-[82vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Thumbnail Strip */}
            {images.length > 1 && (
              <div 
                className="relative z-50 py-4 px-6 bg-gradient-to-t from-black/90 to-transparent overflow-x-auto flex justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 max-w-full overflow-x-auto py-1 px-2 no-scrollbar">
                  {images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedIndex(i)}
                      className={cn(
                        "relative h-14 w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-300",
                        i === selectedIndex
                          ? "border-primary scale-110 shadow-lg shadow-primary/30 z-10"
                          : "border-transparent opacity-40 hover:opacity-80"
                      )}
                    >
                      <img
                        src={img.secureUrl}
                        alt="thumbnail"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
