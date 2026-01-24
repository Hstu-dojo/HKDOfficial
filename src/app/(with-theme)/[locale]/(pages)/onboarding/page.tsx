import AuroraBd from "@/components/sections/aurora";
import { EnrollForm } from "@/components/enroll-form";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Header />
      <main className="relative">
        <AuroraBd />
        <MaxWidthWrapper>
             <div className="mb-8 pt-32 relative z-10">
                {/* Header text removed as requested */}
            </div>
          <EnrollForm className="shadow-lg border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm" />
          
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
