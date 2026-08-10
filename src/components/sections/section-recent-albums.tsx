"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { AlbumFolder } from "@/components/folders-ui/project-folder/AlbumFolder";
import type { AlbumWithPreviews } from "@/components/gallery/AlbumGrid";
import { SectionHeader } from "./section-header";

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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <SectionHeader
            kicker="Photo Gallery"
            title="Recent"
            titleAccent="Albums"
            description="Relive the latest moments from our dojo — grading tests, events, and daily training."
            align="left"
            className="mb-0 md:mb-0"
          />
          <Link href="/gallery" className="shrink-0 mb-2">
            <Button variant="outline" className="gap-2 rounded-full px-6">
              View All Albums
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

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
