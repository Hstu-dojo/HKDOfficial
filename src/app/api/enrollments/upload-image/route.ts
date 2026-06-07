import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinary';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/enrollments/upload-image
 *
 * Accepts a base64 data-URL image (photo or signature) from the enrollment
 * wizard, uploads it to Cloudinary under the `enrollment-images` folder, and
 * returns the secure URL.
 *
 * Body: { dataUrl: string; type: 'photo' | 'signature'; courseId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dataUrl, type, courseId } = body as {
      dataUrl: string;
      type: 'photo' | 'signature';
      courseId?: string;
    };

    if (!dataUrl || !type) {
      return NextResponse.json(
        { error: 'dataUrl and type are required' },
        { status: 400 },
      );
    }

    if (!dataUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image data URL' },
        { status: 400 },
      );
    }

    // Build a unique public_id so files are easy to locate later
    const userId = user.id;
    const timestamp = Date.now();
    const folder = 'enrollment-images';
    const publicId = `${folder}/${userId}_${type}_${courseId ?? 'general'}_${timestamp}`;

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload(dataUrl, {
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      // Auto-optimise for web delivery
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        ...(type === 'photo'
          ? [{ width: 600, height: 800, crop: 'limit' as const }]
          : [{ width: 900, height: 300, crop: 'limit' as const }]),
      ],
    });

    return NextResponse.json({
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Error uploading enrollment image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 },
    );
  }
}
