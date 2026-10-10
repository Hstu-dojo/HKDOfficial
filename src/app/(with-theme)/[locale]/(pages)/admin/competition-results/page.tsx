import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import { redirect } from "next/navigation";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import CompetitionResultsManager from "@/components/admin/CompetitionResultsManager";

export default async function CompetitionResultsAdminPage() {
  await requireAdminPageAccess('/admin/competition-results');
  const context = await getRBACContext();
  if (!context || !(await hasPermission(context.userId, "EVENT", "READ")))
    redirect("/unauthorized");
  return <CompetitionResultsManager />;
}
