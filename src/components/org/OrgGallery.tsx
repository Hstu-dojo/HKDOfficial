"use client";
import { useEffect, useRef, useState } from "react";
import { OrgImage } from "./OrgImage";
export default function OrgGallery({
  images,
  orgName,
}: {
  images: string[];
  orgName: string;
}) {
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
  if (!images.length) return null;
  return (
    <section id="gallery" className="org-section org-container">
      <p className="org-kicker">Photo gallery</p>
      <h2 className="org-title">
        Life at <span className="italic text-primary">{orgName}</span>
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {images.map((src, i) => (
          <button
            type="button"
            key={`${src}-${i}`}
            aria-label={`Enlarge ${orgName} photo ${i + 1}`}
            onClick={(e) => {
              opener.current = e.currentTarget;
              setActive(i);
            }}
            className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <OrgImage
              src={src}
              alt={`${orgName} photo ${i + 1}`}
              sizes="(max-width:768px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 motion-safe:hover:scale-105"
            />
          </button>
        ))}
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
            <OrgImage
              key={images[active]}
              src={images[active]}
              alt={`${orgName} photo ${active + 1}`}
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </section>
  );
}
