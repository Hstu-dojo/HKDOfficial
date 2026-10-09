import Link from 'next/link';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import CommitteeApplyForm from '@/components/committee/CommitteeApplyForm';
import { getCommitteeDirectory, getMyCommitteeStatus, getMyProfileSummary } from '@/actions/committee-actions';
import { getOnboardingStatus } from '@/actions/onboarding-actions';
import { getI18n } from '@/locales/server';

export default async function CommitteePublicPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "en";
  const t = await getI18n();
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
            <h1 className="text-3xl font-bold text-foreground dark:text-gray-100">{t('committeePage.title')}</h1>
            <p className="text-muted-foreground dark:text-gray-400">
              {t('committeePage.subtitle')}
            </p>
          </section>

          {currentCommittee ? (
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100">{currentCommittee.title}</h2>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">{t('committeePage.year', { year: currentCommittee.year })}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs">{t('committeePage.active')}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(currentCommittee.members || []).map((member: any) => {
                  const imageSrc = member.profile?.picture || member.additionalData?.photoUrl;


                  return (
                    <div
                      key={member.id}
                      className="rounded-lg border border-border dark:border-border bg-white dark:bg-background p-6"
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
                      <h3 className="text-xl font-bold text-foreground dark:text-gray-100 text-center mb-2">
                        {member.profile?.fullNameEnglish || member.user?.userName || '—'}
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400 text-center mb-4">
                        {member.positionTitle || t('committeePage.memberFallback')}
                      </p>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700 space-y-2 text-sm">
                        <div className="pt-2">
                          <span className="font-semibold text-foreground dark:text-gray-100">{t('committeePage.faculty')}</span>
                          <span className="ml-2 block text-foreground dark:text-gray-300">{member.department || '—'}</span>
                        </div>
                        <div className="py-2">
                          <span className="font-semibold text-foreground dark:text-gray-100">{t('committeePage.institution')}</span>
                          <span className="ml-2 block text-foreground dark:text-gray-300">{member.institution || '—'}</span>
                        </div>
                        {member.profile?.memberNumber && (
                          <div className="py-2">
                          <span className="font-semibold text-foreground dark:text-gray-100">{t('committeePage.memberNumber')}</span>
                            <span className="ml-2 block text-foreground dark:text-gray-300">{member.profile.memberNumber}</span>
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
                <div className="rounded-lg border border-border dark:border-border bg-white dark:bg-background p-6">
                  <h3 className="text-lg font-semibold text-foreground dark:text-gray-100">{t('committeePage.applyToJoin')}</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mt-2">
                    {t('committeePage.loginRequired')}
                  </p>
                  <Link
                    href={`/${locale}/login`}
                    className="inline-flex mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t('committeePage.login')}
                  </Link>
                </div>
              )}
            </section>
          ) : (
            <div className="rounded-lg border border-border dark:border-border bg-white dark:bg-background p-6">
              <h2 className="text-lg font-semibold text-foreground dark:text-gray-100">{t('committeePage.noActive')}</h2>
              <p className="text-sm text-muted-foreground dark:text-gray-400">{t('committeePage.checkBack')}</p>
            </div>
          )}

          {pastCommittees.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground dark:text-gray-100">{t('committeePage.past')}</h2>
              <div className="space-y-3">
                {pastCommittees.map((committee: any) => (
                  <div
                    key={committee.id}
                    className="rounded-lg border border-border dark:border-border bg-white dark:bg-background p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground dark:text-gray-100">{committee.title}</h3>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">{t('committeePage.year', { year: committee.year })}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-3 py-1 text-xs">{t('committeePage.pastBadge')}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(committee.members || []).map((member: any) => (
                        <div key={member.id} className="text-sm text-foreground dark:text-gray-300">
                          {member.profile?.fullNameEnglish || member.user?.userName || '—'} · {member.positionTitle || t('committeePage.member')}
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
