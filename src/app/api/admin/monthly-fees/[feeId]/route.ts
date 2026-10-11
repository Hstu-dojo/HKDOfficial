import { NextRequest, NextResponse } from "next/server";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { feeById } from "@/lib/billing/service";
import { updateFee } from "@/lib/billing/update-fee";
import { actionPermissions, type FeeAction } from "@/lib/billing/transitions";
import { billingErrorResponse, billingBody } from "@/lib/billing/http";
import { db } from "@/lib/connect-db";
import { monthlyFeeEvents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
type Params = { params: Promise<{ feeId: string }> };
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const context = await getRBACContext();
    if (!context)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!(await hasPermission(context.userId, "MONTHLY_FEE", "READ")))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { feeId } = await params;
    const row = await feeById(feeId);
    const events = await db
      .select()
      .from(monthlyFeeEvents)
      .where(eq(monthlyFeeEvents.monthlyFeeId, feeId))
      .orderBy(desc(monthlyFeeEvents.createdAt));
    return NextResponse.json({ ...row, events });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const context = await getRBACContext();
    if (!context)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    // Reject non-financial administrators before reading financial records or request bodies.
    if (
      !(await hasPermission(context.userId, "MONTHLY_FEE", "MANAGE")) &&
      !(await hasPermission(context.userId, "MONTHLY_FEE", "VERIFY"))
    )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const body = await billingBody(request);
    const permission = Object.hasOwn(actionPermissions, body.action)
      ? actionPermissions[body.action as FeeAction]
      : null;
    if (!permission)
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    if (!(await hasPermission(context.userId, "MONTHLY_FEE", permission)))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { feeId } = await params;
    return NextResponse.json(
      await updateFee(feeId, body, `user:${context.userId}`),
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
