import { NextResponse } from "next/server";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { generateMonthlyFees, listPartnerFees } from "@/lib/billing/service";
import { billingErrorResponse, billingBody } from "@/lib/billing/http";
export async function GET(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    return NextResponse.json(
      await listPartnerFees(new URL(request.url).searchParams, user.partnerId),
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
export async function POST(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    const { billingMonth } = await billingBody(request);
    return NextResponse.json(
      await generateMonthlyFees(
        billingMonth,
        { partnerId: user.partnerId },
        `partner-admin:${user.id}`,
      ),
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
