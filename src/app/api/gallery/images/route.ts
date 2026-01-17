import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { galleryImages, galleryFolders } from "@/db/schema";
import { eq, desc, asc, isNull, and, ilike, or } from "drizzle-orm";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import cloudinary from "@/utils/cloudinary";

// GET - List images (optionally filtered by folder)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const publicOnly = searchParams.get("public") === "true";
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];
    
    if (folderId === "root" || folderId === null) {
      conditions.push(isNull(galleryImages.folderId));
    } else if (folderId && folderId !== "all") {
      conditions.push(eq(galleryImages.folderId, folderId));
    }

    if (publicOnly) {
      conditions.push(eq(galleryImages.isPublished, true));
    }

    if (featured) {
      conditions.push(eq(galleryImages.isFeatured, true));
    }

    if (search) {
      conditions.push(
        or(
          ilike(galleryImages.title, `%${search}%`),
          ilike(galleryImages.description, `%${search}%`),
          ilike(galleryImages.altText, `%${search}%`)
        )
      );
    }

    const images = await db
      .select()
      .from(galleryImages)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(galleryImages.displayOrder), desc(galleryImages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery images" },
      { status: 500 }
    );
  }
}

// POST - Upload/register a new image
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
    const {
      folderId,
      publicId,
      assetId,
      secureUrl,
      format,
      resourceType = "image",
      width,
      height,
      bytes,
      title,
      description,
      altText,
      tags = [],
      isFeatured = false,
      isPublished = true,
    } = body;

    if (!publicId || !secureUrl) {
      return NextResponse.json(
        { error: "publicId and secureUrl are required" },
        { status: 400 }
      );
    }

    // Verify folder exists if provided
    if (folderId) {
      const folders = await db
        .select({ id: galleryFolders.id })
        .from(galleryFolders)
        .where(eq(galleryFolders.id, folderId))
        .limit(1);

      if (folders.length === 0) {
        return NextResponse.json(
          { error: "Folder not found" },
          { status: 404 }
        );
      }
    }

    // Get highest display order in folder
    const lastImage = await db
      .select({ displayOrder: galleryImages.displayOrder })
      .from(galleryImages)
      .where(folderId ? eq(galleryImages.folderId, folderId) : isNull(galleryImages.folderId))
      .orderBy(desc(galleryImages.displayOrder))
      .limit(1);

    const displayOrder = lastImage.length > 0 ? lastImage[0].displayOrder + 1 : 0;

    const [newImage] = await db
      .insert(galleryImages)
      .values({
        folderId: folderId || null,
        publicId,
        assetId,
        secureUrl,
        format,
        resourceType,
        width,
        height,
        bytes,
        title,
        description,
        altText,
        tags,
        displayOrder,
        isFeatured,
        isPublished,
        uploadedBy: context.userId,
      })
      .returning();

    return NextResponse.json({ image: newImage }, { status: 201 });
  } catch (error) {
    console.error("Error creating gallery image:", error);
    return NextResponse.json(
      { error: "Failed to create gallery image" },
      { status: 500 }
    );
  }
}

// PUT - Bulk upload images (from Cloudinary widget callback)
export async function PUT(request: NextRequest) {
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
    const { folderId, images: uploadedImages } = body;

    if (!Array.isArray(uploadedImages) || uploadedImages.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    // Get highest display order in folder
    const lastImage = await db
      .select({ displayOrder: galleryImages.displayOrder })
      .from(galleryImages)
      .where(folderId ? eq(galleryImages.folderId, folderId) : isNull(galleryImages.folderId))
      .orderBy(desc(galleryImages.displayOrder))
      .limit(1);

    let displayOrder = lastImage.length > 0 ? lastImage[0].displayOrder + 1 : 0;

    const insertedImages = [];
    for (const img of uploadedImages) {
      const [newImage] = await db
        .insert(galleryImages)
        .values({
          folderId: folderId || null,
          publicId: img.public_id,
          assetId: img.asset_id,
          secureUrl: img.secure_url,
          format: img.format,
          resourceType: img.resource_type || "image",
          width: img.width,
          height: img.height,
          bytes: img.bytes,
          title: img.original_filename || null,
          displayOrder: displayOrder++,
          isPublished: true,
          uploadedBy: context.userId,
        })
        .returning();
      insertedImages.push(newImage);
    }

    return NextResponse.json({ images: insertedImages }, { status: 201 });
  } catch (error) {
    console.error("Error bulk creating gallery images:", error);
    return NextResponse.json(
      { error: "Failed to create gallery images" },
      { status: 500 }
    );
  }
}
