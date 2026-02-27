import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { paymentAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRBACContext } from "@/lib/rbac/middleware";

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

/**
 * GET /api/admin/courses/[courseId]/payment-accounts
 * Returns payment accounts assigned to this course (scope='course', scopeId=courseId)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const context = await getRBACContext();

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await hasPermission(context.userId, "COURSE", "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const accounts = await db
      .select()
      .from(paymentAccounts)
      .where(
        and(
          eq(paymentAccounts.scope, "course"),
          eq(paymentAccounts.scopeId, courseId),
          eq(paymentAccounts.isActive, true)
        )
      );

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching course payment accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment accounts" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/courses/[courseId]/payment-accounts
 * Syncs payment accounts for this course.
 * Body: { paymentAccountIds: string[] }
 *   - IDs of global/default payment accounts to clone for this course.
 *   - Empty array = use default fallback (deletes all course-specific accounts).
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { courseId } = await params;
    const context = await getRBACContext();

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canUpdate = await hasPermission(context.userId, "COURSE", "UPDATE");
    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { paymentAccountIds } = body as { paymentAccountIds: string[] };

    if (!Array.isArray(paymentAccountIds)) {
      return NextResponse.json(
        { error: "paymentAccountIds must be an array" },
        { status: 400 }
      );
    }

    // Delete existing course-scoped accounts for this course
    await db
      .delete(paymentAccounts)
      .where(
        and(
          eq(paymentAccounts.scope, "course"),
          eq(paymentAccounts.scopeId, courseId)
        )
      );

    // If empty array, just clear — course will use default fallback
    if (paymentAccountIds.length === 0) {
      return NextResponse.json({
        accounts: [],
        message: "Course will use default payment accounts",
      });
    }

    // Fetch the source accounts to clone
    const sourceAccounts = await db
      .select()
      .from(paymentAccounts)
      .where(eq(paymentAccounts.isActive, true));

    const sourceMap = new Map(sourceAccounts.map((a) => [a.id, a]));

    // Clone selected accounts with scope='course', scopeId=courseId
    const cloned = [];
    for (const id of paymentAccountIds) {
      const source = sourceMap.get(id);
      if (!source) continue;

      const [created] = await db
        .insert(paymentAccounts)
        .values({
          name: source.name,
          methodType: source.methodType,
          accountNumber: source.accountNumber,
          accountName: source.accountName,
          qrCodeUrl: source.qrCodeUrl,
          instructions: source.instructions,
          scope: "course",
          scopeId: courseId,
          scopeName: null, // Will be resolved by the public API if needed
          priority: source.priority,
          isActive: true,
          isDefault: source.isDefault,
          createdBy: context.userId,
        })
        .returning();

      cloned.push(created);
    }

    return NextResponse.json({
      accounts: cloned,
      message: `${cloned.length} payment account(s) assigned to course`,
    });
  } catch (error) {
    console.error("Error syncing course payment accounts:", error);
    return NextResponse.json(
      { error: "Failed to sync payment accounts" },
      { status: 500 }
    );
  }
}
