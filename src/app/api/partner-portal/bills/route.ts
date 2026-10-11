import { NextResponse } from "next/server";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { listInvoices } from "@/lib/billing/invoices";
import { billingErrorResponse } from "@/lib/billing/http";
export async function GET(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    return NextResponse.json(
      await listInvoices(new URL(request.url).searchParams, user.partnerId),
    );
  } catch (e) {
    return billingErrorResponse(e);
  }
}
