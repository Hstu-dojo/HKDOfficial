"use client";

import PublicPageHeading from "@/components/public/page-heading";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import { AlbumFolder } from "../folders-ui/project-folder/AlbumFolder";
import { useI18n } from "@/locales/client";

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
  const t = useI18n() as any;
  // Use the most recent album's first image as the hero background, or fallback
  const heroImage = albums[0]?.previewImages[0]?.secureUrl || "/image/kata.JPG";

  return (
    <div className="min-h-screen bg-background">
      <section className="public-page-masthead">
        <div className="public-page-container">
          <PublicPageHeading
            kicker={t("galleryPage.photoGallery")}
            title={t("galleryPage.heroTitle")}
            accent={t("galleryPage.heroAccent")}
            description={t("galleryPage.heroDescription")}
          />
          <div className="relative mb-10 h-48 overflow-hidden rounded-2xl border sm:h-64">
            <img
              src={heroImage}
              alt={t("galleryPage.photoGallery")}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Albums Grid Section */}
      <section className="public-page-container public-page-content relative isolate z-10 bg-background pt-10 md:pt-14">
        {albums.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
              className="mb-12 flex items-end justify-between border-b pb-4"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  {t("galleryPage.allCollections")}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t(
                    albums.length === 1
                      ? "galleryPage.albumCountOne"
                      : "galleryPage.albumCountMany",
                    { count: albums.length },
                  )}
                </p>
              </div>
            </motion.div>

            {/* Responsive grid with full spacing for 3D folder fan-out */}
            <div className="grid w-full grid-cols-1 items-start gap-x-5 gap-y-10 py-8 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {albums.map((album, i) => (
                <AlbumFolder
                  key={album.id}
                  album={album}
                  index={i}
                  href={`/gallery/${album.slug}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/50 bg-muted/10 py-32 text-center">
            <div className="mb-6 rounded-full bg-background p-6 shadow-sm">
              <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">
              {t("galleryPage.noAlbums")}
            </h2>
            <p className="max-w-sm text-muted-foreground">
              {t("galleryPage.noAlbumsDescription")}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
