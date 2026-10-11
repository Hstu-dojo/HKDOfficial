import "server-only";
import { db } from "@/lib/connect-db";
import {
  partners,
  partnerBills,
  partnerBillEvents,
} from "@/db/schemas/partner";
import { and, eq, desc, sql } from "drizzle-orm";
import {
  BillingError,
  billingPeriod,
  dueDateFor,
  positivePage,
} from "./policy";
export const invoiceStatus = sql`CASE WHEN ${partnerBills.status} = 'pending' AND ${partnerBills.dueDate} < NOW() THEN 'overdue' ELSE ${partnerBills.status} END`;
export async function listInvoices(
  params: URLSearchParams,
  partnerId?: string,
) {
  const page = positivePage(params.get("page"), 1),
    limit = positivePage(params.get("limit"), 20, 100),
    status = params.get("status");
  if (status && !["pending", "paid", "overdue", "cancelled"].includes(status))
    throw new BillingError("Invalid invoice status");
  const conditions = and(
    partnerId ? eq(partnerBills.partnerId, partnerId) : undefined,
    status ? sql`${invoiceStatus} = ${status}` : undefined,
  );
  const [bills, [total]] = await Promise.all([
    db
      .select()
      .from(partnerBills)
      .where(conditions)
      .orderBy(
        desc(partnerBills.year),
        desc(partnerBills.month),
        desc(partnerBills.createdAt),
        partnerBills.id,
      )
      .limit(limit)
      .offset((page - 1) * limit),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(partnerBills)
      .where(conditions),
  ]);
  return {
    bills: bills.map((b) => ({
      ...b,
      status:
        b.status === "pending" && b.dueDate && b.dueDate < new Date()
          ? "overdue"
          : b.status,
    })),
    pagination: {
      page,
      limit,
      total: total.total,
      totalPages: Math.ceil(total.total / limit),
    },
  };
}
export async function createInvoice(
  body: Record<string, unknown>,
  userId: string,
) {
  const { year, month, value } = billingPeriod(body.billingMonth);
  if (typeof body.partnerId !== "string" || !body.partnerId)
    throw new BillingError("Select an organization");
  if (
    typeof body.amount !== "number" ||
    !Number.isSafeInteger(body.amount) ||
    body.amount <= 0 ||
    body.amount > 2147483647
  )
    throw new BillingError(
      "Invoice amount must be a positive integer in paisa",
    );
  const currency = typeof body.currency === "string" ? body.currency : "BDT";
  if (!/^[A-Z]{3}$/.test(currency)) throw new BillingError("Invalid currency");
  if (
    typeof body.description !== "string" ||
    !body.description.trim() ||
    body.description.length > 2000
  )
    throw new BillingError("Provide an invoice description");
  if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id))
    throw new BillingError("Invalid invoice request ID");
  let dueDate = dueDateFor(value);
  if (body.dueDate !== undefined) {
    if (
      typeof body.dueDate !== "string" ||
      !/^20\d{2}-\d{2}-\d{2}$/.test(body.dueDate)
    )
      throw new BillingError("Invalid due date");
    const test = new Date(`${body.dueDate}T12:00:00+06:00`);
    if (
      !Number.isFinite(test.getTime()) ||
      test.toISOString().slice(0, 10) !== body.dueDate
    )
      throw new BillingError("Invalid due date");
    dueDate = new Date(`${body.dueDate}T23:59:59.999+06:00`);
  }
  return db.transaction(async (tx) => {
    const [partner] = await tx
      .select()
      .from(partners)
      .where(eq(partners.id, body.partnerId as string))
      .limit(1);
    if (!partner || !partner.isActive)
      throw new BillingError("Organization is inactive or not found", 404);
    const [bill] = await tx
      .insert(partnerBills)
      .values({
        id: body.id as string,
        partnerId: partner.id,
        month,
        year,
        amount: body.amount as number,
        currency,
        description: (body.description as string).trim(),
        dueDate,
        generatedBy: userId,
      })
      .onConflictDoNothing({ target: partnerBills.id })
      .returning();
    if (!bill)
      throw new BillingError(
        "This invoice request has already been recorded",
        409,
      );
    await tx.insert(partnerBillEvents).values({
      billId: bill.id,
      actor: `user:${userId}`,
      action: "create",
      previous: {},
      next: { amount: bill.amount, currency, billingMonth: value },
    });
    return bill;
  });
}
export async function changeInvoice(
  id: string,
  action: string,
  notes: unknown,
  userId: string,
) {
  if (!["mark_paid", "cancel"].includes(action))
    throw new BillingError("Invalid invoice action");
  if (typeof notes !== "string" || !notes.trim() || notes.length > 2000)
    throw new BillingError(
      "Provide a payment reference or cancellation reason",
    );
  return db.transaction(async (tx) => {
    const [bill] = await tx
      .select()
      .from(partnerBills)
      .where(eq(partnerBills.id, id))
      .for("update");
    if (!bill) throw new BillingError("Invoice not found", 404);
    if (!["pending", "overdue"].includes(bill.status))
      throw new BillingError(
        "This invoice is already settled or cancelled",
        409,
      );
    const next = {
      status: action === "mark_paid" ? "paid" : "cancelled",
      paidAt: action === "mark_paid" ? new Date() : null,
      verifiedBy: userId,
      updatedAt: new Date(),
    };
    const [updated] = await tx
      .update(partnerBills)
      .set(next)
      .where(eq(partnerBills.id, id))
      .returning();
    await tx.insert(partnerBillEvents).values({
      billId: id,
      actor: `user:${userId}`,
      action,
      previous: { status: bill.status },
      next: { ...next, notes: notes.trim() },
    });
    return updated;
  });
}
