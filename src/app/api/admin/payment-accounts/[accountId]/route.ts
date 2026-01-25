import { NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { paymentAccounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { protectApiRoute } from "@/lib/rbac/middleware";
import type { RBACContext } from "@/lib/rbac/types";

type RouteContext = { params: Promise<{ accountId: string }> };

// GET /api/admin/payment-accounts/[accountId] - Get a specific payment account
export const GET = (request: Request, routeContext: RouteContext) => 
  protectApiRoute("PAYMENT", "READ", async (
    _req: Request,
    rbacContext: RBACContext
  ) => {
    try {
      const { accountId } = await routeContext.params;
      
      const [account] = await db
        .select()
        .from(paymentAccounts)
        .where(eq(paymentAccounts.id, accountId))
        .limit(1);

      if (!account) {
        return NextResponse.json({ error: "Payment account not found" }, { status: 404 });
      }

      return NextResponse.json({ account });
    } catch (error) {
      console.error("Error fetching payment account:", error);
      return NextResponse.json({ error: "Failed to fetch payment account" }, { status: 500 });
    }
  })(request);

// PUT /api/admin/payment-accounts/[accountId] - Update a payment account
export const PUT = (request: Request, routeContext: RouteContext) => 
  protectApiRoute("PAYMENT", "UPDATE", async (
    req: Request,
    rbacContext: RBACContext
  ) => {
    try {
      const { accountId } = await routeContext.params;
      const body = await req.json();
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
      isActive,
    } = body;

    // Check if account exists
    const [existing] = await db
      .select()
      .from(paymentAccounts)
      .where(eq(paymentAccounts.id, accountId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Payment account not found" }, { status: 404 });
    }

    // If this is being set as default, unset other defaults for the same scope
    if (isDefault && !existing.isDefault) {
      await db
        .update(paymentAccounts)
        .set({ isDefault: false })
        .where(
          and(
            eq(paymentAccounts.scope, scope || existing.scope),
            scopeId ? eq(paymentAccounts.scopeId, scopeId) : undefined
          )
        );
    }

    const [account] = await db
      .update(paymentAccounts)
      .set({
        name: name ?? existing.name,
        methodType: methodType ?? existing.methodType,
        accountNumber: accountNumber ?? existing.accountNumber,
        accountName: accountName ?? existing.accountName,
        qrCodeUrl: qrCodeUrl ?? existing.qrCodeUrl,
        instructions: instructions ?? existing.instructions,
        scope: scope ?? existing.scope,
        scopeId: scopeId ?? existing.scopeId,
        scopeName: scopeName ?? existing.scopeName,
        priority: priority ?? existing.priority,
        isDefault: isDefault ?? existing.isDefault,
        isActive: isActive ?? existing.isActive,
        updatedBy: rbacContext.userId,
        updatedAt: new Date(),
      })
      .where(eq(paymentAccounts.id, accountId))
      .returning();

      return NextResponse.json({ account, message: "Payment account updated successfully" });
    } catch (error) {
      console.error("Error updating payment account:", error);
      return NextResponse.json({ error: "Failed to update payment account" }, { status: 500 });
    }
  })(request);

// DELETE /api/admin/payment-accounts/[accountId] - Delete a payment account
export const DELETE = (request: Request, routeContext: RouteContext) => 
  protectApiRoute("PAYMENT", "DELETE", async (
    _req: Request,
    _rbacContext: RBACContext
  ) => {
    try {
      const { accountId } = await routeContext.params;
    
      const [deleted] = await db
        .delete(paymentAccounts)
        .where(eq(paymentAccounts.id, accountId))
        .returning();

      if (!deleted) {
        return NextResponse.json({ error: "Payment account not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Payment account deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment account:", error);
      return NextResponse.json({ error: "Failed to delete payment account" }, { status: 500 });
    }
  })(request);
