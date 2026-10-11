import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { getReminders, postReminders } from "@/lib/billing/reminder-handler";
export const maxDuration = 60;
export async function GET(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  return getReminders(request, { partnerId: user.partnerId }, false);
}
export async function POST(request: Request) {
  const { user, error } = await requirePartnerAdminUser();
  if (error) return error;
  return postReminders(
    request,
    { partnerId: user.partnerId },
    `partner-admin:${user.id}`,
  );
}
