import Header from "@/components/layout/header";
import DashboardShell from "@/components/dashboard/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <DashboardShell>{children}</DashboardShell>
    </>
  );
}
