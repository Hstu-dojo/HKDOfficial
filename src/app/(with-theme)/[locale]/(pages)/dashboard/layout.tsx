import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import DashboardSidebar from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 bg-slate-50 dark:bg-slate-900">
        <div className="flex">
          {/* Sidebar */}
          <DashboardSidebar />
          
          {/* Main Content */}
          <main className="flex-1 lg:ml-64">
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
