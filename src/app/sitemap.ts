import { MetadataRoute } from "next";
import { db } from "@/lib/connect-db";
import { courses } from "@/db/schemas/karate/courses";
import { programs } from "@/db/schemas/karate/programs";
import { partners } from "@/db/schemas/partner/index";
import { galleryFolders, galleryImages } from "@/db/schemas/content/index";
import { loadAllProject } from "../../sanity/loader/loadQuery";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = process.env.SITE_URL || "https://www.hstuma.com";
  const locales = ["en", "bn", "ne"];
  
  const entries: MetadataRoute.Sitemap = [];

  // 1. Static Basic Routes
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/pricing",
    "/services",
    "/gallery",
    "/cert-verify",
    "/karate/courses",
    "/karate/programs",
    "/org"
  ];

  for (const route of staticRoutes) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1 : 0.8,
      });
    }
  }

  try {
    // 2. Dynamic Courses
    const courseList = await db.query.courses.findMany({
      columns: { id: true, isActive: true },
      where: eq(courses.isActive, true),
    });

    courseList.forEach((course) => {
      for (const locale of locales) {
        entries.push({
          url: `${BASE_URL}/${locale}/karate/courses/${course.id}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.9,
        });
      }
    });

    // 3. Dynamic Programs
    const programList = await db.query.programs.findMany({
      columns: { slug: true, isActive: true },
      where: eq(programs.isActive, true),
    });

    programList.forEach((program) => {
      if (program.slug) {
        for (const locale of locales) {
          entries.push({
            url: `${BASE_URL}/${locale}/karate/programs/${program.slug}`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
          });
        }
      }
    });

    // 4. Dynamic Partners
    const partnerList = await db.query.partners.findMany({
      columns: { slug: true, isActive: true },
      where: eq(partners.isActive, true),
    });

    partnerList.forEach((partner) => {
      if (partner.slug) {
        for (const locale of locales) {
          entries.push({
            url: `${BASE_URL}/${locale}/org/${partner.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    });

    // 5. Dynamic Gallery Albums / Detail Pages
    const albumList = await db.query.galleryFolders.findMany({
      columns: { slug: true, isPublished: true, updatedAt: true, createdAt: true },
      where: eq(galleryFolders.isPublished, true),
    });

    albumList.forEach((album) => {
      if (album.slug) {
        for (const locale of locales) {
          entries.push({
            url: `${BASE_URL}/${locale}/gallery/${album.slug}`,
            lastModified: album.updatedAt ? new Date(album.updatedAt) : new Date(album.createdAt),
            changeFrequency: "weekly",
            priority: 0.8,
          });
        }
      }
    });

    // 6. Dynamic Gallery Photo Lightbox Pages (/p/[photoId])
    const photoList = await db
      .select({
        id: galleryImages.id,
        createdAt: galleryImages.createdAt,
      })
      .from(galleryImages)
      .innerJoin(galleryFolders, eq(galleryImages.folderId, galleryFolders.id))
      .where(eq(galleryFolders.isPublished, true));

    photoList.forEach((photo) => {
      if (photo.id) {
        entries.push({
          url: `${BASE_URL}/p/${photo.id}`,
          lastModified: photo.createdAt ? new Date(photo.createdAt) : new Date(),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
    });

    // 7. Blog
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}/blog`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
    
    // Blog Posts
    const blogData = await loadAllProject(1, 1500);
    const blogs: any = blogData?.data || [];
    blogs.forEach((blog: any) => {
      for (const locale of locales) {
        entries.push({
          url: `${BASE_URL}/${locale}/blog/${blog.slug?.current || blog.slug}`,
          lastModified: blog.updatedAt ? new Date(blog.updatedAt) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    });

    // 8. Docs
    const docs = [
      "/docs",
      "/docs/dev",
      "/docs/api",
      "/docs/database",
      "/docs/erd",
      "/docs/email-templates"
    ];
    for (const doc of docs) {
      entries.push({
        url: `${BASE_URL}${doc}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }

  } catch (error) {
    console.error("Error generating dynamic sitemap routes:", error);
  }

  return entries;
}
