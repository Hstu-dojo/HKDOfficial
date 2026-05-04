import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import CommitteeApplyForm from '@/components/committee/CommitteeApplyForm';
import { getCommitteeDirectory, getMyCommitteeStatus, getMyProfileSummary } from '@/actions/committee-actions';
import { getOnboardingStatus } from '@/actions/onboarding-actions';

export default async function CommitteePublicPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const directoryRes = await getCommitteeDirectory();
  const directory = directoryRes.success && directoryRes.data ? directoryRes.data : [];
  const currentCommittee = directory.find((c: any) => c.isActive) || null;
  const pastCommittees = directory.filter((c: any) => !c.isActive);

  const onboarding = await getOnboardingStatus();
  const profileSummary = await getMyProfileSummary();
  const statusResult = await getMyCommitteeStatus();

  const prefill = {
    ...(profileSummary.success && profileSummary.data ? profileSummary.data : null),
    ...(onboarding?.data || null),
    ...(onboarding?.userEmail ? { email: onboarding.userEmail } : null),
  };
  const isLoggedIn = Boolean(onboarding?.data || onboarding?.userEmail);
  const existingApplication = statusResult.success
    ? statusResult.data?.history?.find((entry: any) => entry.committeeId === currentCommittee?.id) || null
    : null;

  return (
    <>
      <Header />
      <main className="relative pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <section className="space-y-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Committee Members</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Meet the current committee and apply to join the team for this year.
            </p>
          </section>

          {currentCommittee ? (
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{currentCommittee.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Year {currentCommittee.year}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs">Active</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(currentCommittee.members || []).map((member: any) => {
                  const imageSrc = member.profile?.picture || member.additionalData?.photoUrl;
                  const phone = member.additionalData?.phone || '—';
                  return (
                    <div
                      key={member.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6"
                    >
                      {imageSrc && (
                        <div className="flex justify-center mb-4">
                          <img 
                            src={imageSrc} 
                            alt="" 
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
                        {member.profile?.fullNameEnglish || member.user?.userName || '—'}
                      </h3>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 text-center mb-4">
                        {member.positionTitle || 'Committee Member'}
                      </p>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700 space-y-2 text-sm">
                        <div className="pt-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">Faculty / Department:</span>
                          <span className="ml-2 block text-gray-700 dark:text-gray-300">{member.department || '—'}</span>
                        </div>
                        <div className="py-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">Institution:</span>
                          <span className="ml-2 block text-gray-700 dark:text-gray-300">{member.institution || '—'}</span>
                        </div>
                        {member.profile?.memberNumber && (
                          <div className="py-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Member #:</span>
                            <span className="ml-2 block text-gray-700 dark:text-gray-300">{member.profile.memberNumber}</span>
                          </div>
                        )}
                        {phone !== '—' && (
                          <div className="pb-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">Phone:</span>
                            <span className="ml-2 block text-gray-700 dark:text-gray-300">{phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {isLoggedIn ? (
                <CommitteeApplyForm
                  committeeId={currentCommittee.id}
                  prefill={prefill}
                  isLoggedIn={isLoggedIn}
                  existingApplication={existingApplication}
                  committeeYear={currentCommittee.year}
                />
              ) : (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Apply to Join</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    You must be logged in to submit an application.
                  </p>
                  <Link
                    href={`/${locale}/login`}
                    className="inline-flex mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Log in
                  </Link>
                </div>
              )}
            </section>
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Active Committee</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Please check back later.</p>
            </div>
          )}

          {pastCommittees.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Past Committees</h2>
              <div className="space-y-3">
                {pastCommittees.map((committee: any) => (
                  <div
                    key={committee.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{committee.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Year {committee.year}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-3 py-1 text-xs">Past</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(committee.members || []).map((member: any) => (
                        <div key={member.id} className="text-sm text-gray-700 dark:text-gray-300">
                          {member.profile?.fullNameEnglish || member.user?.userName || '—'} · {member.positionTitle || 'Member'}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}