"use client";

import { PanelLoader } from "@/components/loading";

import { useState, useEffect, useCallback } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  BanknotesIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface MonthlyFee {
  fee: {
    id: string;
    profileId: string;
    enrollmentId: string;
    billingMonth: string;
    billingYear: number;
    amount: number;
    amountPaid: number;
    currency: string;
    dueDate: string;
    status: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentProofUrl?: string;
    paymentSubmittedAt?: string;
    paidAt?: string;
    createdAt: string;
  };
  member: {
    id: string;
    fullNameEnglish: string;
    fullNameBangla?: string;
    email?: string;
    phoneNumber?: string;
    memberNumber?: string;
  } | null;
  course: {
    id: string;
    name: string;
    partnerId?: string;
  } | null;
  partnerName?: string;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: "Pending",
    color: "bg-muted dark:bg-gray-700 text-foreground dark:text-gray-300",
    icon: ClockIcon,
  },
  due: {
    label: "Due",
    color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700",
    icon: ClockIcon,
  },
  payment_submitted: {
    label: "Payment Submitted",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    icon: BanknotesIcon,
  },
  paid: {
    label: "Paid",
    color: "bg-green-100 dark:bg-green-900/30 text-green-700",
    icon: CheckCircleIcon,
  },
  overdue: {
    label: "Overdue",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700",
    icon: ExclamationTriangleIcon,
  },
  waived: {
    label: "Waived",
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700",
    icon: CheckCircleIcon,
  },
  partial: {
    label: "Partial",
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700",
    icon: BanknotesIcon,
  },
};

export default function MonthlyFeesManagement() {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [fees, setFees] = useState<MonthlyFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerFilter, setPartnerFilter] = useState<string>("");
  const [partnersList, setPartnersList] = useState<
    { id: string; name: string }[]
  >([]);

  const canVerify = hasPermission("MONTHLY_FEE", "VERIFY");

  // Fetch partners list for the filter
  useEffect(() => {
    fetch("/api/admin/partners")
      .then((res) => (res.ok ? res.json() : { partners: [] }))
      .then((data) => setPartnersList(data.partners || data || []))
      .catch(() => {});
  }, []);

  const fetchFees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (monthFilter) params.set("billingMonth", monthFilter);
      if (partnerFilter) params.set("partnerId", partnerFilter);

      const url = `/api/admin/monthly-fees?${params.toString()}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch monthly fees");
      const data = await response.json();
      setFees(data);
    } catch (error) {
      toast.error("Failed to load monthly fees");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, monthFilter, partnerFilter]);

  useEffect(() => {
    if (!rbacLoading) {
      fetchFees();
    }
  }, [rbacLoading, fetchFees]);

  const handleVerifyPayment = async (feeId: string) => {
    try {
      const response = await fetch(`/api/admin/monthly-fees/${feeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_payment" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Verification failed");
      }

      toast.success("Payment verified successfully");
      fetchFees();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Verification failed",
      );
    }
  };

  const handleWaiveFee = async (feeId: string) => {
    const reason = prompt("Enter waiver reason:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/monthly-fees/${feeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "waive", waiverReason: reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Waiver failed");
      }

      toast.success("Fee waived successfully");
      fetchFees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Waiver failed");
    }
  };

  const handleTogglePaid = async (feeId: string, currentStatus: string) => {
    const newAction = currentStatus === "paid" ? "mark_unpaid" : "mark_paid";
    try {
      const response = await fetch(`/api/admin/monthly-fees/${feeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: newAction }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Update failed");
      }

      toast.success(
        `Fee ${newAction === "mark_paid" ? "marked as paid" : "reverted to pending"}`,
      );
      fetchFees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const handleGenerateMonthlyFees = async () => {
    const month = prompt(
      "Enter billing month (YYYY-MM):",
      new Date().toISOString().slice(0, 7),
    );
    if (!month) return;

    try {
      const response = await fetch("/api/admin/monthly-fees/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingMonth: month }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Generation failed");
      }

      const result = await response.json();
      toast.success(`Generated ${result.count} monthly fee records`);
      fetchFees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed");
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-BD", { year: "numeric", month: "long" });
  };

  // Filter by search
  const filteredFees = fees.filter((f) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      f.member?.fullNameEnglish?.toLowerCase().includes(search) ||
      f.member?.email?.toLowerCase().includes(search) ||
      f.course?.name?.toLowerCase().includes(search)
    );
  });

  // Stats
  const stats = {
    total: fees.length,
    pending: fees.filter(
      (f) => f.fee.status === "pending" || f.fee.status === "due",
    ).length,
    payment_submitted: fees.filter((f) => f.fee.status === "payment_submitted")
      .length,
    paid: fees.filter((f) => f.fee.status === "paid").length,
    overdue: fees.filter((f) => f.fee.status === "overdue").length,
    totalAmount: fees.reduce((sum, f) => sum + f.fee.amount, 0),
    collectedAmount: fees
      .filter((f) => f.fee.status === "paid")
      .reduce((sum, f) => sum + (f.fee.amountPaid || 0), 0),
  };

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = date.toISOString().slice(0, 7);
    return { value, label: formatMonth(value) };
  });

  if (rbacLoading) {
    return <PanelLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            Monthly Fees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground dark:text-gray-400">
            Track and manage student monthly payments
          </p>
        </div>
        <button
          onClick={handleGenerateMonthlyFees}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          <PlusIcon className="h-5 w-5" />
          Generate Monthly Fees
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <div className="rounded-lg border bg-white p-4 dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Total Bills
          </p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Pending/Due
          </p>
          <p className="text-yellow-600 dark:text-yellow-400 text-2xl font-semibold">
            {stats.pending}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Awaiting Verification
          </p>
          <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
            {stats.payment_submitted}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Paid
          </p>
          <p className="text-green-600 dark:text-green-400 text-2xl font-semibold">
            {stats.paid}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Overdue
          </p>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {stats.overdue}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Collected
          </p>
          <p className="text-green-600 dark:text-green-400 text-2xl font-semibold">
            {formatCurrency(stats.collectedAmount, "BDT")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-white p-4 dark:bg-card">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <span className="text-sm font-medium text-foreground dark:text-gray-300">
            Filters:
          </span>
        </div>

        <div className="min-w-[200px] flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border py-2 pl-10 pr-4 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 sm:w-auto"
        >
          <option value="">All Months</option>
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={partnerFilter}
          onChange={(e) => setPartnerFilter(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 sm:w-auto"
        >
          <option value="">All Organizations</option>
          {partnersList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-blue-500 sm:w-auto"
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
      </div>

      {/* Fees Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="py-12 text-center">
            <BanknotesIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-foreground dark:text-gray-100">
              No monthly fees found
            </h3>
            <p className="mt-1 text-sm text-muted-foreground dark:text-gray-400">
              Try adjusting your filters or generate fees for a new month.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-muted dark:bg-card/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                    Course / Org
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-card">
                {filteredFees.map((item) => {
                  const status = STATUS_CONFIG[item.fee.status];
                  const StatusIcon = status?.icon || ClockIcon;
                  const isOverdue =
                    new Date(item.fee.dueDate) < new Date() &&
                    !["paid", "waived"].includes(item.fee.status);

                  return (
                    <tr
                      key={item.fee.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${isOverdue ? "bg-red-50 dark:bg-red-900/20" : ""}`}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                            <UserIcon className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-foreground dark:text-gray-100">
                              {item.member?.fullNameEnglish || "Unknown"}
                            </div>
                            <div className="text-xs text-muted-foreground dark:text-gray-400">
                              {item.member?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-foreground dark:text-gray-100">
                          {item.course?.name || "Unknown"}
                        </div>
                        {item.partnerName && (
                          <div className="text-xs text-muted-foreground dark:text-gray-400">
                            {item.partnerName}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center text-sm text-foreground dark:text-gray-100">
                          <CalendarIcon className="mr-1 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {formatMonth(item.fee.billingMonth)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-foreground dark:text-gray-100">
                          {formatCurrency(item.fee.amount, item.fee.currency)}
                        </div>
                        {(item.fee.amountPaid ?? 0) > 0 &&
                          (item.fee.amountPaid ?? 0) < item.fee.amount && (
                            <div className="text-green-600 dark:text-green-400 text-xs">
                              Paid:{" "}
                              {formatCurrency(
                                item.fee.amountPaid ?? 0,
                                item.fee.currency,
                              )}
                            </div>
                          )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground dark:text-gray-400">
                        {formatDate(item.fee.dueDate)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status?.color}`}
                        >
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {status?.label || item.fee.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {item.fee.status === "payment_submitted" &&
                            canVerify && (
                              <button
                                onClick={() => handleVerifyPayment(item.fee.id)}
                                className="bg-green-100 dark:bg-green-900/30 text-green-700 hover:bg-green-200 rounded px-2 py-1 text-xs"
                              >
                                Verify
                              </button>
                            )}
                          {["pending", "due", "overdue"].includes(
                            item.fee.status,
                          ) &&
                            canVerify && (
                              <>
                                <button
                                  onClick={() =>
                                    handleTogglePaid(
                                      item.fee.id,
                                      item.fee.status,
                                    )
                                  }
                                  className="bg-green-100 dark:bg-green-900/30 text-green-700 hover:bg-green-200 rounded px-2 py-1 text-xs"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => handleWaiveFee(item.fee.id)}
                                  className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30"
                                >
                                  Waive
                                </button>
                              </>
                            )}
                          {item.fee.status === "paid" && canVerify && (
                            <button
                              onClick={() =>
                                handleTogglePaid(item.fee.id, item.fee.status)
                              }
                              className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 hover:bg-yellow-200 rounded px-2 py-1 text-xs"
                            >
                              Revert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
