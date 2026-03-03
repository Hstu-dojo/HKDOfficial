import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinary';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/certificates/upload-signature
 *
 * Accepts a base64 data-URL signature image, uploads it to Cloudinary
 * under the `certificate-signatures` folder, and returns the secure URL.
 *
 * Body: { dataUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dataUrl } = body as { dataUrl: string };

    if (!dataUrl) {
      return NextResponse.json({ error: 'dataUrl is required' }, { status: 400 });
    }

    if (!dataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data URL' }, { status: 400 });
    }

    const timestamp = Date.now();
    const folder = 'certificate-signatures';
    const publicId = `${folder}/sig_${timestamp}`;

    const result = await cloudinary.v2.uploader.upload(dataUrl, {
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { quality: 'auto', fetch_format: 'auto' },
        { width: 400, height: 150, crop: 'limit' as const },
      ],
    });

    return NextResponse.json({
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Error uploading signature image:', error);
    return NextResponse.json(
      { error: 'Failed to upload signature image' },
      { status: 500 }
    );
  }
}
