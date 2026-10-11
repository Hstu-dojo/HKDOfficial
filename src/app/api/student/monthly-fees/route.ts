import { feeRecords } from "@/lib/billing/service";
import { effectiveStatus } from "@/lib/billing/policy";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { monthlyFees, members, courses, courseEnrollments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getLocalUserId } from "@/lib/rbac/middleware";
import { createClient } from "@/lib/supabase/server";

// GET /api/student/monthly-fees - Get current user's monthly fees
export async function GET(request: NextRequest) {
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
      return NextResponse.json([]);
    }

    const fees = await feeRecords({}, [eq(members.userId, localUserId)]);
    const result = fees.map(({ fee, course, canPay }) => ({
      id: fee.id,
      billingMonth: fee.billingMonth,
      amount: fee.amount,
      totalAmount: fee.amount,
      amountPaid: fee.amountPaid,
      paidAmount: fee.amountPaid || 0,
      currency: fee.currency,
      dueDate: fee.dueDate,
      status: effectiveStatus(fee),
      canPay,
      courseName: course?.name,
      // Payment details
      paymentMethod: fee.paymentMethod,
      transactionId: fee.transactionId,
      paymentProofUrl: fee.paymentProofUrl,
      paymentSubmittedAt: fee.paymentSubmittedAt,
      paidAt: fee.paidAt,
      verificationNotes: fee.verificationNotes,
      // Fee breakdown (for PayFeeForm compatibility)
      feeAmount: fee.amount,
      discountAmount: 0,
      lateFeePenalty: 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching student monthly fees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
