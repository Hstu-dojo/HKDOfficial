import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { monthlyFees, courseEnrollments, members, courses, user } from "@/db/schema";
import { eq, desc, and, or, gte, lte, sql } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRBACContext } from "@/lib/rbac/middleware";

/**
 * @swagger
 * /api/admin/monthly-fees:
 *   get:
 *     summary: Get monthly fees
 *     description: Retrieve all monthly fee records with filtering
 *     tags: [Monthly Fees]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, due, payment_submitted, paid, overdue, waived, partial]
 *       - in: query
 *         name: memberId
 *         schema:
 *           type: string
 *       - in: query
 *         name: billingMonth
 *         schema:
 *           type: string
 *         description: Format YYYY-MM
 *     responses:
 *       200:
 *         description: List of monthly fees
 */
export async function GET(request: NextRequest) {
  try {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await hasPermission(context.userId, "MONTHLY_FEE", "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");
    const memberIdFilter = searchParams.get("memberId");
    const billingMonthFilter = searchParams.get("billingMonth");
    const enrollmentIdFilter = searchParams.get("enrollmentId");

    const conditions = [];

    // Check if user can see all fees or just their own
    const canManage = await hasPermission(context.userId, "MONTHLY_FEE", "MANAGE");
    const canVerify = await hasPermission(context.userId, "MONTHLY_FEE", "VERIFY");
    
    if (!canManage && !canVerify) {
      // Get user's member profile
      const [memberProfile] = await db
        .select()
        .from(members)
        .where(eq(members.userId, context.userId));

      if (memberProfile) {
        conditions.push(eq(monthlyFees.memberId, memberProfile.id));
      } else {
        // User has no member profile, return empty
        return NextResponse.json([]);
      }
    }

    if (statusFilter) {
      conditions.push(eq(monthlyFees.status, statusFilter as typeof monthlyFees.status.enumValues[number]));
    }
    
    if (memberIdFilter) {
      conditions.push(eq(monthlyFees.memberId, memberIdFilter));
    }

    if (billingMonthFilter) {
      conditions.push(eq(monthlyFees.billingMonth, billingMonthFilter));
    }

    if (enrollmentIdFilter) {
      conditions.push(eq(monthlyFees.enrollmentId, enrollmentIdFilter));
    }

    const fees = await db
      .select({
        fee: monthlyFees,
        member: {
          id: members.id,
          fullNameEnglish: members.fullNameEnglish,
          memberNumber: members.memberNumber,
          phoneNumber: members.phoneNumber,
        },
        enrollment: {
          id: courseEnrollments.id,
          courseId: courseEnrollments.courseId,
        },
      })
      .from(monthlyFees)
      .leftJoin(members, eq(monthlyFees.memberId, members.id))
      .leftJoin(courseEnrollments, eq(monthlyFees.enrollmentId, courseEnrollments.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(monthlyFees.dueDate));

    return NextResponse.json(fees);
  } catch (error) {
    console.error("Error fetching monthly fees:", error);
    return NextResponse.json(
      { error: "Failed to fetch monthly fees" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/admin/monthly-fees:
 *   post:
 *     summary: Generate monthly fees
 *     description: Generate monthly fee records for all active enrollments
 *     tags: [Monthly Fees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - billingMonth
 *             properties:
 *               billingMonth:
 *                 type: string
 *                 description: Format YYYY-MM
 *               enrollmentId:
 *                 type: string
 *                 description: Generate for specific enrollment only
 *     responses:
 *       201:
 *         description: Fees generated successfully
 */
export async function POST(request: NextRequest) {
  try {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canCreate = await hasPermission(context.userId, "MONTHLY_FEE", "CREATE");
    if (!canCreate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { billingMonth, enrollmentId } = body;

    if (!billingMonth) {
      return NextResponse.json(
        { error: "Billing month is required (format: YYYY-MM)" },
        { status: 400 }
      );
    }

    // Validate billing month format
    const monthMatch = billingMonth.match(/^(\d{4})-(\d{2})$/);
    if (!monthMatch) {
      return NextResponse.json(
        { error: "Invalid billing month format. Use YYYY-MM" },
        { status: 400 }
      );
    }

    const billingYear = parseInt(monthMatch[1]);
    const monthNum = parseInt(monthMatch[2]);
    
    // Calculate due date (10th of the billing month)
    const dueDate = new Date(billingYear, monthNum - 1, 10);

    // Get active enrollments
    const conditions = [eq(courseEnrollments.isActive, true)];
    if (enrollmentId) {
      conditions.push(eq(courseEnrollments.id, enrollmentId));
    }

    const activeEnrollments = await db
      .select()
      .from(courseEnrollments)
      .where(and(...conditions));

    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
    };

    for (const enrollment of activeEnrollments) {
      try {
        // Check if fee already exists for this month
        const [existingFee] = await db
          .select()
          .from(monthlyFees)
          .where(
            and(
              eq(monthlyFees.enrollmentId, enrollment.id),
              eq(monthlyFees.billingMonth, billingMonth)
            )
          );

        if (existingFee) {
          results.skipped++;
          continue;
        }

        // Create new fee record
        await db.insert(monthlyFees).values({
          enrollmentId: enrollment.id,
          memberId: enrollment.memberId,
          billingMonth,
          billingYear,
          amount: enrollment.monthlyFee,
          currency: enrollment.currency,
          dueDate,
          status: "pending",
        });

        results.created++;
      } catch (error) {
        console.error(`Error creating fee for enrollment ${enrollment.id}:`, error);
        results.errors++;
      }
    }

    return NextResponse.json(
      {
        message: `Generated ${results.created} fee records, skipped ${results.skipped}, errors ${results.errors}`,
        ...results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error generating monthly fees:", error);
    return NextResponse.json(
      { error: "Failed to generate monthly fees" },
      { status: 500 }
    );
  }
}
