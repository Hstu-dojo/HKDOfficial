import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { getAllRoles, getRolePermissions, getAllPermissions } from "@/lib/rbac/permissions";

// GET /api/rbac/matrix - Get complete role-permission matrix
export const GET = protectApiRoute("ROLE", "READ", async (request, context) => {
  try {
    const [roles, allPermissions] = await Promise.all([
      getAllRoles(),
      getAllPermissions()
    ]);
    
    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roles.map(async (role) => {
        const permissions = await getRolePermissions(role.id);
        return {
          ...role,
          permissions,
          permissionIds: permissions.map(p => p.id)
        };
      })
    );
    
    // Group permissions by resource for easier matrix display
    const permissionsByResource = allPermissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {} as Record<string, typeof allPermissions>);
    
    // Sort permissions within each resource by action
    const actionOrder = ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"];
    Object.keys(permissionsByResource).forEach(resource => {
      permissionsByResource[resource].sort((a, b) => 
        actionOrder.indexOf(a.action) - actionOrder.indexOf(b.action)
      );
    });
    
    return NextResponse.json({ 
      roles: rolesWithPermissions,
      permissions: allPermissions,
      permissionsByResource,
      resources: Object.keys(permissionsByResource).sort(),
      totalRoles: roles.length,
      totalPermissions: allPermissions.length
    });
  } catch (error) {
    console.error("Error fetching role-permission matrix:", error);
    return NextResponse.json({ error: "Failed to fetch role-permission matrix" }, { status: 500 });
  }
});
