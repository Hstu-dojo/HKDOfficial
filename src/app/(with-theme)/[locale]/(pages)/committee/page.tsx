import SectionPageTitle from "@/components/sections/section-page-title";
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
      <main className="public-page">
        <SectionPageTitle subtitle={t("committeePage.subtitle")}>{t("committeePage.title")}</SectionPageTitle>
        <div className="public-page-container public-page-content space-y-10">


          {currentCommittee ? (
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-foreground">{currentCommittee.title}</h2>
                  <p className="text-sm text-muted-foreground">{t('committeePage.year', { year: currentCommittee.year })}</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-secondary/25 bg-secondary/10 text-foreground px-3 py-1 text-xs">{t('committeePage.active')}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(currentCommittee.members || []).map((member: any) => {
                  const imageSrc = member.profile?.picture || member.additionalData?.photoUrl;


                  return (
                    <div
                      key={member.id}
                      className="public-page-card"
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
                      <h3 className="text-xl font-bold text-foreground text-center mb-2">
                        {member.profile?.fullNameEnglish || member.user?.userName || '—'}
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground text-center mb-4">
                        {member.positionTitle || t('committeePage.memberFallback')}
                      </p>
                      <div className="divide-y divide-border space-y-2 text-sm">
                        <div className="pt-2">
                          <span className="font-semibold text-foreground">{t('committeePage.faculty')}</span>
                          <span className="ml-2 block text-foreground">{member.department || '—'}</span>
                        </div>
                        <div className="py-2">
                          <span className="font-semibold text-foreground">{t('committeePage.institution')}</span>
                          <span className="ml-2 block text-foreground">{member.institution || '—'}</span>
                        </div>
                        {member.profile?.memberNumber && (
                          <div className="py-2">
                          <span className="font-semibold text-foreground">{t('committeePage.memberNumber')}</span>
                            <span className="ml-2 block text-foreground">{member.profile.memberNumber}</span>
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
                <div className="public-page-card">
                  <h3 className="text-lg font-semibold text-foreground">{t('committeePage.applyToJoin')}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('committeePage.loginRequired')}
                  </p>
                  <Link
                    href={`/${locale}/login`}
                    className="inline-flex mt-4 min-h-11 items-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {t('committeePage.login')}
                  </Link>
                </div>
              )}
            </section>
          ) : (
            <div className="public-page-card">
              <h2 className="text-lg font-semibold text-foreground">{t('committeePage.noActive')}</h2>
              <p className="text-sm text-muted-foreground">{t('committeePage.checkBack')}</p>
            </div>
          )}

          {pastCommittees.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">{t('committeePage.past')}</h2>
              <div className="space-y-3">
                {pastCommittees.map((committee: any) => (
                  <div
                    key={committee.id}
                    className="public-page-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{committee.title}</h3>
                        <p className="text-sm text-muted-foreground">{t('committeePage.year', { year: committee.year })}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-3 py-1 text-xs">{t('committeePage.pastBadge')}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(committee.members || []).map((member: any) => (
                        <div key={member.id} className="text-sm text-foreground">
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
