import { updateFee } from "@/lib/billing/update-fee";
import { studentBillingEligible } from "@/lib/billing/service";
import { billingErrorResponse } from "@/lib/billing/http";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { monthlyFees, members } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getLocalUserId } from "@/lib/rbac/middleware";
import { createClient } from "@/lib/supabase/server";

// POST /api/student/monthly-fees/[feeId]/pay - Submit payment for monthly fee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ feeId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const localUserId = await getLocalUserId(user.id);
    if (!localUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { feeId } = await params;
    const body = await request.json();
    const { paymentMethod, transactionId, paymentProofUrl } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    // Find member record for this user
    const memberRecord = await db
      .select()
      .from(members)
      .where(eq(members.userId, localUserId))
      .limit(1);

    if (memberRecord.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Get the fee
    const feeRecord = await db
      .select()
      .from(monthlyFees)
      .where(
        and(
          eq(monthlyFees.id, feeId),
          eq(monthlyFees.profileId, memberRecord[0].id),
        ),
      )
      .limit(1);

    if (feeRecord.length === 0) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    if (!(await studentBillingEligible(feeId, memberRecord[0].id)))
      return NextResponse.json(
        { error: "Billing is inactive for this membership period" },
        { status: 403 },
      );
    await updateFee(
      feeId,
      {
        action: "submit_payment",
        paymentMethod,
        transactionId,
        paymentProofUrl,
      },
      `user:${localUserId}`,
      {},
      memberRecord[0].id,
    );

    return NextResponse.json({
      success: true,
      message: "Payment submitted for verification",
    });
  } catch (error) {
    return billingErrorResponse(error);
  }
}
