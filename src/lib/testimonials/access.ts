import { NextResponse } from "next/server";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import type { ActionType } from "@/lib/rbac/types";
export async function testimonialAdminAccess(action: ActionType) {
  const context = await getRBACContext();
  if (!context)
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  if (
    !(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(context.userId, "TESTIMONIAL", "READ")) ||
    !(await hasPermission(context.userId, "TESTIMONIAL", action))
  )
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  return { context };
}
