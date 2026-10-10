import { redirect } from "next/navigation";
import { getPartnerAdminUser } from "@/lib/partner-admin/auth";
import { getPartnerProfile } from "@/lib/partner-admin/profile";
import Dashboard from "./dashboard/Dashboard.client";

export default async function PartnerAdminDashboardPage() {
  const user = await getPartnerAdminUser();
  if (!user) redirect("/partner-admin/login?next=/partner-admin");
  try {
    const data = await getPartnerProfile(user.partnerId);
    return <Dashboard initialData={JSON.parse(JSON.stringify(data))} />;
  } catch (error) {
    console.error("[Partner dashboard] Failed to load:", error);
    return (
      <Dashboard initialError="Unable to load your dashboard. Please reload to try again." />
    );
  }
}
