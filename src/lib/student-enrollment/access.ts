import "server-only";
import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { getRBACContext } from "@/lib/rbac/middleware";
import { hasPermission } from "@/lib/rbac/permissions";
export async function studentAccess(write = false) {
  const partner = await requirePartnerAdminUser();
  if (partner.user)
    return {
      actorId: `partner-admin:${partner.user.id}`,
      partnerId: partner.user.partnerId,
      admin: false,
    };
  const context = await getRBACContext();
  if (
    !context ||
    !(await hasPermission(context.userId, "ADMIN_PANEL", "ACCESS")) ||
    !(await hasPermission(context.userId, "MEMBER", write ? "UPDATE" : "READ"))
  )
    return null;
  return { actorId: context.userId, partnerId: null, admin: true };
}
