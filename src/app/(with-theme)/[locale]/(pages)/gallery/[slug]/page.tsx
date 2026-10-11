import { StructuredData } from "@/components/seo/StructuredData";
import { breadcrumbSchema, absoluteUrl, academyName } from "@/lib/seo/site";
import { pageMetadata, noIndex } from "@/lib/seo/site";
import { Metadata } from "next";
import { db } from "@/lib/connect-db";
import { galleryFolders, galleryImages } from "@/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AlbumDetailView } from "@/components/gallery/AlbumDetailView";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

// Force dynamic fetching so newly created albums or revalidated albums load instantly without 404s
export const dynamic = "force-dynamic";
export const dynamicParams = true;

// Pre-generate static params for both supported locales
export async function generateStaticParams() {
  try {
    const folders = await db
      .select({ slug: galleryFolders.slug })
      .from(galleryFolders)
      .where(eq(galleryFolders.isPublished, true));

    const locales = ["en", "bn", "ne"];
    return locales.flatMap((locale) =>
      folders.map((f) => ({ locale, slug: f.slug })),
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const [folder] = await db
    .select()
    .from(galleryFolders)
    .where(
      and(eq(galleryFolders.slug, slug), eq(galleryFolders.isPublished, true)),
    )
    .limit(1);
  if (!folder) return { title: "Album not found", robots: noIndex };
  const [cover] = await db
    .select({ url: galleryImages.secureUrl })
    .from(galleryImages)
    .where(
      and(
        eq(galleryImages.folderId, folder.id),
        eq(galleryImages.isPublished, true),
      ),
    )
    .orderBy(asc(galleryImages.displayOrder))
    .limit(1);
  return pageMetadata({
    path: `/${locale}/gallery/${encodeURIComponent(slug)}`,
    title: folder.name,
    description:
      folder.description ||
      `Photos from ${folder.name} at Kaizen Karate Academy.`,
    locale,
    image: cover?.url,
    localized: true,
  });
}

export default async function GalleryFolderPage({ params }: Props) {
  const { slug, locale } = await params;

  // Fetch the folder
  const folders = await db
    .select()
    .from(galleryFolders)
    .where(
      and(eq(galleryFolders.slug, slug), eq(galleryFolders.isPublished, true)),
    )
    .limit(1);

  if (folders.length === 0) {
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
    .where(
      and(
        eq(galleryFolders.parentId, folder.id),
        eq(galleryFolders.isPublished, true),
      ),
    )
    .orderBy(asc(galleryFolders.displayOrder));

  const publishedChildFolders = childFolders.filter(
    (f: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      createdAt: Date;
    }) => {
      const fullFolder = folders.find((ff) => ff.id === f.id);
      return !fullFolder || fullFolder.isPublished;
    },
  );

  return (
    <>
      <StructuredData
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            name: folder.name,
            description: folder.description || undefined,
            url: absoluteUrl(`/${locale}/gallery/${encodeURIComponent(slug)}`),
            image: publishedImages.slice(0, 10).map((image) => image.secureUrl),
          },
          breadcrumbSchema([
            { name: academyName, path: `/${locale}` },
            { name: "Gallery", path: `/${locale}/gallery` },
            {
              name: folder.name,
              path: `/${locale}/gallery/${encodeURIComponent(slug)}`,
            },
          ]),
        ]}
      />
      <Header />
      <main className="relative">
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
      </main>
      <Footer />
    </>
  );
}
