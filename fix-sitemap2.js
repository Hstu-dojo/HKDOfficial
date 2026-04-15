const fs = require('fs');
const content = `import { MetadataRoute } from "next";
import { db } from "@/lib/connect-db";
import { courses, programs, profiles } from "@/db/schemas/karate";
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
    "/partner",
    "/cert-verify",
    "/karate/courses",
    "/karate/programs",
    "/org"
  ];

  for (const route of staticRoutes) {
    for (const locale of locales) {
      entries.push({
        url: \`\${BASE_URL}/\${locale}\${route}\`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1 : 0.8,
      });
    }
  }

  try {
    // 2. Dynamic Courses
    const courseList = await db.query.courses.findMany({
      columns: { id: true, initialStatus: true },
      where: eq(courses.initialStatus, "ACTIVE"),
    });

    courseList.forEach((course) => {
      for (const locale of locales) {
        entries.push({
          url: \`\${BASE_URL}/\${locale}/karate/courses/\${course.id}\`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.9,
        });
      }
    });

    // 3. Dynamic Programs
    const programList = await db.query.programs.findMany({
      columns: { slug: true, status: true },
      where: eq(programs.status, "ACTIVE"),
    });

    programList.forEach((program) => {
      if (program.slug) {
        for (const locale of locales) {
          entries.push({
            url: \`\${BASE_URL}/\${locale}/karate/programs/\${program.slug}\`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
          });
        }
      }
    });

    // 4. Dynamic Partners
    const partnerList = await db.query.profiles.findMany({
      columns: { slug: true, role: true },
      where: eq(profiles.role, "PARTNER"),
    });

    partnerList.forEach((partner) => {
      if (partner.slug) {
        for (const locale of locales) {
          entries.push({
            url: \`\${BASE_URL}/\${locale}/partner/\${partner.slug}\`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    });

    // 5. Blog
    entries.push({
      url: \`\${BASE_URL}/blog\`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
    
    // Blog Posts
    const blogData = await loadAllProject(1, 1500);
    const blogs: any = blogData?.data || [];
    blogs.forEach((blog: any) => {
      entries.push({
        url: \`\${BASE_URL}/blog/post/\${blog.slug}\`,
        lastModified: new Date(blog._updatedAt || new Date()),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });

    // 6. Docs
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
        url: \`\${BASE_URL}\${doc}\`,
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
`;
fs.writeFileSync('src/app/sitemap.ts', content);
