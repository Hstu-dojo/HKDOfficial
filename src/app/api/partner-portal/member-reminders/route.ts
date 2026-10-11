import { requirePartnerAdminUser } from "@/lib/partner-admin/auth";
import { getMemberReminders, sendMemberReminders } from "@/lib/billing/member-reminders";
export const maxDuration = 60;
export async function GET() {
 const {user,error}=await requirePartnerAdminUser(); if(error) return error;
 return getMemberReminders(user.partnerId);
}
export async function POST(request: Request) {
 const {user,error}=await requirePartnerAdminUser(); if(error) return error;
 return sendMemberReminders(request,user.partnerId,`partner-admin:${user.id}`);
}
