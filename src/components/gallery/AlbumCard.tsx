"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ImageIcon, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlbumCardImage {
  secureUrl: string;
}

interface AlbumCardProps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageCount: number;
  createdAt: string;
  previewImages: AlbumCardImage[];
  className?: string;
  index?: number;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function AlbumCard({
  name,
  slug,
  description,
  imageCount,
  createdAt,
  previewImages,
  className,
  index = 0,
}: AlbumCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // We only need the first image for the cover
  const coverImage = previewImages[0]?.secureUrl;

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: EASE_OUT_EXPO }}
      className={cn("w-full h-[280px]", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/gallery/${slug}`} className="block h-full w-full group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
        <div className="relative h-full w-full rounded-2xl overflow-hidden bg-muted/30 border border-border/50 shadow-sm transition-shadow duration-300 group-hover:shadow-lg">
          
          {/* Background Cover Image */}
          {coverImage ? (
            <motion.div
              className="absolute inset-0 z-0"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
            >
              <img
                src={coverImage}
                alt={name}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ) : (
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-muted/40">
              <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Gradients for text legibility */}
          {/* Bottom gradient (always visible, stronger on hover) */}
          <motion.div 
            className="absolute inset-x-0 bottom-0 z-10 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            animate={{ opacity: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Full overlay on hover for a cleaner look */}
          <motion.div 
            className="absolute inset-0 z-10 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Content (Glassmorphic positioning) */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-5">
            <motion.div
              initial={false}
              animate={{ y: isHovered ? -5 : 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
            >
              <h3 className="font-semibold text-white text-xl leading-tight line-clamp-1 mb-1">
                {name}
              </h3>
              
              {/* Description (fades in slightly more on hover) */}
              {description && (
                <motion.p 
                  className="text-sm text-white/70 line-clamp-2 mb-3"
                  animate={{ opacity: isHovered ? 1 : 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  {description}
                </motion.p>
              )}

              {/* Stats Footer */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20">
                <div className="flex items-center gap-1.5 text-white/80">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">{imageCount} photos</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/80">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">{formattedDate}</span>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </Link>
    </motion.div>
  );
}
