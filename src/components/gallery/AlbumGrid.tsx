"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, Camera } from "lucide-react";
import { AlbumCard } from "./AlbumCard";

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
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Decorative background orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-2xl mx-auto"
          >
            <Badge variant="outline" className="mb-5 gap-1.5 px-4 py-1.5 text-sm">
              <Camera className="h-3.5 w-3.5" />
              Photo Gallery
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-5 leading-none">
              Our{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
                Moments
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Browse through albums of tournaments, belt ceremonies, training sessions, and
              unforgettable dojo memories.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Albums Grid */}
      <section className="container mx-auto px-4 pb-24">
        {albums.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-between mb-10"
            >
              <div>
                <h2 className="text-2xl font-bold">Albums</h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {albums.length} {albums.length === 1 ? "album" : "albums"}
                </p>
              </div>
            </motion.div>

            {/* Responsive grid — folders-ui style fixed-width cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
              {albums.map((album, i) => (
                <AlbumCard
                  key={album.id}
                  {...album}
                  index={i}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="rounded-full bg-muted/50 p-6 mb-6">
              <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No albums yet</h2>
            <p className="text-muted-foreground max-w-sm">
              Check back soon — our dojo moments will appear here as they are published.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
