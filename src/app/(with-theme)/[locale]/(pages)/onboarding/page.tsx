import AuroraBd from "@/components/sections/aurora";
import { EnrollForm } from "@/components/enroll-form";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function OnboardingPage() {
  return (
    <>
      <Header />
      <main className="relative">
        <AuroraBd />
        <MaxWidthWrapper>
          <div className="mb-8 text-center pt-32 relative z-10">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
              Member <span className="text-primary">Onboarding</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Complete your profile to access all features and programs.
            </p>
          </div>
          <EnrollForm className="shadow-lg border bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm" />
          
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
