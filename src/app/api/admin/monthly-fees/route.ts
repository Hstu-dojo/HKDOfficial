import { generateMonthlyFees } from "@/lib/billing/service";
import {
  billingPeriod,
  checkedStatus,
  effectiveStatus,
} from "@/lib/billing/policy";
import { billingErrorResponse, billingBody } from "@/lib/billing/http";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import {
  monthlyFees,
  courseEnrollments,
  members,
  courses,
  user,
} from "@/db/schema";
import { partners } from "@/db/schemas/partner";
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
    if (!(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const canRead = await hasPermission(context.userId, "MONTHLY_FEE", "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");
    const memberIdFilter = searchParams.get("memberId");
    const billingMonthFilter = searchParams.get("billingMonth");
    const enrollmentIdFilter = searchParams.get("enrollmentId");
    const partnerIdFilter = searchParams.get("partnerId");

    if (billingMonthFilter) billingPeriod(billingMonthFilter);
    checkedStatus(statusFilter);
    const conditions = [];

    if (memberIdFilter) {
      conditions.push(eq(monthlyFees.profileId, memberIdFilter));
    }

    if (billingMonthFilter) {
      conditions.push(eq(monthlyFees.billingMonth, billingMonthFilter));
    }

    if (enrollmentIdFilter) {
      conditions.push(eq(monthlyFees.enrollmentId, enrollmentIdFilter));
    }

    if (partnerIdFilter) {
      conditions.push(eq(courses.partnerId, partnerIdFilter));
    }

    const fees = await db
      .select({
        fee: monthlyFees,
        member: {
          id: members.id,
          fullNameEnglish: members.fullNameEnglish,
          fullNameBangla: members.fullNameBangla,
          email: members.email,
          memberNumber: members.memberNumber,
          phoneNumber: members.phoneNumber,
        },
        course: {
          id: courses.id,
          name: courses.name,
          partnerId: courses.partnerId,
        },
        partnerName: partners.name,
      })
      .from(monthlyFees)
      .leftJoin(members, eq(monthlyFees.profileId, members.id))
      .leftJoin(
        courseEnrollments,
        eq(monthlyFees.enrollmentId, courseEnrollments.id),
      )
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .leftJoin(partners, eq(courses.partnerId, partners.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(monthlyFees.dueDate));

    return NextResponse.json(
      fees
        .map((r) => ({
          ...r,
          fee: { ...r.fee, status: effectiveStatus(r.fee) },
        }))
        .filter((r) => !statusFilter || r.fee.status === statusFilter),
    );
  } catch (error) {
    return billingErrorResponse(error);
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
    if (!context)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!(await hasPermission(context.userId, "MONTHLY_FEE", "CREATE")))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { billingMonth, enrollmentId, partnerId } =
      await billingBody(request);
    return NextResponse.json(
      await generateMonthlyFees(
        billingMonth,
        { enrollmentId, partnerId },
        `user:${context.userId}`,
      ),
      { status: 201 },
    );
  } catch (error) {
    return billingErrorResponse(error);
  }
}
