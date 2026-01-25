import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { paymentAccounts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

type PaymentAccountResponse = {
  id: string;
  name: string;
  methodType: string;
  accountNumber: string;
  accountName: string | null;
  qrCodeUrl: string | null;
  instructions: string | null;
  isDefault: boolean;
  priority: number;
};

/**
 * GET /api/payment-accounts
 * Public endpoint to get active payment accounts for a specific scope
 * 
 * Query params:
 * - scope: 'program' | 'course' | 'enrollment' | 'monthly_fee' | 'event'
 * - scopeId: ID of the specific program/course
 * 
 * Returns: The most appropriate payment accounts based on scope
 * Falls back to default accounts if no scope-specific accounts exist
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const scopeId = searchParams.get("scopeId");

    // First, try to get accounts for the specific scope
    let accounts: PaymentAccountResponse[] = [];

    if (scope && scopeId) {
      // Get scope-specific accounts
      accounts = await db
        .select({
          id: paymentAccounts.id,
          name: paymentAccounts.name,
          methodType: paymentAccounts.methodType,
          accountNumber: paymentAccounts.accountNumber,
          accountName: paymentAccounts.accountName,
          qrCodeUrl: paymentAccounts.qrCodeUrl,
          instructions: paymentAccounts.instructions,
          isDefault: paymentAccounts.isDefault,
          priority: paymentAccounts.priority,
        })
        .from(paymentAccounts)
        .where(
          and(
            eq(paymentAccounts.isActive, true),
            eq(paymentAccounts.scope, scope as any),
            eq(paymentAccounts.scopeId, scopeId)
          )
        )
        .orderBy(desc(paymentAccounts.isDefault), desc(paymentAccounts.priority));
    }

    // If no scope-specific accounts, try scope-level defaults (without scopeId)
    if (accounts.length === 0 && scope) {
      accounts = await db
        .select({
          id: paymentAccounts.id,
          name: paymentAccounts.name,
          methodType: paymentAccounts.methodType,
          accountNumber: paymentAccounts.accountNumber,
          accountName: paymentAccounts.accountName,
          qrCodeUrl: paymentAccounts.qrCodeUrl,
          instructions: paymentAccounts.instructions,
          isDefault: paymentAccounts.isDefault,
          priority: paymentAccounts.priority,
        })
        .from(paymentAccounts)
        .where(
          and(
            eq(paymentAccounts.isActive, true),
            eq(paymentAccounts.scope, scope as any),
            eq(paymentAccounts.scopeId, '')  // Empty scopeId means scope-level default
          )
        )
        .orderBy(desc(paymentAccounts.isDefault), desc(paymentAccounts.priority));
    }

    // Fall back to global defaults
    if (accounts.length === 0) {
      accounts = await db
        .select({
          id: paymentAccounts.id,
          name: paymentAccounts.name,
          methodType: paymentAccounts.methodType,
          accountNumber: paymentAccounts.accountNumber,
          accountName: paymentAccounts.accountName,
          qrCodeUrl: paymentAccounts.qrCodeUrl,
          instructions: paymentAccounts.instructions,
          isDefault: paymentAccounts.isDefault,
          priority: paymentAccounts.priority,
        })
        .from(paymentAccounts)
        .where(
          and(
            eq(paymentAccounts.isActive, true),
            eq(paymentAccounts.scope, 'default')
          )
        )
        .orderBy(desc(paymentAccounts.isDefault), desc(paymentAccounts.priority));
    }

    // Get the primary account (default or highest priority)
    const primaryAccount = accounts[0] || null;

    return NextResponse.json({
      accounts,
      primaryAccount,
      totalCount: accounts.length,
    });
  } catch (error) {
    console.error("Error fetching payment accounts:", error);
    return NextResponse.json({ error: "Failed to fetch payment accounts" }, { status: 500 });
  }
}
