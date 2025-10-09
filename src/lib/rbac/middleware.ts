import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { hasPermission, hasRole } from "./permissions";
import type { ResourceType, ActionType, RBACContext } from "./types";

/**
 * Get the current user's RBAC context
 */
export async function getRBACContext(): Promise<RBACContext | null> {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user?.id) {
      return null;
    }

    // For now, return basic context - can be enhanced with actual role fetching
    return {
      userId: session.user.id,
      email: session.user.email!,
      roles: [], // Will be populated by getUserPermissions
    };
  } catch (error) {
    console.error("Error getting RBAC context:", error);
    return null;
  }
}

/**
 * Middleware function to check permissions
 */
export function withPermission(resource: ResourceType, action: ActionType) {
  return async function (handler: (context: RBACContext) => Promise<NextResponse>) {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permitted = await hasPermission(context.userId, resource, action);
    if (!permitted) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(context);
  };
}

/**
 * Middleware function to check roles
 */
export function withRole(roleName: string) {
  return async function (handler: (context: RBACContext) => Promise<NextResponse>) {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasRequiredRole = await hasRole(context.userId, roleName);
    if (!hasRequiredRole) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(context);
  };
}

/**
 * Middleware function to check multiple roles (OR condition)
 */
export function withAnyRole(roleNames: string[]) {
  return async function (handler: (context: RBACContext) => Promise<NextResponse>) {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAnyRole = await Promise.all(
      roleNames.map(roleName => hasRole(context.userId, roleName))
    );
    
    if (!hasAnyRole.some(Boolean)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(context);
  };
}

/**
 * Check if the current user can access a resource
 */
export async function canAccess(resource: ResourceType, action: ActionType): Promise<boolean> {
  const context = await getRBACContext();
  if (!context) return false;
  
  return await hasPermission(context.userId, resource, action);
}

/**
 * Check if the current user has a specific role
 */
export async function userHasRole(roleName: string): Promise<boolean> {
  const context = await getRBACContext();
  if (!context) return false;
  
  return await hasRole(context.userId, roleName);
}

/**
 * Higher-order function for API route protection
 */
export function protectApiRoute(
  resource: ResourceType,
  action: ActionType,
  handler: (request: Request, context: RBACContext) => Promise<NextResponse>
) {
  return async function (request: Request) {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permitted = await hasPermission(context.userId, resource, action);
    if (!permitted) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(request, context);
  };
}

/**
 * Function for protecting page routes
 */
export async function protectPage(
  resource: ResourceType,
  action: ActionType
): Promise<RBACContext> {
  const context = await getRBACContext();
  
  if (!context) {
    // This will be handled by the client-side redirect
    throw new Error("Unauthorized");
  }

  const permitted = await hasPermission(context.userId, resource, action);
  if (!permitted) {
    throw new Error("Forbidden");
  }

  return context;
}
