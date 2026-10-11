import { requireAdminPageAccess } from "@/lib/rbac/page-access";
import { Metadata } from "next";
import MonthlyFeesManagement from "@/components/admin/monthly-fees/MonthlyFeesManagement";

export const metadata: Metadata = {
  title: "Monthly Fees | Admin",
  description: "Manage student monthly fee payments",
};

export default async function MonthlyFeesPage({
  searchParams,
}: {
  searchParams: Promise<{ partnerId?: string; billingMonth?: string }>;
}) {
  await requireAdminPageAccess("/admin/monthly-fees");
  const filters = await searchParams;
  return (
    <MonthlyFeesManagement
      initialPartnerId={filters.partnerId}
      initialMonth={filters.billingMonth}
    />
  );
}
