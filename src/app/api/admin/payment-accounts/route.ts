import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { paymentAccounts, programs, courses } from "@/db/schema";
import { partners } from "@/db/schemas/partner";
import { eq, and, or, desc, asc, isNull } from "drizzle-orm";
import { protectApiRoute } from "@/lib/rbac/middleware";

// GET /api/admin/payment-accounts - Get all payment accounts
export const GET = protectApiRoute("PAYMENT", "READ", async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const scopeId = searchParams.get("scopeId");
    const partnerId = searchParams.get("partnerId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    // Build where conditions
    const conditions = [];
    
    if (scope) {
      conditions.push(eq(paymentAccounts.scope, scope as any));
    }
    
    if (scopeId) {
      conditions.push(eq(paymentAccounts.scopeId, scopeId));
    }

    if (partnerId === 'global') {
      conditions.push(isNull(paymentAccounts.partnerId));
    } else if (partnerId) {
      conditions.push(eq(paymentAccounts.partnerId, partnerId));
    }
    
    if (activeOnly) {
      conditions.push(eq(paymentAccounts.isActive, true));
    }

    const accounts = await db
      .select({
        account: paymentAccounts,
        partnerName: partners.name,
      })
      .from(paymentAccounts)
      .leftJoin(partners, eq(paymentAccounts.partnerId, partners.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(paymentAccounts.isDefault), desc(paymentAccounts.priority), asc(paymentAccounts.createdAt));

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error fetching payment accounts:", error);
    return NextResponse.json({ error: "Failed to fetch payment accounts" }, { status: 500 });
  }
});

// POST /api/admin/payment-accounts - Create a new payment account
export const POST = protectApiRoute("PAYMENT", "CREATE", async (request, context) => {
  try {
    const body = await request.json();
    const {
      name,
      methodType,
      accountNumber,
      accountName,
      qrCodeUrl,
      instructions,
      scope,
      scopeId,
      scopeName,
      partnerId,
      priority,
      isDefault,
    } = body;

    // Validation
    if (!name || !methodType || !accountNumber) {
      return NextResponse.json(
        { error: "Name, method type, and account number are required" },
        { status: 400 }
      );
    }

    // If this is being set as default, unset other defaults for the same scope
    if (isDefault) {
      await db
        .update(paymentAccounts)
        .set({ isDefault: false })
        .where(
          and(
            eq(paymentAccounts.scope, scope || 'default'),
            scopeId ? eq(paymentAccounts.scopeId, scopeId) : undefined
          )
        );
    }

    // Get scopeName from the referenced entity if not provided
    let resolvedScopeName = scopeName;
    if (!resolvedScopeName && scopeId) {
      if (scope === 'program') {
        const program = await db.select({ title: programs.title }).from(programs).where(eq(programs.id, scopeId)).limit(1);
        resolvedScopeName = program[0]?.title;
      } else if (scope === 'course') {
        const course = await db.select({ name: courses.name }).from(courses).where(eq(courses.id, scopeId)).limit(1);
        resolvedScopeName = course[0]?.name;
      }
    }

    const [account] = await db
      .insert(paymentAccounts)
      .values({
        name,
        methodType,
        accountNumber,
        accountName,
        qrCodeUrl,
        instructions,
        scope: scope || 'default',
        scopeId: scopeId || null,
        scopeName: resolvedScopeName || null,
        partnerId: partnerId || null,
        priority: priority || 0,
        isDefault: isDefault || false,
        isActive: true,
        createdBy: context.userId,
      })
      .returning();

    return NextResponse.json({ account, message: "Payment account created successfully" });
  } catch (error) {
    console.error("Error creating payment account:", error);
    return NextResponse.json({ error: "Failed to create payment account" }, { status: 500 });
  }
});

// PUT /api/admin/payment-accounts - Update a payment account
export const PUT = protectApiRoute("PAYMENT", "UPDATE", async (request, context) => {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const allowedFields = [
      'partnerId', 'name', 'methodType', 'accountNumber', 'accountName',
      'qrCodeUrl', 'instructions', 'scope', 'scopeId', 'scopeName',
      'priority', 'isDefault', 'isActive',
    ];
    const cleanUpdates: Record<string, any> = { updatedAt: new Date(), updatedBy: context.userId };
    for (const key of allowedFields) {
      if (key in updates) {
        cleanUpdates[key] = updates[key];
      }
    }

    const [updated] = await db
      .update(paymentAccounts)
      .set(cleanUpdates)
      .where(eq(paymentAccounts.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, account: updated });
  } catch (error) {
    console.error('Error updating payment account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
});

// DELETE /api/admin/payment-accounts - Delete a payment account
export const DELETE = protectApiRoute("PAYMENT", "DELETE", async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const [deleted] = await db
      .delete(paymentAccounts)
      .where(eq(paymentAccounts.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
});
