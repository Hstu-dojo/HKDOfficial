import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from '@supabase/ssr';

/**
 * Admin middleware - checks if user is authenticated and has admin-level roles
 * Applies to /admin and /docs routes
 * 
 * Note: This runs in Edge Runtime, so we can't use Node.js modules like 'pg'.
 * Database queries are done via API route instead.
 */
export async function withAdminMiddleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
    
    // Create Supabase client using @supabase/ssr (handles base64 cookies properly)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Check if user is authenticated - use getUser() for security (validates with Supabase server)
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (!authUser?.id) {
      // Not authenticated - redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check admin role via API route (Edge Runtime can't do direct DB queries)
    const baseUrl = request.nextUrl.origin;
    const checkRoleResponse = await fetch(`${baseUrl}/api/auth/check-admin-role`, {
      method: 'GET',
      headers: {
        'x-supabase-user-id': authUser.id,
      },
    });

    if (!checkRoleResponse.ok) {
      console.error('[Admin Middleware] Failed to check role:', checkRoleResponse.status);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'role_check_failed');
      return NextResponse.redirect(loginUrl);
    }

    const roleData = await checkRoleResponse.json();

    if (!roleData.hasAdminRole) {
      const unauthorizedUrl = new URL('/unauthorized', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    return response;
  } catch (error) {
    console.error('[Admin Middleware] Error:', error);
    // On error, redirect to login for safety
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    loginUrl.searchParams.set('error', 'middleware_error');
    return NextResponse.redirect(loginUrl);
  }
}
