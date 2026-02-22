import RegistrationsManagement from "@/components/admin/registrations/RegistrationsManagement";

export const metadata = {
  title: "Member Registrations | Admin",
  description: "View and manage member onboarding registrations",
};

export default function RegistrationsPage() {
  return <RegistrationsManagement />;
}
