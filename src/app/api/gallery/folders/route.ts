import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { galleryFolders, galleryImages } from "@/db/schema";
import { eq, asc, isNull, desc, and, count } from "drizzle-orm";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";

// GET - List all folders (for admin) or published folders (for public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get("parentId");
    const publicOnly = searchParams.get("public") === "true";

    // Build query conditions
    const conditions = [];
    
    if (parentId === "root" || parentId === null || parentId === "") {
      conditions.push(isNull(galleryFolders.parentId));
    } else if (parentId) {
      conditions.push(eq(galleryFolders.parentId, parentId));
    }

    // For public access, only show published folders
    if (publicOnly) {
      conditions.push(eq(galleryFolders.isPublished, true));
    }

    // Get folders with image count
    const folders = await db
      .select({
        id: galleryFolders.id,
        name: galleryFolders.name,
        slug: galleryFolders.slug,
        description: galleryFolders.description,
        parentId: galleryFolders.parentId,
        cloudinaryFolder: galleryFolders.cloudinaryFolder,
        coverImageId: galleryFolders.coverImageId,
        isPublished: galleryFolders.isPublished,
        displayOrder: galleryFolders.displayOrder,
        createdAt: galleryFolders.createdAt,
        updatedAt: galleryFolders.updatedAt,
      })
      .from(galleryFolders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(galleryFolders.displayOrder), desc(galleryFolders.createdAt));

    // Get image counts for each folder
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const imageCountResult = await db
          .select({ count: count() })
          .from(galleryImages)
          .where(eq(galleryImages.folderId, folder.id));
        
        // Get cover image if set
        let coverImage = null;
        if (folder.coverImageId) {
          const coverImages = await db
            .select({
              id: galleryImages.id,
              secureUrl: galleryImages.secureUrl,
              title: galleryImages.title,
            })
            .from(galleryImages)
            .where(eq(galleryImages.id, folder.coverImageId))
            .limit(1);
          coverImage = coverImages[0] || null;
        } else {
          // Get first image as cover
          const firstImages = await db
            .select({
              id: galleryImages.id,
              secureUrl: galleryImages.secureUrl,
              title: galleryImages.title,
            })
            .from(galleryImages)
            .where(eq(galleryImages.folderId, folder.id))
            .orderBy(asc(galleryImages.displayOrder))
            .limit(1);
          coverImage = firstImages[0] || null;
        }

        return {
          ...folder,
          imageCount: imageCountResult[0]?.count || 0,
          coverImage,
        };
      })
    );

    return NextResponse.json({ folders: foldersWithCounts });
  } catch (error) {
    console.error("Error fetching gallery folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery folders" },
      { status: 500 }
    );
  }
}

// POST - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const context = await getRBACContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canCreate = await hasPermission(context.userId, "GALLERY", "CREATE");
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, parentId, isPublished = false, displayOrder = 0 } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      + "-" + Date.now().toString(36);

    // Generate Cloudinary folder path
    const baseFolder = process.env.CLOUDINARY_FOLDER || "hkd-gallery";
    let cloudinaryFolder = baseFolder;
    
    if (parentId) {
      // Get parent folder's cloudinary path
      const parentFolders = await db
        .select({ cloudinaryFolder: galleryFolders.cloudinaryFolder })
        .from(galleryFolders)
        .where(eq(galleryFolders.id, parentId))
        .limit(1);
      
      if (parentFolders.length > 0) {
        cloudinaryFolder = `${parentFolders[0].cloudinaryFolder}/${slug}`;
      } else {
        cloudinaryFolder = `${baseFolder}/${slug}`;
      }
    } else {
      cloudinaryFolder = `${baseFolder}/${slug}`;
    }

    const [newFolder] = await db
      .insert(galleryFolders)
      .values({
        name,
        slug,
        description,
        parentId: parentId || null,
        cloudinaryFolder,
        isPublished,
        displayOrder,
        createdBy: context.userId,
        updatedBy: context.userId,
      })
      .returning();

    return NextResponse.json({ folder: newFolder }, { status: 201 });
  } catch (error) {
    console.error("Error creating gallery folder:", error);
    return NextResponse.json(
      { error: "Failed to create gallery folder" },
      { status: 500 }
    );
  }
}
