import { NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { db } from "@/lib/connect-db";
import { user, userRole, role } from "@/db/schema";
import { and, countDistinct, eq, ilike, or, asc } from "drizzle-orm";

export const GET = protectApiRoute("ROLE", "READ", async (request, context) => {
  if (
    !(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(context.userId, "USER", "READ"))
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const roleId = url.pathname.split("/")[4];
  const page = Number(url.searchParams.get("page") || 1);
  const search = (url.searchParams.get("search") || "").trim();
  if (!roleId || !Number.isSafeInteger(page) || page < 1 || search.length > 200)
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  try {
    const [selectedRole] = await db
      .select({ id: role.id, name: role.name, isActive: role.isActive })
      .from(role)
      .where(eq(role.id, roleId))
      .limit(1);
    if (!selectedRole)
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    const escaped = search.replace(/[\\%_]/g, "\\$&");
    const where = and(
      eq(userRole.roleId, roleId),
      eq(userRole.isActive, true),
      search
        ? or(
            ilike(user.userName, `%${escaped}%`),
            ilike(user.email, `%${escaped}%`),
          )
        : undefined,
    );
    const [{ total }] = await db
      .select({ total: countDistinct(user.id) })
      .from(userRole)
      .innerJoin(user, eq(userRole.userId, user.id))
      .where(where);
    const users = await db
      .selectDistinct({
        id: user.id,
        userName: user.userName,
        email: user.email,
      })
      .from(userRole)
      .innerJoin(user, eq(userRole.userId, user.id))
      .where(where)
      .orderBy(asc(user.userName), asc(user.id))
      .limit(25)
      .offset((page - 1) * 25);
    return NextResponse.json({
      role: selectedRole,
      users,
      pagination: { page, total, totalPages: Math.ceil(total / 25) },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load users for this role" },
      { status: 500 },
    );
  }
});
