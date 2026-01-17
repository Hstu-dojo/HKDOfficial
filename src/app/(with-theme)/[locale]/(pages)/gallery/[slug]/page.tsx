import { Metadata } from "next";
import { PublicGalleryFolder } from "@/components/gallery/PublicGalleryFolder";
import { db } from "@/lib/connect-db";
import { galleryFolders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

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

export const dynamic = "force-dynamic";

export default async function GalleryFolderPage({ params }: Props) {
  const { slug } = await params;
  
  const folders = await db
    .select({
      id: galleryFolders.id,
      name: galleryFolders.name,
      slug: galleryFolders.slug,
      description: galleryFolders.description,
      parentId: galleryFolders.parentId,
      isPublished: galleryFolders.isPublished,
      createdAt: galleryFolders.createdAt,
    })
    .from(galleryFolders)
    .where(eq(galleryFolders.slug, slug))
    .limit(1);

  if (folders.length === 0 || !folders[0].isPublished) {
    notFound();
  }

  const folder = folders[0];
  
  // Serialize dates for client component
  const serializedFolder = {
    ...folder,
    createdAt: folder.createdAt.toISOString(),
  };

  return <PublicGalleryFolder folder={serializedFolder} />;
}
