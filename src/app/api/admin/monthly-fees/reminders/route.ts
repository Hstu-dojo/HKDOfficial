import { NextRequest, NextResponse } from "next/server";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { getReminders, postReminders } from "@/lib/billing/reminder-handler";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const context = await getRBACContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await hasPermission(context.userId, "MONTHLY_FEE", "READ")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return getReminders(request, {
    partnerId: request.nextUrl.searchParams.get("partnerId") || undefined,
  });
}
export async function POST(request: NextRequest) {
  const context = await getRBACContext();
  if (!context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await hasPermission(context.userId, "MONTHLY_FEE", "MANAGE")))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return postReminders(
    request,
    { partnerId: request.nextUrl.searchParams.get("partnerId") || undefined },
    `user:${context.userId}`,
  );
}
