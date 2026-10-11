import { BillingError, feeBalance, type FinancialFee } from "./policy";
export type FeeAction =
  | "submit_payment"
  | "verify_payment"
  | "reject_payment"
  | "waive"
  | "mark_overdue"
  | "mark_paid"
  | "mark_unpaid";
export const actionPermissions = {
  submit_payment: "MANAGE",
  verify_payment: "VERIFY",
  reject_payment: "VERIFY",
  waive: "MANAGE",
  mark_overdue: "MANAGE",
  mark_paid: "MANAGE",
  mark_unpaid: "MANAGE",
} as const;
export function transitionFee(
  fee: FinancialFee & { notes?: string | null },
  input: Record<string, unknown>,
  userId: string | null,
  now = new Date(),
) {
  const action = input.action as FeeAction;
  if (!Object.hasOwn(actionPermissions, action))
    throw new BillingError("Invalid action");
  const text = (key: string, required = false) => {
    const v = input[key];
    if (
      v !== undefined &&
      v !== null &&
      (typeof v !== "string" || v.length > 2000)
    )
      throw new BillingError(`Invalid ${key}`);
    const result = typeof v === "string" ? v.trim() : undefined;
    if (required && !result) throw new BillingError(`${key} is required`);
    return result;
  };
  const notes = text("notes");
  const editable = ["pending", "due", "overdue", "partial"];
  if (
    ["submit_payment", "mark_paid", "mark_overdue"].includes(action) &&
    !editable.includes(fee.status)
  )
    throw new BillingError("Fee cannot be changed in its current status", 409);
  const base = { updatedAt: now };
  switch (action) {
    case "submit_payment": {
      const method = text("paymentMethod") || "bkash";
      if (
        !["bkash", "nagad", "rocket", "upay", "bank_transfer", "cash"].includes(
          method,
        )
      )
        throw new BillingError("Invalid payment method");
      const proof = text("paymentProofUrl", true)!;
      try {
        const url = new URL(proof);
        if (url.protocol !== "https:" && url.protocol !== "http:")
          throw new Error();
      } catch {
        throw new BillingError("Invalid payment proof URL");
      }
      return {
        ...base,
        transactionId: text("transactionId", true),
        paymentProofUrl: proof,
        paymentMethod: method,
        paymentSubmittedAt: now,
        status: "payment_submitted" as const,
      };
    }
    case "verify_payment": {
      if (fee.status !== "payment_submitted")
        throw new BillingError("Payment is not awaiting verification", 409);
      // amountPaid is the cumulative verified total, never an unchecked client payment amount.
      const paid =
        input.amountPaid === undefined ? fee.amount : input.amountPaid;
      if (
        typeof paid !== "number" ||
        !Number.isSafeInteger(paid) ||
        paid <= (fee.amountPaid || 0) ||
        paid > fee.amount
      )
        throw new BillingError(
          "Verified total must increase the paid balance without exceeding the bill (integer paisa)",
        );
      return {
        ...base,
        amountPaid: paid,
        status: paid === fee.amount ? ("paid" as const) : ("partial" as const),
        paidAt: now,
        verifiedAt: now,
        verifiedBy: userId,
        verificationNotes: notes,
      };
    }
    case "reject_payment":
      if (fee.status !== "payment_submitted")
        throw new BillingError("Payment is not awaiting verification", 409);
      return {
        ...base,
        status:
          (fee.amountPaid || 0) > 0
            ? ("partial" as const)
            : fee.dueDate && new Date(fee.dueDate) < now
              ? ("overdue" as const)
              : ("due" as const),
        transactionId: null,
        paymentProofUrl: null,
        paymentSubmittedAt: null,
        paymentMethod: null,
        verificationNotes: text("notes", true),
      };
    case "mark_paid":
      return {
        ...base,
        status: "paid" as const,
        amountPaid: fee.amount,
        paidAt: now,
        paymentMethod: "cash",
        verifiedBy: userId,
        verifiedAt: now,
        verificationNotes: notes || "Cash payment recorded",
      };
    case "waive":
      if (["paid", "waived", "payment_submitted"].includes(fee.status))
        throw new BillingError(
          "Cannot waive a settled bill or payment awaiting review",
          409,
        );
      return {
        ...base,
        status: "waived" as const,
        waivedBy: userId,
        waivedAt: now,
        waiverReason: text("waiverReason", true),
      };
    case "mark_overdue":
      if (!fee.dueDate || new Date(fee.dueDate) >= now || feeBalance(fee) === 0)
        throw new BillingError("This bill is not overdue");
      return {
        ...base,
        status:
          (fee.amountPaid || 0) > 0
            ? ("partial" as const)
            : ("overdue" as const),
        notes: notes || fee.notes,
      };
    case "mark_unpaid":
      if (fee.status !== "paid")
        throw new BillingError("Only paid fees can be reversed", 409);
      return {
        ...base,
        status:
          fee.dueDate && new Date(fee.dueDate) < now
            ? ("overdue" as const)
            : ("pending" as const),
        amountPaid: 0,
        paidAt: null,
        verifiedAt: null,
        verifiedBy: null,
        transactionId: null,
        paymentProofUrl: null,
        paymentSubmittedAt: null,
        paymentMethod: null,
        verificationNotes: text("notes", true),
      };
  }
}
