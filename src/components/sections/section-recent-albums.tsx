"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Camera } from "lucide-react";
import { AlbumFolder } from "@/components/folders-ui/project-folder/AlbumFolder";
import type { AlbumWithPreviews } from "@/components/gallery/AlbumGrid";

interface SectionRecentAlbumsProps {
  albums: AlbumWithPreviews[];
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export default function SectionRecentAlbums({ albums }: SectionRecentAlbumsProps) {
  if (albums.length === 0) return null;

  return (
    <section className="py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12"
        >
          <div>
            <Badge variant="outline" className="mb-3 gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              Photo Gallery
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
              Recent{" "}
              <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                Albums
              </span>
            </h2>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-relaxed">
              Relive the latest moments from our dojo — grading tests, events, and daily training.
            </p>
          </div>
          <Link href="/gallery" className="shrink-0">
            <Button variant="outline" className="gap-2">
              View All Albums
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        {/* Album Folders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {albums.map((album, i) => (
            <AlbumFolder
              key={album.id}
              album={album}
              index={i}
              href={`/gallery/${album.slug}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
