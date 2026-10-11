import { NextRequest, NextResponse } from "next/server";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import { listInvoices, createInvoice } from "@/lib/billing/invoices";
import { billingErrorResponse, billingBody } from "@/lib/billing/http";
export async function GET(request: NextRequest) {
  const c = await getRBACContext();
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (
    !(await hasPermission(c.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(c.userId, "PARTNER_BILL", "READ"))
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(
      await listInvoices(
        request.nextUrl.searchParams,
        request.nextUrl.searchParams.get("partnerId") || undefined,
      ),
    );
  } catch (e) {
    return billingErrorResponse(e);
  }
}
export async function POST(request: NextRequest) {
  const c = await getRBACContext();
  if (!c) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (
    !(await hasPermission(c.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(c.userId, "PARTNER_BILL", "CREATE"))
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    return NextResponse.json(
      await createInvoice(await billingBody(request), c.userId),
      { status: 201 },
    );
  } catch (e) {
    return billingErrorResponse(e);
  }
}
