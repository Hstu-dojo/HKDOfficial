import { NextResponse } from "next/server";

// Cache for 5 minutes
export const revalidate = 300;

export async function GET() {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dksn30eyz";
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("Cloudinary API credentials not configured");
      return NextResponse.json(
        { error: "Cloudinary not configured", images: [] },
        { status: 500 }
      );
    }

    // Fetch images from Cloudinary's favourite folder using Admin API
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?type=upload&prefix=favourite/&max_results=50`;
    
    const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error("Cloudinary API error:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch from Cloudinary", images: [] },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Transform response to extract public IDs and create optimized URLs
    // Cinematic effect: vignette, contrast boost, vibrance, and sharpening
    const cinematicTransform = "c_fill,w_720,h_480,q_auto,e_vignette:30,e_contrast:10,e_vibrance:20,e_sharpen:80";
    
    const images = (data.resources || []).map((resource: { public_id: string; format: string }, index: number) => ({
      id: resource.public_id,
      title: `HKD Moment ${index + 1}`,
      thumbnail: `https://res.cloudinary.com/${cloudName}/image/upload/${cinematicTransform}/${resource.public_id}.${resource.format || 'jpg'}`,
    }));

    return NextResponse.json({
      images,
      total: images.length,
      folder: "favourite",
    });
  } catch (error) {
    console.error("Error fetching Cloudinary images:", error);
    return NextResponse.json(
      { error: "Internal server error", images: [] },
      { status: 500 }
    );
  }
}
