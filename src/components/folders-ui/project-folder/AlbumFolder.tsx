"use client";

import Link from "next/link";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import type { AlbumWithPreviews } from "../../gallery/AlbumGrid";
import { useCurrentLocale, useI18n } from "@/locales/client";

export interface ImagePosition {
  x: number;
  y: number;
  rotate: number;
}
export interface AlbumFolderProps {
  album: AlbumWithPreviews;
  index: number;
  href?: string;
  onClick?: () => void;
  isAdmin?: boolean;
}

/** A photographic editorial cover with the same album destinations and callbacks. */
export function AlbumFolder({ album, href, onClick, isAdmin = false }: AlbumFolderProps) {
  const locale = useCurrentLocale();
  const t = useI18n() as any;
  const cover = album.previewImages?.[0]?.secureUrl;
  const formattedDate = new Date(album.createdAt).toLocaleDateString(
    locale === "bn" ? "bn-BD" : locale === "ne" ? "ne-NP" : "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );
  const content = (
    <>
      <div className={`relative aspect-[4/3] overflow-hidden bg-muted ${isAdmin ? "" : "rounded-xl"}`}>
        {cover ? (
          <img
            src={cover}
            alt={album.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          </div>
        )}
        {!isAdmin && <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/95 text-foreground">
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>}
      </div>
      <div className={isAdmin ? "p-4" : "px-1 pb-2 pt-5"}>
        <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>{album.imageCount} {t("galleryPage.photoCount")}</span>
          <span>{formattedDate}</span>
        </div>
        <h3 className="mb-2 line-clamp-2 text-2xl leading-tight text-foreground">
          {album.name}
        </h3>
        {album.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {album.description}
          </p>
        )}
      </div>
    </>
  );
  const className = `editorial-image group block w-full min-w-0 text-left ${isAdmin ? "h-full overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring" : ""}`;
  if (onClick)
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  if (href)
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  return <div className={className}>{content}</div>;
}
