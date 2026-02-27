import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { 
  getAllPermissions, 
  createPermission
} from "@/lib/rbac/permissions";
import { db } from "@/lib/connect-db";
import { rolePermission, role } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { ResourceType, ActionType } from "@/lib/rbac/types";

// GET /api/rbac/permissions - Get all permissions (with role assignment counts)
export const GET = protectApiRoute("PERMISSION", "READ", async (request, context) => {
  try {
    const permissions = await getAllPermissions();

    // Get assignment counts for each permission
    const assignmentCounts = await db
      .select({
        permissionId: rolePermission.permissionId,
        count: sql<number>`count(*)::int`,
      })
      .from(rolePermission)
      .groupBy(rolePermission.permissionId);

    const countMap = new Map(assignmentCounts.map(a => [a.permissionId, a.count]));

    // Get role names for each permission
    const assignmentDetails = await db
      .select({
        permissionId: rolePermission.permissionId,
        roleName: role.name,
      })
      .from(rolePermission)
      .innerJoin(role, eq(rolePermission.roleId, role.id));

    const roleNamesMap = new Map<string, string[]>();
    for (const a of assignmentDetails) {
      const existing = roleNamesMap.get(a.permissionId) || [];
      existing.push(a.roleName);
      roleNamesMap.set(a.permissionId, existing);
    }

    const enriched = permissions.map(p => ({
      ...p,
      assignedRoleCount: countMap.get(p.id) || 0,
      assignedRoles: roleNamesMap.get(p.id) || [],
    }));

    return NextResponse.json({ permissions: enriched, total: enriched.length });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
});

// POST /api/rbac/permissions - Create a new permission
export const POST = protectApiRoute("PERMISSION", "CREATE", async (request, context) => {
  try {
    const { name, resource, action, description } = await request.json();
    
    if (!name || !resource || !action) {
      return NextResponse.json({ 
        error: "Permission name, resource, and action are required" 
      }, { status: 400 });
    }
    
    const allowedResources = [
      "USER", "ACCOUNT", "SESSION", "PROVIDER", "ROLE", "PERMISSION",
      "COURSE", "BLOG", "MEDIA", "CLASS", "EQUIPMENT", "MEMBER", "BILL", "PAYMENT",
      "GALLERY", "EVENT", "ANNOUNCEMENT", "CERTIFICATE", "REPORT",
      "ENROLLMENT", "MONTHLY_FEE", "SCHEDULE", "PROGRAM", "PROGRAM_REGISTRATION",
      "PARTNER", "PARTNER_BILL", "ADMIN_PANEL"
    ] as const;

    if (!allowedResources.includes(resource)) {
      return NextResponse.json({ error: "Invalid resource type" }, { status: 400 });
    }

    const allowedActions = ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE", "APPROVE", "VERIFY", "ACCESS"] as const;
    if (!allowedActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }

    const permissionId = await createPermission(
      name, 
      resource as ResourceType, 
      action as ActionType, 
      description
    );
    
    if (!permissionId) {
      return NextResponse.json({ error: "Failed to create permission" }, { status: 500 });
    }
    
    return NextResponse.json({ permissionId, message: "Permission created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating permission:", error);
    return NextResponse.json({ error: "Failed to create permission" }, { status: 500 });
  }
});
