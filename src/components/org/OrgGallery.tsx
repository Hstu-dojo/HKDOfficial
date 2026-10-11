"use client";

import { useEffect, useRef, useState } from "react";
import { OrgImage as Image } from "./OrgImage";

interface OrgGalleryProps {
  images: string[];
  orgName: string;
}

const fallbackLabels = ["STRENGTH", "ENDURANCE", "GRIT", "POWER"];

export default function OrgGallery({ images, orgName }: OrgGalleryProps) {
  const [active, setActive] = useState<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null),
    opener = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (active === null) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "Tab") {
        e.preventDefault();
        closeButton.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", key);
      opener.current?.focus();
    };
  }, [active]);

  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const displayImages = images;

  if (displayImages.length === 0) return null;

  return (
    <section
      id="gallery"
      ref={sectionRef}
      className="relative overflow-hidden bg-background"
    >
      {/* Top accent line */}
      <div
        className="absolute left-0 top-0 h-[2px] bg-primary transition-all"
        style={{
          width: isVisible ? "100%" : "0%",
          transitionDuration: "1200ms",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* Section label */}
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-3 pt-6 md:px-8 md:pb-8 md:pt-16 lg:px-12">
        <div
          className="flex items-center justify-between transition-all duration-700"
          style={{
            opacity: 1,
            transform: isVisible ? "translateX(0)" : "translateX(0)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="flex items-center gap-2 md:gap-4">
            <div className="h-[2px] w-5 bg-primary md:w-8" />
            <span className="font-body text-[8px] uppercase tracking-[0.2em] text-primary md:text-[10px] md:tracking-[0.4em]">
              The Work Speaks
            </span>
          </div>
          <span className="hidden font-body text-[7px] tracking-[0.15em] text-muted-foreground md:block md:text-[10px]">
            {String(displayImages.length).padStart(3, "0")} FRAMES
          </span>
        </div>
      </div>

      {/* Image Grid */}
      <div className="mx-auto w-full max-w-[1400px] px-4 pb-6 md:px-8 md:pb-20 lg:px-12">
        {/* Desktop: 4-column staggered */}
        <div
          className={`hidden gap-3 md:grid ${
            displayImages.length >= 4
              ? "grid-cols-4"
              : displayImages.length === 3
                ? "grid-cols-3"
                : "grid-cols-2"
          }`}
        >
          {displayImages.map((src, i) => {
            const offsets = [0, 48, 16, 64];
            const aspects = [
              "aspect-[3/4]",
              "aspect-[4/5]",
              "aspect-[3/4]",
              "aspect-[4/5]",
            ];
            return (
              <button
                type="button"
                aria-label={`Enlarge ${orgName} photo ${i + 1}`}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setActive(i);
                }}
                key={`${src}-${i}`}
                className="group relative self-start text-left"
                style={{ marginTop: `${offsets[i % 4]}px` }}
              >
                <div
                  className="transition-all"
                  style={{
                    opacity: 1,
                    transform: isVisible
                      ? "translateY(0) skewY(0deg)"
                      : "translateY(0) skewY(0deg)",
                    transitionDelay: `${i * 150}ms`,
                    transitionDuration: "800ms",
                    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <div className={`relative overflow-hidden ${aspects[i % 4]}`}>
                    <Image
                      src={src || "/placeholder.svg"}
                      alt={`${orgName} gallery image ${i + 1}`}
                      sizes="(max-width:768px) 50vw, 25vw"
                      className="object-cover grayscale transition-all duration-700 group-hover:scale-[1.025] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-background/30 transition-colors duration-500 group-hover:bg-background/0" />
                    <div
                      className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100"
                      style={{
                        transitionTimingFunction:
                          "cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                    <div className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-primary/0 transition-colors duration-300 group-hover:border-primary" />
                    <div className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-primary/0 transition-colors duration-300 group-hover:border-primary" />
                    <span className="absolute right-3 top-3 font-body text-[10px] tracking-widest text-foreground/30 transition-colors duration-300 group-hover:text-primary">
                      0{i + 1}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-display text-2xl tracking-tight text-foreground/70 transition-colors duration-300 group-hover:text-foreground lg:text-3xl">
                      {fallbackLabels[i % fallbackLabels.length]}
                    </span>
                    <div className="flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="h-[1px] w-4 bg-primary" />
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className="text-primary"
                        aria-hidden="true"
                      >
                        <path
                          d="M1 11L11 1M11 1H3M11 1V9"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile: 2-column tight, equal height, no stagger offset */}
        <div className="grid grid-cols-2 gap-1.5 md:hidden">
          {displayImages.map((src, i) => (
            <button
              type="button"
              aria-label={`Enlarge ${orgName} photo ${i + 1}`}
              onClick={(event) => {
                opener.current = event.currentTarget;
                setActive(i);
              }}
              key={`mobile-${src}-${i}`}
              className="relative text-left"
            >
              <div
                className="transition-all"
                style={{
                  opacity: 1,
                  transform: isVisible ? "translateY(0)" : "translateY(0)",
                  transitionDelay: `${i * 80}ms`,
                  transitionDuration: "600ms",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image
                    src={src || "/placeholder.svg"}
                    alt={`${orgName} gallery image ${i + 1}`}
                    sizes="(max-width:768px) 50vw, 25vw"
                    className="object-cover grayscale"
                  />
                  <div className="absolute inset-0 bg-background/15" />
                  <div className="absolute bottom-0 left-0 h-[2px] w-full bg-primary" />
                  <span className="absolute right-1.5 top-1.5 font-body text-[7px] tracking-widest text-foreground/40">
                    0{i + 1}
                  </span>
                </div>
                <span className="mt-1.5 block font-display text-sm tracking-tight text-foreground/70">
                  {fallbackLabels[i % fallbackLabels.length]}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${orgName} photo ${active + 1}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-5"
          onClick={() => setActive(null)}
        >
          <button
            ref={closeButton}
            type="button"
            aria-label="Close photo"
            onClick={() => setActive(null)}
            className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-black"
          >
            ×
          </button>
          <div
            className="relative h-[80svh] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={images[active]}
              src={images[active]}
              alt={`${orgName} photo ${active + 1}`}
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
      {/* Bottom divider */}
      <div className="h-[1px] bg-border" />
    </section>
  );
}
