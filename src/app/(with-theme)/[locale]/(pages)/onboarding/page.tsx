import AuroraBd from "@/components/sections/aurora";
import { EnrollForm } from "@/components/enroll-form";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getOnboardingStatus } from "@/actions/onboarding-actions";
import { CheckCircleIcon, PencilSquareIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { existing, data } = await getOnboardingStatus();
  const params = await searchParams;
  const isEditMode = params.edit === 'true';

  // If already registered and NOT in edit mode, show success state
  if (existing && !isEditMode) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen">
          <AuroraBd />
          <MaxWidthWrapper>
            <div className="pt-32 pb-16 relative z-10">
              <div className="max-w-lg mx-auto text-center">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircleIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Registration Complete!
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Your registration has been submitted and is being reviewed. We&apos;ll notify you once it&apos;s approved.
                  </p>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Your Details</h3>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">Name:</dt>
                        <dd className="text-slate-900 dark:text-slate-100 font-medium">{data?.username || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">Email:</dt>
                        <dd className="text-slate-900 dark:text-slate-100 font-medium">{data?.email || 'N/A'}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-slate-500 dark:text-slate-400">Phone:</dt>
                        <dd className="text-slate-900 dark:text-slate-100 font-medium">{data?.phone || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link 
                      href="/onboarding?edit=true"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit Details
                    </Link>
                    <Link 
                      href="/dashboard"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white hover:opacity-90 transition-opacity font-medium"
                    >
                      Go to Dashboard
                      <ArrowRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </MaxWidthWrapper>
        </main>
        <Footer />
      </>
    );
  }

  // Show form for new users OR users in edit mode
  return (
    <>
      <Header />
      <main className="relative min-h-screen">
        <AuroraBd />
        <MaxWidthWrapper>
          <div className="pt-32 pb-16 relative z-10">
            {isEditMode && (
              <div className="max-w-2xl mx-auto mb-6">
                <Link 
                  href="/onboarding" 
                  className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                >
                  ← Back to Status
                </Link>
              </div>
            )}
            <EnrollForm 
              className="shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl" 
              initialData={existing ? data : undefined}
              isEditMode={isEditMode}
            />
          </div>
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
