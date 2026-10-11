import { NextResponse } from "next/server";
import { db } from "@/lib/connect-db";
import { partners } from "@/db/schemas/partner";
import { monthlyFees } from "@/db/schema";
import { hasPermission } from "@/lib/rbac/permissions";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { feeRecords } from "@/lib/billing/service";
import {
  billingPeriod,
  checkedStatus,
  positivePage,
  summarizeFees,
} from "@/lib/billing/policy";
import { billingErrorResponse } from "@/lib/billing/http";
import { eq } from "drizzle-orm";
export const GET = protectApiRoute(
  "PARTNER_BILL",
  "READ",
  async (request, context) => {
    if (!(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    try {
      const p = new URL(request.url).searchParams,
        partnerId = p.get("partnerId") || undefined,
        month = p.get("billingMonth");
      if (month) billingPeriod(month);
      const status = checkedStatus(p.get("status"));
      const page = positivePage(p.get("page"), 1),
        limit = positivePage(p.get("limit"), 20, 100);
      const [orgs, records] = await Promise.all([
        db
          .select()
          .from(partners)
          .where(partnerId ? eq(partners.id, partnerId) : undefined),
        feeRecords({ partnerId }, [
          month ? eq(monthlyFees.billingMonth, month) : undefined,
        ]),
      ]);
      const filtered = records.filter(
        (r) => !status || r.fee.status === status,
      );
      const organizations = orgs
        .map((org) => {
          const rows = filtered.filter((r) => r.course.partnerId === org.id),
            summary = summarizeFees(rows.map((r) => r.fee)),
            money = summarizeFees(
              rows.filter((r) => r.fee.currency === "BDT").map((r) => r.fee),
            );
          return {
            partnerId: org.id,
            partnerName: org.name,
            partnerSlug: org.slug,
            isActive: org.isActive,
            totalBills: summary.total,
            paidBills: summary.paid,
            pendingBills: summary.pending,
            overdueBills: summary.overdue,
            submittedBills: summary.submitted,
            waivedBills: rows.filter((r) => r.fee.status === "waived").length,
            totalAmount: money.totalAmount,
            collectedAmount: money.collected,
            outstandingAmount: money.outstanding,
            collectionRate:
              money.totalAmount > 0
                ? Math.round((money.collected / money.totalAmount) * 100)
                : 0,
          };
        })
        .sort((a, b) => a.partnerName.localeCompare(b.partnerName));
      const amount = organizations.reduce((s, o) => s + o.totalAmount, 0),
        collected = organizations.reduce((s, o) => s + o.collectedAmount, 0);
      return NextResponse.json({
        organizations,
        fees: partnerId ? filtered.slice((page - 1) * limit, page * limit) : [],
        feePagination: {
          page,
          limit,
          total: partnerId ? filtered.length : 0,
          totalPages: partnerId ? Math.ceil(filtered.length / limit) : 0,
        },
        globalTotals: {
          totalOrganizations: organizations.length,
          totalRevenue: collected,
          totalBills: organizations.reduce((s, o) => s + o.totalBills, 0),
          outstandingAmount: organizations.reduce(
            (s, o) => s + o.outstandingAmount,
            0,
          ),
          overallCollectionRate:
            amount > 0 ? Math.round((collected / amount) * 100) : 0,
        },
      });
    } catch (error) {
      return billingErrorResponse(error);
    }
  },
);
