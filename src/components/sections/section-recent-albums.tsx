"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { AlbumFolder } from "@/components/folders-ui/project-folder/AlbumFolder";
import type { AlbumWithPreviews } from "@/components/gallery/AlbumGrid";
import { SectionHeader } from "./section-header";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";

interface SectionRecentAlbumsProps {
  albums: AlbumWithPreviews[];
}

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export default function SectionRecentAlbums({ albums }: SectionRecentAlbumsProps) {
  const locale = useCurrentLocale();
  const t = useScopedI18n("homepage.recentAlbums");

  return (
    <section className="relative isolate py-20 md:py-28 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
          <SectionHeader
            kicker={t("kicker")}
            title={t("titlePrefix")}
            titleAccent={t("titleAccent")}
            description={t("description")}
            align="left"
            className="mb-0 md:mb-0"
          />
          <Link href={`/${locale}/gallery`} className="shrink-0 mb-2">
            <Button variant="outline" className="gap-2 rounded-full px-6">
              {t("viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Album Folders */}
        {albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {albums.map((album, i) => (
              <AlbumFolder
                key={album.id}
                album={album}
                index={i}
                href={`/${locale}/gallery/${album.slug}`}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <h3 className="text-xl font-medium">{t("emptyTitle")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t("emptyDescription")}</p>
          </div>
        )}
      </div>
    </section>
  );
}
