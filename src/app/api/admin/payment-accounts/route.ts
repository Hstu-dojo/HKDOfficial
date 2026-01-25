import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { paymentAccounts, programs, courses } from "@/db/schema";
import { eq, and, or, desc, asc } from "drizzle-orm";
import { protectApiRoute } from "@/lib/rbac/middleware";

// GET /api/admin/payment-accounts - Get all payment accounts
export const GET = protectApiRoute("PAYMENT", "READ", async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const scopeId = searchParams.get("scopeId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query = db.select().from(paymentAccounts);

    // Build where conditions
    const conditions = [];
    
    if (scope) {
      conditions.push(eq(paymentAccounts.scope, scope as any));
    }
    
    if (scopeId) {
      conditions.push(eq(paymentAccounts.scopeId, scopeId));
    }
    
    if (activeOnly) {
      conditions.push(eq(paymentAccounts.isActive, true));
    }

    const accounts = await db
      .select()
      .from(paymentAccounts)
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
