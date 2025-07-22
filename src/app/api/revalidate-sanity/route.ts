import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { parseBody } from 'next-sanity/webhook';

export async function POST(req: NextRequest) {
  try {
    const { body, isValidSignature } = await parseBody<{
      _type: string;
      slug?: { current?: string };
      isFeatured?: boolean;
    }>(req, process.env.SANITY_REVALIDATE_SECRET);

    if (!isValidSignature) {
      const message = 'Invalid signature';
      return new Response(JSON.stringify({ message }), { status: 401 });
    }

    if (!body?._type) {
      const message = 'Bad Request';
      return new Response(JSON.stringify({ message }), { status: 400 });
    }

    // Handle project (blog post) updates
    if (body._type === 'project') {
      const slug = body.slug?.current;
      
      // Always revalidate featured posts when any project is updated
      revalidateTag('featured-projects');
      revalidateTag('project');
      revalidateTag('home');
      
      // If the post has a slug, revalidate specific pages
      if (slug) {
        revalidateTag(`project:${slug}`);
        
        // If this post was marked as featured, revalidate homepage
        if (body.isFeatured !== undefined) {
          revalidateTag('featured-projects');
          
          // Revalidate the homepage route
          try {
            const baseUrl = req.nextUrl.origin;
            await fetch(`${baseUrl}/api/revalidate-manual`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                path: '/',
                secret: process.env.SANITY_REVALIDATE_SECRET 
              })
            });
          } catch (error) {
            console.error('Failed to revalidate homepage:', error);
          }
        }
      }
      
      return NextResponse.json({ 
        message: `Successfully revalidated project${slug ? ` with slug: ${slug}` : ''}`,
        revalidated: true,
        timestamp: new Date().toISOString()
      });
    }

    // Handle other content types that might affect the homepage
    if (['settings', 'home'].includes(body._type)) {
      revalidateTag(body._type);
      revalidateTag('home');
      
      return NextResponse.json({ 
        message: `Successfully revalidated ${body._type}`,
        revalidated: true,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({ 
      message: `Received webhook for ${body._type} but no revalidation needed`,
      revalidated: false,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error(err);
    return new Response(err.message, { status: 500 });
  }
}

// Also handle GET requests for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Sanity webhook revalidation endpoint is working',
    timestamp: new Date().toISOString(),
    env: {
      hasSecret: !!process.env.SANITY_REVALIDATE_SECRET,
    }
  });
}
