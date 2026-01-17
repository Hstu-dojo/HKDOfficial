import { NextRequest, NextResponse } from "next/server";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import cloudinary from "@/utils/cloudinary";

// POST - Generate Cloudinary signature for secure client-side uploads
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
    const { folder, tags = [], transformation } = body;

    const timestamp = Math.round(Date.now() / 1000);
    const baseFolder = process.env.CLOUDINARY_FOLDER || "hkd-gallery";
    const uploadFolder = folder ? `${baseFolder}/${folder}` : baseFolder;

    // Build params to sign
    const paramsToSign: Record<string, any> = {
      timestamp,
      folder: uploadFolder,
    };

    if (tags.length > 0) {
      paramsToSign.tags = tags.join(",");
    }

    if (transformation) {
      paramsToSign.transformation = transformation;
    }

    // Generate signature
    const signature = cloudinary.v2.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder: uploadFolder,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (error) {
    console.error("Error generating Cloudinary signature:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
