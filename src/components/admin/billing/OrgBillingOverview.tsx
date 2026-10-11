"use client";

import { PartnerInvoices } from "@/components/billing/PartnerInvoices";
import { BillingReminders } from "@/components/billing/BillingReminders";
import { useRBAC } from "@/hooks/useRBAC";
import { businessDate } from "@/lib/billing/policy";
import { PanelLoader } from "@/components/loading";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface OrgSummary {
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  totalBills: number;
  paidBills: number;
  pendingBills: number;
  overdueBills: number;
  submittedBills: number;
  waivedBills: number;
  totalAmount: number;
  collectedAmount: number;
  collectionRate: number;
}

interface GlobalTotals {
  totalOrganizations: number;
  totalRevenue: number;
  totalBills: number;
  overallCollectionRate: number;
}

export default function OrgBillingOverview() {
  const { hasPermission } = useRBAC();
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [globalTotals, setGlobalTotals] = useState<GlobalTotals>({
    totalOrganizations: 0,
    totalRevenue: 0,
    totalBills: 0,
    overallCollectionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(businessDate().month);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [monthFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (monthFilter) params.set("billingMonth", monthFilter);
      const res = await fetch(`/api/admin/org-billing?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setOrgs(data.organizations || []);
      setGlobalTotals(
        data.globalTotals || {
          totalOrganizations: 0,
          totalRevenue: 0,
          totalBills: 0,
          overallCollectionRate: 0,
        },
      );
    } catch {
      toast.error("Failed to load org billing data");
    } finally {
      setLoading(false);
    }
  };

  const fmtAmount = (amount: number) => `৳${(amount / 100).toFixed(2)}`;

  const fmtMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-BD", { year: "numeric", month: "long" });
  };

  // Month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(`${businessDate().month}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - i + 1);
    return date.toISOString().slice(0, 7);
  });

  if (loading) {
    return <PanelLoader />;
  }

  return (
    <div className="portal-page space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            Organization Billing Overview
          </h1>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Aggregated billing data across all partner organizations.
          </p>
        </div>
        <div>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-lg border bg-white px-4 py-2 text-foreground focus:ring-2 focus:ring-blue-500 dark:bg-card dark:text-gray-100"
          >
            <option value="">All Time</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {fmtMonth(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-white p-5 dark:border-border dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Organizations
          </p>
          <p className="mt-1 text-3xl font-bold text-foreground dark:text-gray-100">
            {globalTotals.totalOrganizations}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5 dark:border-border dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Total Bills
          </p>
          <p className="mt-1 text-3xl font-bold text-foreground dark:text-gray-100">
            {globalTotals.totalBills}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5 dark:border-border dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Total Revenue (BDT)
          </p>
          <p className="text-green-600 dark:text-green-400 mt-1 text-3xl font-bold">
            {fmtAmount(globalTotals.totalRevenue)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-white p-5 dark:border-border dark:bg-card">
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Collection Rate (BDT)
          </p>
          <p className="mt-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
            {globalTotals.overallCollectionRate}%
          </p>
        </div>
      </div>

      {/* Organization Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-white dark:border-border dark:bg-card">
        <div className="border-b border-border p-4 dark:border-border">
          <h2 className="text-lg font-semibold text-foreground dark:text-gray-100">
            Organizations {monthFilter ? `— ${fmtMonth(monthFilter)}` : ""}
          </h2>
        </div>

        {orgs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground dark:text-gray-400">
            <p>No organizations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-muted dark:bg-background/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground dark:text-gray-400">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground dark:text-gray-400">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground dark:text-gray-400">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground dark:text-gray-400">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground dark:text-gray-400">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground dark:text-gray-400">
                    Overdue
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground dark:text-gray-400">
                    Collected (BDT)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground dark:text-gray-400">
                    Total Amt
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-muted-foreground dark:text-gray-400">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {orgs.map((org) => (
                  <tr
                    key={org.partnerId}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                      expandedOrg === org.partnerId
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                    onClick={() =>
                      setExpandedOrg(
                        expandedOrg === org.partnerId ? null : org.partnerId,
                      )
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground dark:text-gray-100">
                        {org.partnerName}
                      </div>
                      <div className="text-xs text-muted-foreground dark:text-gray-400">
                        {org.partnerSlug}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-foreground dark:text-gray-100">
                      {org.totalBills}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                        {org.paidBills}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                        {org.pendingBills}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {org.submittedBills}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-sm font-medium ${org.overdueBills > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"}`}
                      >
                        {org.overdueBills}
                      </span>
                    </td>
                    <td className="text-green-600 dark:text-green-400 px-6 py-4 text-right text-sm font-medium">
                      {fmtAmount(org.collectedAmount)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-foreground dark:text-gray-100">
                      {fmtAmount(org.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-slate-700">
                          <div
                            className={`h-2 rounded-full ${
                              org.collectionRate >= 80
                                ? "bg-green-500"
                                : org.collectionRate >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(org.collectionRate, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground dark:text-gray-300">
                          {org.collectionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {expandedOrg && (
        <PartnerInvoices
          key={expandedOrg}
          partnerId={expandedOrg}
          partnerName={
            orgs.find((o) => o.partnerId === expandedOrg)?.partnerName ||
            "Organization"
          }
        />
      )}
      {expandedOrg && hasPermission("MONTHLY_FEE", "READ") && (
        <BillingReminders
          endpoint="/api/admin/monthly-fees/reminders"
          partnerId={expandedOrg}
          canSend={hasPermission("MONTHLY_FEE", "MANAGE")}
        />
      )}
      {/* Expanded org link */}
      {expandedOrg && (
        <div className="text-center text-sm">
          <a
            href={`/admin/monthly-fees?partnerId=${expandedOrg}`}
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all fees for this organization →
          </a>
        </div>
      )}
    </div>
  );
}
