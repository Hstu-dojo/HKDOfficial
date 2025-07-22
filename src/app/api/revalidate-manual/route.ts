import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const path = searchParams.get('path');
  const secret = searchParams.get('secret');

  // Check for secret to prevent unauthorized revalidation
  if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  if (!path) {
    return NextResponse.json({ message: 'Path parameter is required' }, { status: 400 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ 
      revalidated: true, 
      path,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({ 
      message: 'Error revalidating path',
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { path, secret } = await req.json();

    if (secret !== process.env.SANITY_REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    if (!path) {
      return NextResponse.json({ message: 'Path parameter is required' }, { status: 400 });
    }

    revalidatePath(path);
    return NextResponse.json({ 
      revalidated: true, 
      path,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({ 
      message: 'Error revalidating path',
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
