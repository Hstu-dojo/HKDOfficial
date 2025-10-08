import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import type { NextRequest } from "next/server";
import { NextResponse } from 'next/server'

export const withAuthMiddleware = async (req: NextRequest) => {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()

  // Check if user is authenticated
  if (!session) {
    // Redirect to login page if not authenticated
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check for admin routes
  if (req.nextUrl.pathname === "/docs" || req.nextUrl.pathname.startsWith("/docs/")) {
    // You might need to check user role from your database here
    // For now, allowing all authenticated users to access docs
    // TODO: Implement role-based access control
  }

  return res
}
