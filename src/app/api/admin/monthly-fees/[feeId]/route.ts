import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { monthlyFees, members, paymentReminders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRBACContext } from "@/lib/rbac/middleware";

interface RouteParams {
  params: Promise<{ feeId: string }>;
}

/**
 * @swagger
 * /api/admin/monthly-fees/{feeId}:
 *   get:
 *     summary: Get a specific monthly fee
 *     tags: [Monthly Fees]
 *     parameters:
 *       - in: path
 *         name: feeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Fee details
 *       404:
 *         description: Fee not found
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { feeId } = await params;
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await hasPermission(context.userId, "MONTHLY_FEE", "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [fee] = await db
      .select({
        fee: monthlyFees,
        member: {
          id: members.id,
          fullNameEnglish: members.fullNameEnglish,
          memberNumber: members.memberNumber,
          phoneNumber: members.phoneNumber,
          userId: members.userId,
        },
      })
      .from(monthlyFees)
      .leftJoin(members, eq(monthlyFees.memberId, members.id))
      .where(eq(monthlyFees.id, feeId));

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    // Check if user can view this fee
    const canManage = await hasPermission(context.userId, "MONTHLY_FEE", "MANAGE");
    if (!canManage && fee.member?.userId !== context.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get reminders
    const reminders = await db
      .select()
      .from(paymentReminders)
      .where(eq(paymentReminders.monthlyFeeId, feeId));

    return NextResponse.json({
      ...fee,
      reminders,
    });
  } catch (error) {
    console.error("Error fetching fee:", error);
    return NextResponse.json(
      { error: "Failed to fetch fee" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/monthly-fees/{feeId}:
 *   put:
 *     summary: Update monthly fee
 *     description: Submit payment, verify payment, or waive fee
 *     tags: [Monthly Fees]
 *     parameters:
 *       - in: path
 *         name: feeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [submit_payment, verify_payment, waive, mark_overdue]
 *               transactionId:
 *                 type: string
 *               paymentProofUrl:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *               waiverReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fee updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Fee not found
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { feeId } = await params;
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, transactionId, paymentProofUrl, paymentMethod, notes, waiverReason, amountPaid } = body;

    // Get existing fee
    const [fee] = await db
      .select({
        fee: monthlyFees,
        member: {
          id: members.id,
          userId: members.userId,
        },
      })
      .from(monthlyFees)
      .leftJoin(members, eq(monthlyFees.memberId, members.id))
      .where(eq(monthlyFees.id, feeId));

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    switch (action) {
      case "submit_payment": {
        // User submitting payment
        if (fee.member?.userId !== context.userId) {
          const canManage = await hasPermission(context.userId, "MONTHLY_FEE", "MANAGE");
          if (!canManage) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        }

        if (fee.fee.status === "paid" || fee.fee.status === "waived") {
          return NextResponse.json(
            { error: "This fee has already been paid or waived" },
            { status: 400 }
          );
        }

        if (!transactionId || !paymentProofUrl) {
          return NextResponse.json(
            { error: "Transaction ID and payment proof are required" },
            { status: 400 }
          );
        }

        const [updated] = await db
          .update(monthlyFees)
          .set({
            transactionId,
            paymentProofUrl,
            paymentMethod: paymentMethod || "bkash",
            paymentSubmittedAt: new Date(),
            status: "payment_submitted",
            updatedAt: new Date(),
          })
          .where(eq(monthlyFees.id, feeId))
          .returning();

        return NextResponse.json(updated);
      }

      case "verify_payment": {
        // Admin verifying payment
        const canVerify = await hasPermission(context.userId, "MONTHLY_FEE", "VERIFY");
        if (!canVerify) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (fee.fee.status !== "payment_submitted") {
          return NextResponse.json(
            { error: "Fee is not in payment submitted status" },
            { status: 400 }
          );
        }

        const paidAmount = amountPaid !== undefined ? amountPaid : fee.fee.amount;
        const isPaid = paidAmount >= fee.fee.amount;

        const [updated] = await db
          .update(monthlyFees)
          .set({
            amountPaid: paidAmount,
            verifiedBy: context.userId,
            verifiedAt: new Date(),
            verificationNotes: notes,
            paidAt: new Date(),
            status: isPaid ? "paid" : "partial",
            updatedAt: new Date(),
          })
          .where(eq(monthlyFees.id, feeId))
          .returning();

        return NextResponse.json(updated);
      }

      case "waive": {
        // Admin waiving fee
        const canManage = await hasPermission(context.userId, "MONTHLY_FEE", "MANAGE");
        if (!canManage) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (!waiverReason) {
          return NextResponse.json(
            { error: "Waiver reason is required" },
            { status: 400 }
          );
        }

        const [updated] = await db
          .update(monthlyFees)
          .set({
            waivedBy: context.userId,
            waivedAt: new Date(),
            waiverReason,
            status: "waived",
            updatedAt: new Date(),
          })
          .where(eq(monthlyFees.id, feeId))
          .returning();

        return NextResponse.json(updated);
      }

      case "mark_overdue": {
        // Admin marking fee as overdue
        const canManage = await hasPermission(context.userId, "MONTHLY_FEE", "MANAGE");
        if (!canManage) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (fee.fee.status === "paid" || fee.fee.status === "waived") {
          return NextResponse.json(
            { error: "Cannot mark paid or waived fee as overdue" },
            { status: 400 }
          );
        }

        const [updated] = await db
          .update(monthlyFees)
          .set({
            status: "overdue",
            notes: notes || fee.fee.notes,
            updatedAt: new Date(),
          })
          .where(eq(monthlyFees.id, feeId))
          .returning();

        return NextResponse.json(updated);
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating fee:", error);
    return NextResponse.json(
      { error: "Failed to update fee" },
      { status: 500 }
    );
  }
}
