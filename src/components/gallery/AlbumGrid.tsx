"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, Camera, ArrowDown } from "lucide-react";
import { AlbumFolder } from "../folders-ui/project-folder/AlbumFolder";
import { useRef } from "react";
import { useI18n } from "@/locales/client";

export interface AlbumWithPreviews {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageCount: number;
  createdAt: string;
  previewImages: { secureUrl: string }[];
}

interface AlbumGridProps {
  albums: AlbumWithPreviews[];
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  const t = useI18n() as any;
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Use the most recent album's first image as the hero background, or fallback
  const heroImage = albums[0]?.previewImages[0]?.secureUrl || "/image/kata.JPG";

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative flex min-h-[55vh] w-full items-center justify-center overflow-hidden pb-12 pt-28 md:min-h-[520px] md:pb-16 md:pt-32">
        {/* Parallax Background Image */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y, opacity }}
        >
          <img 
            src={heroImage} 
            alt={t("galleryPage.photoGallery")} 
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </motion.div>

        {/* Hero Content */}
        <div className="container relative z-10 mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="mb-6 gap-2 px-4 py-1.5 text-sm bg-background/50 backdrop-blur-md border-primary/30 text-primary">
              <Camera className="h-4 w-4" />
              {t("galleryPage.photoGallery")}
            </Badge>

            <h1 className="text-4xl md:text-6xl font-normal tracking-tight mb-6 leading-tight text-foreground">
              {t("galleryPage.heroTitle")}{" "}
              <span className="text-primary italic">
                {t("galleryPage.heroAccent")}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
              {t("galleryPage.heroDescription")}
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="flex justify-center"
            >
              <div className=" p-3 rounded-full bg-muted/30 backdrop-blur-sm border border-border/50 text-muted-foreground">
                <ArrowDown className="h-5 w-5" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Albums Grid Section */}
      <section className="container mx-auto px-4 py-24 relative isolate z-10 bg-background">
        {albums.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="flex items-end justify-between mb-12 border-b pb-4"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{t("galleryPage.allCollections")}</h2>
                <p className="text-muted-foreground mt-2">
                  {t(albums.length === 1 ? "galleryPage.albumCountOne" : "galleryPage.albumCountMany", { count: albums.length })}
                </p>
              </div>
            </motion.div>

            {/* Responsive grid with full spacing for 3D folder fan-out */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10 items-start py-8 w-full">
              {albums.map((album, i) => (
                <AlbumFolder
                  key={album.id}
                  album={album}
                  index={i}
                  href={`/gallery/${album.slug}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-muted/10 rounded-3xl border border-dashed border-border/50">
            <div className="rounded-full bg-background p-6 mb-6 shadow-sm">
              <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("galleryPage.noAlbums")}</h2>
            <p className="text-muted-foreground max-w-sm">
              {t("galleryPage.noAlbumsDescription")}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
