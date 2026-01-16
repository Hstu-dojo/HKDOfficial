import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { monthlyFees, members } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getLocalUserId } from '@/lib/rbac/middleware';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/student/monthly-fees/[feeId]/pay - Submit payment for monthly fee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ feeId: string }> }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUserId = await getLocalUserId(session.user.id);
    if (!localUserId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { feeId } = await params;
    const body = await request.json();
    const { paymentMethod, transactionId, paymentProofUrl } = body;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Find member record for this user
    const memberRecord = await db
      .select()
      .from(members)
      .where(eq(members.userId, localUserId))
      .limit(1);

    if (memberRecord.length === 0) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get the fee
    const feeRecord = await db
      .select()
      .from(monthlyFees)
      .where(
        and(
          eq(monthlyFees.id, feeId),
          eq(monthlyFees.memberId, memberRecord[0].id)
        )
      )
      .limit(1);

    if (feeRecord.length === 0) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
    }

    const fee = feeRecord[0];

    // Check if payment can be submitted
    if (!['pending', 'due', 'overdue'].includes(fee.status)) {
      return NextResponse.json(
        { error: 'This fee has already been paid or processed' },
        { status: 400 }
      );
    }

    // Update fee with payment info
    await db
      .update(monthlyFees)
      .set({
        paymentMethod: paymentMethod || 'bkash',
        transactionId,
        paymentProofUrl,
        paymentSubmittedAt: new Date(),
        status: 'payment_submitted',
        updatedAt: new Date(),
      })
      .where(eq(monthlyFees.id, feeId));

    return NextResponse.json({
      success: true,
      message: 'Payment submitted for verification',
    });
  } catch (error) {
    console.error('Error submitting payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
