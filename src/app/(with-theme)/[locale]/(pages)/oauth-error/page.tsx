'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExclamationTriangleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Suspense } from 'react';
import { useCurrentLocale, useI18n } from '@/locales/client';

function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');
  const t = useI18n();
  const locale = useCurrentLocale();

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
      <div className="p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8" />
        </div>
        
        {error === 'profile_not_found' ? (
          <>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('oauthError.profileRequiredTitle')}</h1>
              <p className="text-slate-600 dark:text-slate-300">
                {t('oauthError.profileRequiredDescription')}
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Link
                href={`/${locale}/onboarding`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <UserPlusIcon className="w-5 h-5" />
                {t('oauthError.completeProfile')}
              </Link>
              <Link
                href={`/${locale}/dashboard`}
                className="w-full px-4 py-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t('oauthError.goToDashboard')}
              </Link>
            </div>
          </>
        ) : error === 'role_missing' ? (
          <>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('oauthError.roleRequiredTitle')}</h1>
              <p className="text-slate-600 dark:text-slate-300">
                {t('oauthError.roleRequiredDescription')}
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Link
                href={`/${locale}/dashboard`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                {t('oauthError.goToDashboard')}
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('oauthError.authenticationErrorTitle')}</h1>
              <p className="text-slate-600 dark:text-slate-300">
                {t('oauthError.authenticationErrorDescription')}
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Link
                href={`/${locale}/dashboard`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                {t('oauthError.goToDashboard')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function OAuthErrorPage() {
  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center py-20 px-4">
        <MaxWidthWrapper>
          <Suspense fallback={<div className="h-64 flex items-center justify-center">...</div>}>
            <OAuthErrorContent />
          </Suspense>
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}