import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { galleryFolders, galleryImages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import cloudinary from "@/utils/cloudinary";

// GET - Get a single folder with its images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params;
    const { searchParams } = new URL(request.url);
    const publicOnly = searchParams.get("public") === "true";

    const folders = await db
      .select()
      .from(galleryFolders)
      .where(eq(galleryFolders.id, folderId))
      .limit(1);

    if (folders.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const folder = folders[0];

    // Check if public access and folder is not published
    if (publicOnly && !folder.isPublished) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Get images in this folder
    const images = await db
      .select()
      .from(galleryImages)
      .where(eq(galleryImages.folderId, folderId))
      .orderBy(galleryImages.displayOrder);

    // Get child folders
    const childFolders = await db
      .select()
      .from(galleryFolders)
      .where(eq(galleryFolders.parentId, folderId))
      .orderBy(galleryFolders.displayOrder);

    return NextResponse.json({
      folder,
      images: publicOnly ? images.filter(img => img.isPublished) : images,
      childFolders: publicOnly ? childFolders.filter(f => f.isPublished) : childFolders,
    });
  } catch (error) {
    console.error("Error fetching gallery folder:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery folder" },
      { status: 500 }
    );
  }
}

// PATCH - Update a folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
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

    const { folderId } = await params;
    const body = await request.json();
    const { name, description, isPublished, displayOrder, coverImageId } = body;

    const updateData: Record<string, any> = {
      updatedBy: context.userId,
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPublished !== undefined) updateData.isPublished = isPublished;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (coverImageId !== undefined) updateData.coverImageId = coverImageId;

    const [updatedFolder] = await db
      .update(galleryFolders)
      .set(updateData)
      .where(eq(galleryFolders.id, folderId))
      .returning();

    if (!updatedFolder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    return NextResponse.json({ folder: updatedFolder });
  } catch (error) {
    console.error("Error updating gallery folder:", error);
    return NextResponse.json(
      { error: "Failed to update gallery folder" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a folder and its contents
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
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

    const { folderId } = await params;

    // Get the folder first
    const folders = await db
      .select()
      .from(galleryFolders)
      .where(eq(galleryFolders.id, folderId))
      .limit(1);

    if (folders.length === 0) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const folder = folders[0];

    // Get all images in this folder to delete from Cloudinary
    const images = await db
      .select({ publicId: galleryImages.publicId })
      .from(galleryImages)
      .where(eq(galleryImages.folderId, folderId));

    // Delete images from Cloudinary
    if (images.length > 0) {
      const publicIds = images.map(img => img.publicId);
      try {
        await cloudinary.v2.api.delete_resources(publicIds);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary fails
      }
    }

    // Delete the folder (cascade will delete images in DB)
    await db.delete(galleryFolders).where(eq(galleryFolders.id, folderId));

    // Try to delete the Cloudinary folder
    try {
      await cloudinary.v2.api.delete_folder(folder.cloudinaryFolder);
    } catch (cloudinaryError) {
      console.error("Error deleting Cloudinary folder:", cloudinaryError);
      // Non-critical error
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gallery folder:", error);
    return NextResponse.json(
      { error: "Failed to delete gallery folder" },
      { status: 500 }
    );
  }
}
