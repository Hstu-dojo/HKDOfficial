"use client";

import MemberBillingReminders from "@/components/billing/MemberBillingReminders";
import { BillingReminders } from "@/components/billing/BillingReminders";
import { businessDate, paisaFromInput } from "@/lib/billing/policy";
import { PanelLoader } from "@/components/loading";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { apiJSON } from "../../_lib/api.client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Search,
  CheckCircle2,
  XCircle,
  Coins,
  CheckSquare,
} from "lucide-react";

type FeeRecord = {
  fee: {
    id: string;
    billingMonth: string;
    billingYear: number;
    amount: number;
    amountPaid: number | null;
    currency: string;
    dueDate: string;
    status: string;
    paymentMethod?: string | null;
    transactionId?: string | null;
    paymentProofUrl?: string | null;
    paymentSubmittedAt?: string | null;
    paidAt?: string | null;
    verificationNotes?: string | null;
  };
  member: {
    id: string;
    fullNameEnglish: string | null;
    fullNameBangla?: string | null;
    email: string | null;
    phoneNumber: string | null;
    memberNumber: string | null;
    userEmail?: string | null;
    userName?: string | null;
  };
  course: {
    id: string;
    name: string;
  } | null;
};

type FeesResponse = {
  summary: {
    total: number;
    pending: number;
    submitted: number;
    paid: number;
    overdue: number;
    collected: number;
    outstanding: number;
    totalAmount: number;
  };
  fees: FeeRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-muted text-foreground" },
  due: { label: "Due", color: "bg-yellow-100 text-yellow-700" },
  payment_submitted: {
    label: "Payment Submitted",
    color: "bg-blue-100 text-blue-700",
  },
  paid: { label: "Paid", color: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700" },
  waived: { label: "Waived", color: "bg-purple-100 text-purple-700" },
  partial: { label: "Partial", color: "bg-orange-100 text-orange-700" },
};

export default function MonthlyBilling() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fees, setFees] = React.useState<FeeRecord[]>([]);
  const [page, setPage] = React.useState(1);
  const [pagination, setPagination] = React.useState<
    FeesResponse["pagination"]
  >({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [stats, setStats] = React.useState<FeesResponse["summary"]>({
    total: 0,
    pending: 0,
    submitted: 0,
    paid: 0,
    overdue: 0,
    collected: 0,
    outstanding: 0,
    totalAmount: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = React.useState(
    searchParams?.get("status") || "",
  );
  const [monthFilter, setMonthFilter] = React.useState(
    searchParams?.get("billingMonth") || "",
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [balanceFilter, setBalanceFilter] = React.useState(
    searchParams?.get("balance") || "",
  );
  const requestVersion = React.useRef(0);

  // Generate modal
  const [generating, setGenerating] = React.useState(false);
  const [generateMonth, setGenerateMonth] = React.useState(
    businessDate().month,
  );

  // Detail modal
  const [selectedFee, setSelectedFee] = React.useState<FeeRecord | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchFees = React.useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (monthFilter) params.set("billingMonth", monthFilter);
      if (searchQuery) params.set("q", searchQuery);
      if (balanceFilter) params.set("balance", balanceFilter);
      const data = await apiJSON<FeesResponse>(
        `/api/partner-portal/monthly-fees?${params.toString()}`,
      );
      if (version !== requestVersion.current) return;
      setFees(data.fees || []);
      setStats(data.summary);
      setPagination(data.pagination);
    } catch (e) {
      if (version !== requestVersion.current) return;
      setFees([]);
      setError(e instanceof Error ? e.message : "Failed to load fees");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [page, statusFilter, monthFilter, searchQuery, balanceFilter]);

  React.useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  const handleGenerate = async () => {
    if (!generateMonth) return;
    setGenerating(true);
    try {
      const result = await apiJSON<{
        success: boolean;
        count: number;
        skipped: number;
        message: string;
      }>("/api/partner-portal/monthly-fees", {
        method: "POST",
        body: JSON.stringify({ billingMonth: generateMonth }),
      });
      alert(
        `${result.message}${result.skipped ? ` (${result.skipped} already existed)` : ""}`,
      );
      fetchFees();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleAction = async (
    feeId: string,
    action: string,
    extraData?: Record<string, string | number>,
  ) => {
    setActionLoading(true);
    try {
      await apiJSON(`/api/partner-portal/monthly-fees/${feeId}`, {
        method: "PATCH",
        body: JSON.stringify({ action, ...extraData }),
      });
      setSelectedFee(null);
      fetchFees();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const verifyPayment = (record: FeeRecord) => {
    const input = prompt(
      `Total verified paid amount (${record.fee.currency}), including previously verified payments:`,
      (record.fee.amount / 100).toFixed(2),
    );
    if (input === null) return;
    try {
      void handleAction(record.fee.id, "verify_payment", {
        amountPaid: paisaFromInput(input),
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Invalid amount");
    }
  };

  const fmtDate = (value: string | null | undefined) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  };

  const fmtAmount = (amount: number, currency: string) => {
    const value = typeof amount === "number" ? amount / 100 : 0;
    return `${value.toFixed(2)} ${currency || "BDT"}`;
  };

  const fmtMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-BD", { year: "numeric", month: "long" });
  };

  // Month options for filters
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(`${businessDate().month}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - i + 1); // Include next month too
    return date.toISOString().slice(0, 7);
  });

  return (
    <div className="portal-page space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Monthly Billing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and manage monthly fee billing for enrolled students.
          </p>
        </div>
      </div>

      <MemberBillingReminders />
      <BillingReminders
        endpoint="/api/partner-portal/monthly-fees/reminders"
        showHistory={false}
      />

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={balanceFilter === "outstanding"}
          onChange={(e) => {
            setBalanceFilter(e.target.checked ? "outstanding" : "");
            setPage(1);
          }}
        />{" "}
        Show outstanding balances only
      </label>

      {/* Generate Section */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Generate Monthly Bills
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="w-full space-y-1.5 sm:w-64">
            <Label htmlFor="generateMonth">Billing Month</Label>
            <input
              id="generateMonth"
              type="month"
              value={generateMonth}
              onChange={(e) => setGenerateMonth(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || !generateMonth}
            className="h-10 w-full sm:w-auto"
          >
            {generating ? "Generating…" : "Generate Bills"}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          This will create pending fee records for all active enrolled students
          who don&apos;t already have a bill for the selected month.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex flex-col justify-center rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Total (page)
          </p>
          <p className="mt-1 text-2xl font-bold">{fees.length}</p>
        </div>
        <div className="flex flex-col justify-center rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Pending/Due
          </p>
          <p className="text-yellow-600 dark:text-yellow-500 mt-1 text-2xl font-bold">
            {stats.pending}
          </p>
        </div>
        <div className="flex flex-col justify-center rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Awaiting Verif.
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-500">
            {stats.submitted}
          </p>
        </div>
        <div className="flex flex-col justify-center rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Paid</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-500">
            {stats.paid}
          </p>
        </div>
        <div className="flex flex-col justify-center rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-rose-600 dark:text-rose-500">
            {stats.overdue}
          </p>
        </div>
        <div className="flex flex-col justify-center rounded-xl border bg-card p-4 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Collected (BDT)
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-500">
            {fmtAmount(stats.collected, "BDT")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[180px] flex-1 space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              id="search"
              type="text"
              placeholder="Name, email, member #..."
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                setSearchQuery(e.target.value);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
        <div className="w-full space-y-1.5 sm:w-44">
          <Label htmlFor="monthFilter">Month</Label>
          <select
            id="monthFilter"
            value={monthFilter}
            onChange={(e) => {
              setPage(1);
              setMonthFilter(e.target.value);
            }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Months</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {fmtMonth(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full space-y-1.5 sm:w-44">
          <Label htmlFor="statusFilter">Status</Label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          variant="secondary"
          onClick={() => fetchFees()}
          className="h-10"
        >
          Apply Filters
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr className="text-muted-foreground">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    <PanelLoader size="sm" />
                  </td>
                </tr>
              ) : fees.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No fees found. Generate bills for a month to get started.
                  </td>
                </tr>
              ) : (
                fees.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.fee.status];
                  const isOverdue =
                    new Date(item.fee.dueDate) < new Date() &&
                    !["paid", "waived"].includes(item.fee.status);
                  return (
                    <tr
                      key={item.fee.id}
                      className={`cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/30 ${isOverdue ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}
                      onClick={() => setSelectedFee(item)}
                    >
                      <td className="px-4 py-3 text-left">
                        <div className="font-medium text-foreground">
                          {item.member?.fullNameEnglish ||
                            item.member?.fullNameBangla ||
                            item.member?.userName ||
                            "—"}
                        </div>
                        <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
                          {item.member?.memberNumber && (
                            <span>No: {item.member.memberNumber}</span>
                          )}
                          {(item.member?.email || item.member?.userEmail) && (
                            <span className="text-muted-foreground/85">
                              {item.member.email || item.member.userEmail}
                            </span>
                          )}
                          {item.member?.phoneNumber && (
                            <a
                              href={`tel:${item.member.phoneNumber}`}
                              className="inline-flex w-fit items-center gap-1 font-medium text-primary hover:text-primary/80 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.member.phoneNumber}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {item.course?.name || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {fmtMonth(item.fee.billingMonth)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {fmtAmount(item.fee.amount, item.fee.currency)}
                        {(item.fee.amountPaid || 0) > 0 &&
                          item.fee.status !== "paid" && (
                            <p className="mt-1 text-xs font-normal text-muted-foreground">
                              Paid{" "}
                              {fmtAmount(
                                item.fee.amountPaid || 0,
                                item.fee.currency,
                              )}{" "}
                              · Balance{" "}
                              {fmtAmount(
                                item.fee.status === "waived"
                                  ? 0
                                  : Math.max(
                                      0,
                                      item.fee.amount -
                                        (item.fee.amountPaid || 0),
                                    ),
                                item.fee.currency,
                              )}
                            </p>
                          )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fmtDate(item.fee.dueDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg?.color || "bg-muted text-foreground"}`}
                        >
                          {statusCfg?.label || item.fee.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className="flex justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.fee.status === "payment_submitted" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20"
                                disabled={actionLoading}
                                onClick={() => verifyPayment(item)}
                                title="Verify Payment"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20"
                                disabled={actionLoading}
                                onClick={() => {
                                  const notes = prompt("Rejection reason:");
                                  if (notes)
                                    handleAction(
                                      item.fee.id,
                                      "reject_payment",
                                      { notes },
                                    );
                                }}
                                title="Reject Payment"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {["pending", "due", "overdue", "partial"].includes(
                            item.fee.status,
                          ) && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/20"
                                disabled={actionLoading}
                                onClick={() =>
                                  handleAction(item.fee.id, "mark_paid")
                                }
                                title="Mark as Paid"
                              >
                                <CheckSquare className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-purple-600 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-900/20"
                                disabled={actionLoading}
                                onClick={() => {
                                  const reason = prompt("Waiver reason:");
                                  if (reason)
                                    handleAction(item.fee.id, "waive", {
                                      waiverReason: reason,
                                    });
                                }}
                                title="Waive Fee"
                              >
                                <Coins className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages || 1} —{" "}
          {pagination.total} total records
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={loading || page >= Math.max(1, pagination.totalPages)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedFee && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedFee(null)}
        >
          <div
            className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2 className="text-lg font-bold text-foreground">Fee Details</h2>
              <button
                onClick={() => setSelectedFee(null)}
                className="text-xl text-muted-foreground hover:text-foreground"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground">Student</p>
                  <p className="font-medium">
                    {selectedFee.member?.fullNameEnglish ||
                      selectedFee.member?.fullNameBangla ||
                      selectedFee.member?.userName ||
                      "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Member #</p>
                  <p className="font-medium">
                    {selectedFee.member?.memberNumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">
                    {selectedFee.member?.email ||
                      selectedFee.member?.userEmail ||
                      "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone Number</p>
                  {selectedFee.member?.phoneNumber ? (
                    <a
                      href={`tel:${selectedFee.member.phoneNumber}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {selectedFee.member.phoneNumber}
                    </a>
                  ) : (
                    <p className="font-medium">—</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">Course</p>
                  <p className="font-medium">
                    {selectedFee.course?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Billing Month</p>
                  <p className="font-medium">
                    {fmtMonth(selectedFee.fee.billingMonth)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    {fmtAmount(
                      selectedFee.fee.amount,
                      selectedFee.fee.currency,
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CONFIG[selectedFee.fee.status]?.color || "bg-muted"}`}
                  >
                    {STATUS_CONFIG[selectedFee.fee.status]?.label ||
                      selectedFee.fee.status}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {fmtDate(selectedFee.fee.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Paid At</p>
                  <p className="font-medium">
                    {fmtDate(selectedFee.fee.paidAt)}
                  </p>
                </div>
              </div>

              {/* Payment proof section */}
              {selectedFee.fee.status === "payment_submitted" && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-200">
                    Payment Proof
                  </h3>
                  <div className="space-y-2 text-blue-800 dark:text-blue-300">
                    <p>
                      <span className="font-medium">Method:</span>{" "}
                      {selectedFee.fee.paymentMethod || "—"}
                    </p>
                    <p>
                      <span className="font-medium">Transaction ID:</span>{" "}
                      {selectedFee.fee.transactionId || "—"}
                    </p>
                    <p>
                      <span className="font-medium">Submitted:</span>{" "}
                      {fmtDate(selectedFee.fee.paymentSubmittedAt)}
                    </p>
                    {selectedFee.fee.paymentProofUrl && (
                      <a
                        href={selectedFee.fee.paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-blue-600 underline"
                      >
                        View Screenshot →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {selectedFee.fee.verificationNotes && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedFee.fee.verificationNotes}</p>
                </div>
              )}
            </div>

            {/* Modal actions */}
            <div className="mt-6 flex justify-end gap-2">
              {selectedFee.fee.status === "payment_submitted" && (
                <>
                  <Button
                    variant="outline"
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                    disabled={actionLoading}
                    onClick={() => {
                      const notes = prompt("Rejection reason:");
                      if (notes)
                        handleAction(selectedFee.fee.id, "reject_payment", {
                          notes,
                        });
                    }}
                  >
                    Reject
                  </Button>
                  <Button
                    disabled={actionLoading}
                    onClick={() => verifyPayment(selectedFee)}
                  >
                    Verify & Approve
                  </Button>
                </>
              )}
              {["pending", "due", "overdue", "partial"].includes(
                selectedFee.fee.status,
              ) && (
                <>
                  <Button
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800 dark:border-purple-800/50 dark:text-purple-400 dark:hover:bg-purple-950/50 dark:hover:text-purple-300"
                    disabled={actionLoading}
                    onClick={() => {
                      const reason = prompt("Waiver reason:");
                      if (reason)
                        handleAction(selectedFee.fee.id, "waive", {
                          waiverReason: reason,
                        });
                    }}
                  >
                    Waive
                  </Button>
                  <Button
                    disabled={actionLoading}
                    onClick={() =>
                      handleAction(selectedFee.fee.id, "mark_paid")
                    }
                  >
                    Mark as Paid
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => setSelectedFee(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
