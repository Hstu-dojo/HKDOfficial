"use client";
import Image from "next/image";
import { publicImageSource } from "@/lib/org/settings";
import { useState } from "react";
export function OrgImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex items-center justify-center bg-muted p-6 text-center text-sm text-muted-foreground"
      >
        {alt}
      </div>
    );
  return (
    <Image
      src={publicImageSource(src)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={60}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
