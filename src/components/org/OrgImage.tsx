"use client";
import Image from "next/image";
import { publicImageSource } from "@/lib/org/settings";
import { useState } from "react";
type OrgImageProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function OrgImage(props: OrgImageProps) {
  const source = publicImageSource(props.src);
  return <ImageWithFallback key={source} {...props} src={source} />;
}

function ImageWithFallback({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
}: OrgImageProps) {
  const [attempt, setAttempt] = useState<"optimized" | "original" | "failed">(
    "optimized",
  );
  if (attempt === "failed")
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
      key={attempt}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={attempt === "original" ? "eager" : undefined}
      quality={60}
      unoptimized={attempt === "original"}
      className={className}
      onError={() =>
        setAttempt(attempt === "optimized" ? "original" : "failed")
      }
    />
  );
}
