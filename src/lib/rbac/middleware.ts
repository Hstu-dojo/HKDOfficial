import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { hasPermission, hasRole } from "./permissions";
import type { ResourceType, ActionType, RBACContext } from "./types";
import { db } from "@/lib/connect-db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get local DB user ID from Supabase user ID
 */
export async function getLocalUserId(supabaseUserId: string): Promise<string | null> {
  try {
    const result = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.supabaseUserId, supabaseUserId))
      .limit(1);
    
    return result.length > 0 ? result[0].id : null;
  } catch (error) {
    console.error("Error getting local user ID:", error);
    return null;
  }
}

/**
 * Get the current user's RBAC context
 */
export async function getRBACContext(): Promise<RBACContext | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log("[getRBACContext] Session check:", { 
      hasSession: !!user, 
      hasUser: !!user,
      userId: user?.id,
      error: error?.message 
    });
    
    if (error || !user?.id) {
      console.log("[getRBACContext] No valid session");
      return null;
    }

    // Get local DB user ID from Supabase user ID
    const localUserId = await getLocalUserId(user.id);
    console.log("[getRBACContext] Local user lookup:", { supabaseId: user.id, localUserId });
    
    if (!localUserId) {
      console.error("[getRBACContext] Local user not found for Supabase ID:", user.id);
      return null;
    }

    return {
      userId: localUserId, // Use local DB user ID
      email: user.email!,
      roles: [], // Will be populated by getUserPermissions
    };
  } catch (error) {
    console.error("[getRBACContext] Error:", error);
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
 * Higher-order function for API route protection.
 * Returns a Next.js 15 compatible route handler.
 * Next.js supplies a second argument (route context) shaped like
 * `{ params: Promise<Record<string, string | string[]>> }`.
 */
export function protectApiRoute(
  resource: ResourceType,
  action: ActionType,
  handler: (request: NextRequest, context: RBACContext) => Promise<NextResponse>
) {
  return async function (
    request: NextRequest,
    _routeContext: { params: Promise<Record<string, string | string[]>> }
  ): Promise<NextResponse> {
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
