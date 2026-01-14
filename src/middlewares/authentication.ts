import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest } from "next/server";
import { NextResponse } from 'next/server'

/**
 * Basic authentication middleware - checks if user is logged in
 * Use this for routes that require authentication but not specific roles
 */
export const withAuthMiddleware = async (req: NextRequest) => {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession()

  // Check if user is authenticated
  if (error || !session) {
    console.log('User not authenticated, redirecting to login');
    // Redirect to login page if not authenticated
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated - allow access
  return res
}
