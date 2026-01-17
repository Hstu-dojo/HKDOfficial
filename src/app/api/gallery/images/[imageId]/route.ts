import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { galleryImages, galleryFolders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import cloudinary from "@/utils/cloudinary";

// GET - Get a single image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const { imageId } = await params;
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get("public") === "true";

    const images = await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.id, imageId))
      .limit(1);

    if (images.length === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const image = images[0];

    if (publicOnly && !image.isPublished) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error("Error fetching gallery image:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery image" },
      { status: 500 }
    );
  }
}

// PATCH - Update an image
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const context = await getRBACContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canUpdate = await hasPermission(context.userId, "GALLERY", "UPDATE");
    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { imageId } = await params;
    const body = await request.json();
    const {
      folderId,
      title,
      description,
      altText,
      tags,
      displayOrder,
      isFeatured,
      isPublished,
    } = body;

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (folderId !== undefined) {
      // Verify folder exists if moving to a folder
      if (folderId) {
        const folders = await db
          .select({ id: galleryFolders.id })
          .from(galleryFolders)
          .where(eq(galleryFolders.id, folderId))
          .limit(1);

        if (folders.length === 0) {
          return NextResponse.json(
            { error: "Target folder not found" },
            { status: 404 }
          );
        }
      }
      updateData.folderId = folderId;
    }

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (altText !== undefined) updateData.altText = altText;
    if (tags !== undefined) updateData.tags = tags;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const [updatedImage] = await db
      .update(galleryImages)
      .set(updateData)
      .where(eq(galleryImages.id, imageId))
      .returning();

    if (!updatedImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ image: updatedImage });
  } catch (error) {
    console.error("Error updating gallery image:", error);
    return NextResponse.json(
      { error: "Failed to update gallery image" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const context = await getRBACContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canDelete = await hasPermission(context.userId, "GALLERY", "DELETE");
    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { imageId } = await params;

    // Get the image first
    const images = await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.id, imageId))
      .limit(1);

    if (images.length === 0) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const image = images[0];

    // Delete from Cloudinary
    try {
      await cloudinary.v2.uploader.destroy(image.publicId);
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Delete from database
    await db.delete(galleryImages).where(eq(galleryImages.id, imageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gallery image:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery image" },
      { status: 500 }
    );
  }
}
