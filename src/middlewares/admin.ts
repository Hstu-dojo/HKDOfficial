import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { db } from '@/lib/connect-db';
import { user, userRole, role } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Admin middleware - checks if user is authenticated and has admin-level roles
 * Applies to /admin and /docs routes
 */
export async function withAdminMiddleware(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const supabase = createMiddlewareClient({ req: request, res: response });

    // Check if user is authenticated
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user?.id) {
      // Not authenticated - redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Get local user ID from Supabase user ID
    const localUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.supabaseUserId, session.user.id))
      .limit(1);

    if (localUser.length === 0) {
      console.error('User not found in local database:', session.user.id);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'user_not_found');
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has admin-level roles
    const userRoles = await db
      .select({
        roleName: role.name,
        roleIsActive: role.isActive,
        userRoleIsActive: userRole.isActive,
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .where(
        and(
          eq(userRole.userId, localUser[0].id),
          eq(userRole.isActive, true),
          eq(role.isActive, true)
        )
      );

    // Check if user has any admin-level role
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'INSTRUCTOR'];
    const hasAdminRole = userRoles.some(ur => adminRoles.includes(ur.roleName));

    if (!hasAdminRole) {
      console.warn('User lacks admin privileges:', session.user.email);
      // Redirect to unauthorized page
      const unauthorizedUrl = new URL('/unauthorized', request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    // User is authenticated and has admin role - allow access
    return response;
  } catch (error) {
    console.error('Admin middleware error:', error);
    // On error, redirect to login for safety
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    loginUrl.searchParams.set('error', 'middleware_error');
    return NextResponse.redirect(loginUrl);
  }
}
