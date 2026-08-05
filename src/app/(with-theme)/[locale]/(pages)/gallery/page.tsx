import { Metadata } from "next";
import { db } from "@/lib/connect-db";
import { galleryFolders, galleryImages } from "@/db/schema";
import { eq, asc, isNull, desc, count } from "drizzle-orm";
import { AlbumGrid, AlbumWithPreviews } from "@/components/gallery/AlbumGrid";

export const metadata: Metadata = {
  title: "Gallery | HKD",
  description: "Explore our collection of photos from events, tournaments, and training sessions.",
  openGraph: {
    title: "Gallery | HKD",
    description: "Explore our collection of photos from events, tournaments, and training sessions.",
  },
};

// ISR — revalidate every 30 seconds, allowing admin changes to appear quickly
export const revalidate = 30;

async function getPublishedAlbums(): Promise<AlbumWithPreviews[]> {
  const folders = await db
    .select({
      id: galleryFolders.id,
      name: galleryFolders.name,
      slug: galleryFolders.slug,
      description: galleryFolders.description,
      displayOrder: galleryFolders.displayOrder,
      createdAt: galleryFolders.createdAt,
    })
    .from(galleryFolders)
    .where(eq(galleryFolders.isPublished, true))
    .orderBy(asc(galleryFolders.displayOrder), desc(galleryFolders.createdAt));

  // Fetch image counts + preview images for each folder in parallel
  const albumsWithData = await Promise.all(
    folders.map(async (folder) => {
      const [imageCountResult, previewImagesResult] = await Promise.all([
        db
          .select({ count: count() })
          .from(galleryImages)
          .where(eq(galleryImages.folderId, folder.id)),
        db
          .select({ secureUrl: galleryImages.secureUrl })
          .from(galleryImages)
          .where(eq(galleryImages.folderId, folder.id))
          .orderBy(asc(galleryImages.displayOrder))
          .limit(5),
      ]);

      return {
        id: folder.id,
        name: folder.name,
        slug: folder.slug,
        description: folder.description,
        imageCount: Number(imageCountResult[0]?.count ?? 0),
        createdAt: folder.createdAt.toISOString(),
        previewImages: previewImagesResult,
      };
    })
  );

  return albumsWithData;
}

export default async function GalleryPage() {
  const albums = await getPublishedAlbums();
  return <AlbumGrid albums={albums} />;
}
