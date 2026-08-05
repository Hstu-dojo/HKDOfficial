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

// Image fan positions — mirrors the folders-ui aesthetic
const IMAGE_POSITIONS = [
  { x: -56, rotate: -12, scale: 0.88 },
  { x: -28, rotate: -6, scale: 0.95 },
  { x: 0, rotate: 0, scale: 1.05 },
  { x: 28, rotate: 6, scale: 0.95 },
  { x: 56, rotate: 12, scale: 0.88 },
];

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

  const displayImages = previewImages.slice(0, 5);
  const hasImages = displayImages.length > 0;

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: EASE_OUT_EXPO }}
      className={cn("w-full", className)}
    >
      <Link href={`/gallery/${slug}`} className="block group outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
        <div
          className="relative"
          style={{ perspective: "1200px" }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Back panel — image fan */}
          <motion.div
            className="relative z-0 rounded-2xl overflow-hidden"
            animate={{ rotateX: isHovered ? 12 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
            style={{
              height: "200px",
              background: "rgba(15, 15, 20, 0.95)",
              border: "1px solid rgba(255,255,255,0.07)",
              transformStyle: "preserve-3d",
              transformOrigin: "center bottom",
            }}
          >
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />

            {/* Fan of images */}
            <motion.div
              className="absolute inset-0"
              animate={{ rotateX: isHovered ? -12 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25, mass: 0.8 }}
              style={{ transformStyle: "flat", transformOrigin: "center bottom" }}
            >
              {hasImages ? (
                IMAGE_POSITIONS.map((pos, imgIndex) => {
                  const imageUrl = displayImages[imgIndex % displayImages.length]?.secureUrl;
                  if (!imageUrl) return null;

                  const centerIndex = 2;
                  const distanceFromCenter = Math.abs(imgIndex - centerIndex);
                  const zIndex = 10 - distanceFromCenter;
                  const brightness = distanceFromCenter === 0 ? 1 : distanceFromCenter === 1 ? 0.55 : 0.32;
                  const blur = distanceFromCenter === 0 ? 0 : distanceFromCenter === 1 ? 0.5 : 1.5;

                  const isCompact = !isHovered;
                  const xPos = isCompact ? pos.x * 0.65 : pos.x * 1.35;
                  const yPos = isCompact ? 22 : 10;
                  const rotation = isCompact ? pos.rotate * 0.7 : pos.rotate * 1.2;
                  const finalScale = isCompact ? pos.scale * 0.96 : pos.scale * 1.03;
                  const staggerDelay = distanceFromCenter * 0.055;

                  return (
                    <motion.div
                      key={imgIndex}
                      className="absolute left-1/2 top-0"
                      animate={{
                        x: `calc(-50% + ${xPos}px)`,
                        y: yPos,
                        rotate: rotation,
                        scale: finalScale,
                        opacity: 1,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 110,
                        damping: 18,
                        mass: 1,
                        delay: staggerDelay,
                        opacity: { duration: 0.4, ease: "easeOut" },
                      }}
                      style={{ zIndex }}
                    >
                      <div className="h-[148px] w-[96px] overflow-hidden rounded-lg shadow-2xl">
                        <motion.img
                          src={imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          animate={{
                            filter: `brightness(${isHovered ? Math.min(1, brightness + 0.2) : brightness}) contrast(1.06) blur(${isHovered ? 0 : blur}px)`,
                          }}
                          transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                        />
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                // Empty album placeholder
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2 opacity-20">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Front panel — glassmorphic footer */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-10 rounded-2xl overflow-hidden"
            animate={{
              rotateX: isHovered ? -22 : 0,
              backgroundColor: isHovered ? "rgba(22, 22, 28, 0.9)" : "rgba(18, 18, 22, 0.85)",
            }}
            transition={{
              rotateX: { type: "spring", stiffness: 180, damping: 22, mass: 0.8 },
              backgroundColor: { duration: 0.3, ease: EASE_OUT_EXPO },
            }}
            style={{
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.07)",
              transformStyle: "preserve-3d",
              transformOrigin: "center bottom",
            }}
          >
            {/* Album name */}
            <div className="py-3 px-4 min-h-[2.5rem]">
              <h3 className="font-semibold text-white/75 text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors duration-200">
                {name}
              </h3>
              {description && (
                <p className="text-xs text-white/40 mt-0.5 line-clamp-1">{description}</p>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-white/[0.05]" />

            {/* Footer stats */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-1.5 text-white/50">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="text-[12px]">{imageCount} photos</span>
              </div>
              <div className="flex items-center gap-1 text-white/40">
                <Calendar className="h-3 w-3" />
                <span className="text-[11px]">{formattedDate}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
}
