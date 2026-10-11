import type { ImageLoaderProps } from "next/image";

/** Sanity already optimizes images; avoid a second, metered Vercel transformation. */
export function sanityImageLoader({ src, width, quality }: ImageLoaderProps) {
  if (!src.startsWith("https://cdn.sanity.io/")) return src;
  const url = new URL(src);

  const sourceWidth = Number(url.searchParams.get("w"));
  const sourceHeight = Number(url.searchParams.get("h"));
  // Keep the editorial crop, and don't enlarge small avatars or bounded covers.
  const targetWidth = sourceWidth > 0 ? Math.min(width, sourceWidth) : width;
  url.searchParams.set("w", String(targetWidth));
  if (sourceWidth > 0 && sourceHeight > 0)
    url.searchParams.set(
      "h",
      String(
        Math.max(1, Math.round((sourceHeight * targetWidth) / sourceWidth)),
      ),
    );
  url.searchParams.set("auto", "format");
  url.searchParams.set("q", String(quality ?? 75));
  return url.toString();
}
