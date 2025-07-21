import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function withAdminMiddleware(request: NextRequest) {
  try {
    // Get the token from the request
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user exists in token
    if (!token.id) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Allow the request to continue - role checking will be done client-side
    return NextResponse.next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    // On error, redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }
}
