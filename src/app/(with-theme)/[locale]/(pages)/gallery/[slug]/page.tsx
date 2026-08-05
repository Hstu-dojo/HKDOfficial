import { Metadata } from "next";
import { db } from "@/lib/connect-db";
import { galleryFolders, galleryImages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AlbumDetailView } from "@/components/gallery/AlbumDetailView";

interface Props {
  params: Promise<{ slug: string }>;
}

// Pre-generate static pages for all published albums at build time
export async function generateStaticParams() {
  const folders = await db
    .select({ slug: galleryFolders.slug })
    .from(galleryFolders)
    .where(eq(galleryFolders.isPublished, true));

  return folders.map((f) => ({ slug: f.slug }));
}

// ISR — revalidate every 30 seconds
export const revalidate = 30;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const folders = await db
    .select({ name: galleryFolders.name, description: galleryFolders.description })
    .from(galleryFolders)
    .where(eq(galleryFolders.slug, slug))
    .limit(1);

  if (folders.length === 0) {
    return { title: "Gallery | HKD" };
  }

  const folder = folders[0];
  return {
    title: `${folder.name} | Gallery | HKD`,
    description: folder.description || `View photos from ${folder.name}`,
    openGraph: {
      title: `${folder.name} | Gallery`,
      description: folder.description || `View photos from ${folder.name}`,
    },
  };
}

export default async function GalleryFolderPage({ params }: Props) {
  const { slug } = await params;

  // Fetch the folder
  const folders = await db
    .select()
    .from(galleryFolders)
    .where(eq(galleryFolders.slug, slug))
    .limit(1);

  if (folders.length === 0 || !folders[0].isPublished) {
    notFound();
  }

  const folder = folders[0];

  // Fetch published images in this folder
  const images = await db
    .select()
    .from(galleryImages)
    .where(eq(galleryImages.folderId, folder.id))
    .orderBy(asc(galleryImages.displayOrder));

  const publishedImages = images.filter((img) => img.isPublished);

  // Fetch sub-folders
  const childFolders = await db
    .select({
      id: galleryFolders.id,
      name: galleryFolders.name,
      slug: galleryFolders.slug,
      description: galleryFolders.description,
      createdAt: galleryFolders.createdAt,
    })
    .from(galleryFolders)
    .where(eq(galleryFolders.parentId, folder.id))
    .orderBy(asc(galleryFolders.displayOrder));

  const publishedChildFolders = childFolders.filter(
    (f: { id: string; name: string; slug: string; description: string | null; createdAt: Date }) => {
      const fullFolder = folders.find((ff) => ff.id === f.id);
      return !fullFolder || fullFolder.isPublished;
    }
  );

  return (
    <AlbumDetailView
      folder={{
        id: folder.id,
        name: folder.name,
        slug: folder.slug,
        description: folder.description,
        createdAt: folder.createdAt.toISOString(),
      }}
      images={publishedImages.map((img) => ({
        id: img.id,
        secureUrl: img.secureUrl,
        title: img.title,
        description: img.description,
        altText: img.altText,
        width: img.width,
        height: img.height,
        isFeatured: img.isFeatured,
        createdAt: img.createdAt.toISOString(),
      }))}
      childFolders={childFolders.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        description: f.description,
        createdAt: f.createdAt.toISOString(),
      }))}
    />
  );
}
