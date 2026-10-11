import { NextResponse } from "next/server";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { feeById } from "@/lib/billing/service";
import { updateFee } from "@/lib/billing/update-fee";
import { billingErrorResponse, billingBody } from "@/lib/billing/http";
type Params = { params: Promise<{ feeId: string }> };
export async function GET(request: Request, { params }: Params) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    return NextResponse.json(
      await feeById((await params).feeId, { partnerId: user.partnerId }),
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
export async function PATCH(request: Request, { params }: Params) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  try {
    const body = await billingBody(request);
    if (
      !["verify_payment", "reject_payment", "mark_paid", "waive"].includes(
        body.action,
      )
    )
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    return NextResponse.json({
      fee: await updateFee(
        (await params).feeId,
        body,
        `partner-admin:${user.id}`,
        { partnerId: user.partnerId },
      ),
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
