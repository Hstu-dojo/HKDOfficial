"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AlbumWithPreviews } from "../../gallery/AlbumGrid";
export interface ImagePosition {
  x: number;
  y: number;
  rotate: number;
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;
const TRANSITION_DURATION = 0.3;
const TRANSITION_EASE = EASE_OUT_EXPO;

export interface AlbumFolderProps {
  album: AlbumWithPreviews;
  index: number;
  href?: string; // Optional: If provided, folder clicks route here
  onClick?: () => void; // Optional click handler
  isAdmin?: boolean;
}

export function AlbumFolder({ album, index, href, onClick, isAdmin }: AlbumFolderProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  
  const isDark = resolvedTheme === "dark";

  // Pre-calculate randomized positions for the 5 preview images so they look slightly scattered
  const imagePositions = useRef<ImagePosition[]>(
    [...Array(5)].map(() => ({
      x: Math.random() * 20 - 10,
      y: Math.random() * 10 - 5,
      rotate: Math.random() * 12 - 6,
    }))
  ).current;

  // Format date nicely
  const formattedDate = new Date(album.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isActive = isHovered;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  return (
    <motion.div
      className="group relative w-full max-w-[288px] mx-auto cursor-pointer"
      style={{
        perspective: "1200px",
        zIndex: isActive ? 50 : 1,
        transformStyle: "preserve-3d",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div
        className="relative w-full aspect-[288/224]"
        style={{ perspective: "1200px" }}
      >
        {/* Back panel */}
        <motion.div
          className="absolute inset-0 z-0 rounded-2xl"
          animate={{
            rotateX: isActive ? 15 : 0,
            backgroundColor: isDark ? "#1e1e1e" : "#f1f5f9",
          }}
          transition={{
            rotateX: {
              type: "spring",
              stiffness: 200,
              damping: 25,
              mass: 0.8,
            },
            backgroundColor: {
              duration: TRANSITION_DURATION,
              ease: TRANSITION_EASE,
            },
          }}
          style={{
            border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.05)",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
          }}
        >
          {/* Images */}
          <motion.div
            className="absolute inset-0"
            animate={{
              rotateX: isActive ? -15 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 25,
              mass: 0.8,
            }}
            style={{
              transformStyle: "flat",
              transformOrigin: "center bottom",
            }}
          >
            {[...Array(5)].map((_, imgIndex) => {
              const pos = imagePositions[imgIndex];
              const imageUrl = album.previewImages?.[imgIndex % Math.max(1, album.previewImages.length)]?.secureUrl || "/placeholder.svg";
              
              const centerIndex = 2;
              const distanceFromCenter = Math.abs(imgIndex - centerIndex);
              const zIndex = 10 - distanceFromCenter;

              const brightness = distanceFromCenter === 0 ? 1 : distanceFromCenter === 1 ? 0.55 : 0.3;
              const blurAmount = distanceFromCenter === 0 ? 0 : distanceFromCenter === 1 ? 0.5 : 1.5;
              const yOffset = -16 * (1 - distanceFromCenter / centerIndex) || 0;
              const scale = distanceFromCenter === 0 ? 1.05 : distanceFromCenter === 1 ? 0.95 : 0.88;

              const xPos = isActive ? pos.x * 1.4 : pos.x;
              const yPos = isActive ? -8 + yOffset : 8 + yOffset;
              const rotation = isActive ? pos.rotate * 1.3 : pos.rotate;
              const finalScale = isActive ? scale * 1.02 : scale;

              const staggerDelay = distanceFromCenter * 0.08;

              // Hide images completely if album is empty to avoid rendering missing images
              if (album.imageCount === 0) return null;

              return (
                <motion.div
                  key={imgIndex}
                  className="absolute left-1/2 top-0"
                  initial={false}
                  animate={{
                    x: `calc(-50% + ${xPos}px)`,
                    y: yPos,
                    rotate: rotation,
                    scale: finalScale,
                    opacity: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 100,
                    damping: 16,
                    mass: 1,
                    delay: staggerDelay,
                  }}
                  style={{ zIndex }}
                >
                  <div className="h-[160px] w-[100px] overflow-hidden rounded-lg shadow-lg border border-white/10 bg-muted">
                    <motion.img
                      src={imageUrl}
                      alt={`Preview ${imgIndex + 1}`}
                      className="h-full w-full object-cover"
                      animate={{
                        filter: `brightness(${isActive ? Math.min(1, brightness + 0.2) : brightness}) contrast(1.08) saturate(${1 - distanceFromCenter * 0.2}) blur(${isActive ? 0 : blurAmount}px)`,
                      }}
                      transition={{
                        duration: TRANSITION_DURATION,
                        ease: TRANSITION_EASE,
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Front panel */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 z-10 rounded-2xl overflow-hidden"
          animate={{
            rotateX: isActive ? -25 : 0,
            backgroundColor: isDark ? "rgba(26, 26, 26, 0.8)" : "rgba(255, 255, 255, 0.85)",
          }}
          transition={{
            rotateX: {
              type: "spring",
              stiffness: 180,
              damping: 22,
              mass: 0.8,
            },
            backgroundColor: {
              duration: TRANSITION_DURATION,
              ease: TRANSITION_EASE,
            },
          }}
          style={{
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.05)",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
          }}
        >
          <div className="relative py-4 px-4 min-h-[2.75rem]">
            <h3
              className={`font-semibold text-base leading-snug line-clamp-2 relative z-0 transition-all duration-200 ${isDark ? "text-white/80 group-hover:text-white" : "text-black/80 group-hover:text-black"}`}
            >
              {album.name}
            </h3>
          </div>
          <div className="relative h-[48px]">
            {/* Top border */}
            <div className={`absolute inset-x-0 top-0 h-[1px] ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]'}`} />
            
            <motion.div
              className="absolute inset-0 flex items-center justify-between px-2 pl-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 18,
                mass: 1,
                opacity: { duration: 0.35, ease: "easeOut" },
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-medium ${isDark ? 'text-white' : 'text-black'}`}>{album.imageCount}</span>
                <span className={`text-[13px] ${isDark ? 'text-white/60' : 'text-black/60'}`}>photos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{formattedDate}</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
