'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ExclamationTriangleIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { Suspense } from 'react';

function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
      <div className="p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon className="w-8 h-8" />
        </div>
        
        {error === 'profile_not_found' ? (
          <>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Required</h1>
              <p className="text-slate-600 dark:text-slate-300">
                To access this external application, you need to complete your profile registration and enroll in a course.
              </p>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <Link
                href="/en/onboarding"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <UserPlusIcon className="w-5 h-5" />
                Complete Profile & Enroll
              </Link>
              <Link
                href="/en/dashboard"
                className="w-full px-4 py-3 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        ) : error === 'role_missing' ? (
          <>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Role Required</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Your profile is pending approval or has no assigned training role. Please contact your administrator.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Link
                href="/en/dashboard"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Authentication Error</h1>
              <p className="text-slate-600 dark:text-slate-300">
                There was a problem authenticating with the external application. Please try again.
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Link
                href="/en/dashboard"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
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
          <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading...</div>}>
            <OAuthErrorContent />
          </Suspense>
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}