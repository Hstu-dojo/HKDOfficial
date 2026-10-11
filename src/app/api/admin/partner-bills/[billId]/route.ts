import { NextRequest, NextResponse } from "next/server";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { changeInvoice } from "@/lib/billing/invoices";
import { billingErrorResponse, billingBody } from "@/lib/billing/http";
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ billId: string }> },
) {
  const c = await getRBACContext();
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (
    !(await hasPermission(c.userId, "ADMIN_PANEL", "ACCESS")) ||
    (!(await hasPermission(c.userId, "PARTNER_BILL", "VERIFY")) &&
      !(await hasPermission(c.userId, "PARTNER_BILL", "MANAGE")))
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const body = await billingBody(request);
    if (
      !(await hasPermission(
        c.userId,
        "PARTNER_BILL",
        body.action === "mark_paid" ? "VERIFY" : "MANAGE",
      ))
    )
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json(
      await changeInvoice(
        (await params).billId,
        body.action,
        body.notes,
        c.userId,
      ),
    );
  } catch (e) {
    return billingErrorResponse(e);
  }
}
