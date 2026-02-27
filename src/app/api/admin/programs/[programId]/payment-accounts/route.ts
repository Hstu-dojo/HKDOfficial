import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { paymentAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "@/lib/rbac/permissions";
import { getRBACContext } from "@/lib/rbac/middleware";

interface RouteParams {
  params: Promise<{ programId: string }>;
}

/**
 * GET /api/admin/programs/[programId]/payment-accounts
 * Returns payment accounts assigned to this program (scope='program', scopeId=programId)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { programId } = await params;
    const context = await getRBACContext();

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canRead = await hasPermission(context.userId, "PROGRAM", "READ");
    if (!canRead) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const accounts = await db
      .select()
      .from(paymentAccounts)
      .where(
        and(
          eq(paymentAccounts.scope, "program"),
          eq(paymentAccounts.scopeId, programId),
          eq(paymentAccounts.isActive, true)
        )
      );

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching program payment accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment accounts" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/programs/[programId]/payment-accounts
 * Syncs payment accounts for this program.
 * Body: { paymentAccountIds: string[] }
 *   - IDs of global/default payment accounts to clone for this program.
 *   - Empty array = use default fallback (deletes all program-specific accounts).
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { programId } = await params;
    const context = await getRBACContext();

    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const canUpdate = await hasPermission(context.userId, "PROGRAM", "UPDATE");
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

    // Delete existing program-scoped accounts for this program
    await db
      .delete(paymentAccounts)
      .where(
        and(
          eq(paymentAccounts.scope, "program"),
          eq(paymentAccounts.scopeId, programId)
        )
      );

    // If empty array, just clear — program will use default fallback
    if (paymentAccountIds.length === 0) {
      return NextResponse.json({
        accounts: [],
        message: "Program will use default payment accounts",
      });
    }

    // Fetch the source accounts to clone
    const sourceAccounts = await db
      .select()
      .from(paymentAccounts)
      .where(eq(paymentAccounts.isActive, true));

    const sourceMap = new Map(sourceAccounts.map((a) => [a.id, a]));

    // Clone selected accounts with scope='program', scopeId=programId
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
          scope: "program",
          scopeId: programId,
          scopeName: null,
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
      message: `${cloned.length} payment account(s) assigned to program`,
    });
  } catch (error) {
    console.error("Error syncing program payment accounts:", error);
    return NextResponse.json(
      { error: "Failed to sync payment accounts" },
      { status: 500 }
    );
  }
}
