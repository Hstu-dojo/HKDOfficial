'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [globalTotals, setGlobalTotals] = useState<GlobalTotals>({
    totalOrganizations: 0, totalRevenue: 0, totalBills: 0, overallCollectionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [monthFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (monthFilter) params.set('billingMonth', monthFilter);
      const res = await fetch(`/api/admin/org-billing?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setOrgs(data.organizations || []);
      setGlobalTotals(data.globalTotals || {
        totalOrganizations: 0, totalRevenue: 0, totalBills: 0, overallCollectionRate: 0,
      });
    } catch {
      toast.error('Failed to load org billing data');
    } finally {
      setLoading(false);
    }
  };

  const fmtAmount = (amount: number) => `৳${(amount / 100).toFixed(0)}`;

  const fmtMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-BD', { year: 'numeric', month: 'long' });
  };

  // Month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i + 1);
    return date.toISOString().slice(0, 7);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Organization Billing Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aggregated billing data across all partner organizations.
          </p>
        </div>
        <div>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">All Time</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>{fmtMonth(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Organizations</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {globalTotals.totalOrganizations}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Bills</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
            {globalTotals.totalBills}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
            {fmtAmount(globalTotals.totalRevenue)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Collection Rate</p>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {globalTotals.overallCollectionRate}%
          </p>
        </div>
      </div>

      {/* Organization Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Organizations {monthFilter ? `— ${fmtMonth(monthFilter)}` : ''}
          </h2>
        </div>

        {orgs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <p>No organizations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Paid</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pending</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Submitted</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Overdue</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Collected</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Amt</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {orgs.map((org) => (
                  <tr
                    key={org.partnerId}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 ${
                      expandedOrg === org.partnerId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => setExpandedOrg(expandedOrg === org.partnerId ? null : org.partnerId)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{org.partnerName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{org.partnerSlug}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-gray-100">
                      {org.totalBills}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">{org.paidBills}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{org.pendingBills}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{org.submittedBills}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${org.overdueBills > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                        {org.overdueBills}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600 dark:text-green-400">
                      {fmtAmount(org.collectedAmount)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-gray-100">
                      {fmtAmount(org.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              org.collectionRate >= 80 ? 'bg-green-500' :
                              org.collectionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(org.collectionRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
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

      {/* Expanded org link */}
      {expandedOrg && (
        <div className="text-sm text-center">
          <a
            href={`/admin/monthly-fees?partnerId=${expandedOrg}`}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View all fees for this organization →
          </a>
        </div>
      )}
    </div>
  );
}
