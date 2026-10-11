/** All monetary values are integer paisa. Business dates use Bangladesh time. */
export class BillingError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const feeStatuses = [
  "pending",
  "due",
  "payment_submitted",
  "paid",
  "overdue",
  "waived",
  "partial",
] as const;
export type FeeStatus = (typeof feeStatuses)[number];
export function billingPeriod(value: unknown) {
  if (typeof value !== "string" || !/^(20\d{2})-(0[1-9]|1[0-2])$/.test(value))
    throw new BillingError("Use a valid billing month (YYYY-MM, 2000–2099)");
  const [year, month] = value.split("-").map(Number);
  return { value, year, month };
}
export function businessDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    month: `${get("year")}-${get("month")}`,
    day: Number(get("day")),
    date: `${get("year")}-${get("month")}-${get("day")}`,
  };
}
export function dueDateFor(month: string, dueDay = 15) {
  billingPeriod(month);
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 28)
    throw new BillingError("Payment due day must be 1–28");
  return new Date(
    `${month}-${String(dueDay).padStart(2, "0")}T23:59:59.999+06:00`,
  );
}
export type FinancialFee = {
  amount: number;
  amountPaid: number | null;
  status: string;
  dueDate?: Date | string;
  billingMonth?: string;
};
export function feeBalance(fee: FinancialFee) {
  return fee.status === "waived"
    ? 0
    : Math.max(0, fee.amount - (fee.amountPaid || 0));
}
export function effectiveStatus<T extends FinancialFee>(
  fee: T,
  now = new Date(),
): T["status"] {
  if (
    ["pending", "due", "overdue"].includes(fee.status) &&
    feeBalance(fee) > 0 &&
    fee.dueDate &&
    new Date(fee.dueDate) < now
  )
    return "overdue";
  return fee.status;
}
export function summarizeFees(fees: FinancialFee[], now = new Date()) {
  return fees.reduce(
    (s, f) => {
      const status = effectiveStatus(f, now);
      s.total++;
      if (status === "paid") s.paid++;
      if (status === "payment_submitted") s.submitted++;
      if (status === "overdue") s.overdue++;
      if (["pending", "due", "partial"].includes(status)) s.pending++;
      s.collected += f.amountPaid || 0;
      s.outstanding += feeBalance(f);
      s.totalAmount += f.status === "waived" ? f.amountPaid || 0 : f.amount;
      return s;
    },
    {
      total: 0,
      paid: 0,
      submitted: 0,
      overdue: 0,
      pending: 0,
      collected: 0,
      outstanding: 0,
      totalAmount: 0,
    },
  );
}
export function positivePage(
  value: string | null,
  fallback: number,
  max = Number.MAX_SAFE_INTEGER,
) {
  if (!value) return fallback;
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < 1 ||
    Number(value) > max
  )
    throw new BillingError("Invalid pagination");
  return Number(value);
}
export function checkedStatus(value: string | null) {
  if (value && !feeStatuses.includes(value as FeeStatus))
    throw new BillingError("Invalid fee status");
  return value as FeeStatus | null;
}
export function scheduledBillingDay(now = new Date()) {
  const date = businessDate(now);
  return {
    ...date,
    generate: date.day === 5,
    remind: date.day === 5 || date.day === 10,
  };
}
/** Convert user-entered major currency units without accepting fractional paisa. */
export function paisaFromInput(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim()))
    throw new BillingError(
      "Enter a positive amount with up to two decimal places",
    );
  const [whole, fraction = ""] = value.trim().split(".");
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result <= 0 || result > 2147483647)
    throw new BillingError("Amount is outside the supported range");
  return result;
}
