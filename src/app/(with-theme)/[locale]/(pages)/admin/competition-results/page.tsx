import { redirect } from "next/navigation";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
import CompetitionResultsManager from "@/components/admin/CompetitionResultsManager";

export default async function CompetitionResultsAdminPage() {
  const context = await getRBACContext();
  if (!context || !(await hasPermission(context.userId, "EVENT", "READ")))
    redirect("/unauthorized");
  return <CompetitionResultsManager />;
}
