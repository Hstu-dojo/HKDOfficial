import Link from 'next/link';
import { CheckCircleIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MaxWidthWrapper from '@/components/maxWidthWrapper';
import SuccessPdfDownload from '@/components/karate/SuccessPdfDownload';

interface PageProps {
  searchParams: Promise<{
    applicationId?: string;
  }>;
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function ApplicationSuccessPage({ searchParams, params }: PageProps) {
  const { applicationId } = await searchParams;
  const { slug } = await params;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <MaxWidthWrapper className="max-w-2xl">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/50 p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold mb-2">
              Application Submitted!
            </h1>
            
            {applicationId && (
              <p className="text-sm text-muted-foreground mb-4">
                Application ID: <span className="font-mono font-medium">{applicationId.slice(0, 8)}...</span>
              </p>
            )}

            <p className="text-muted-foreground mb-6">
              Thank you for applying! Your application and payment have been submitted for review.
            </p>

            {/* PDF Download */}
            <SuccessPdfDownload courseId={slug} applicationId={applicationId} />

            {/* Timeline */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 text-left mb-6">
              <h3 className="font-semibold mb-4">What happens next?</h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircleIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Application Submitted</p>
                    <p className="text-sm text-muted-foreground">Your application is now in our system</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ClockIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Payment Verification</p>
                    <p className="text-sm text-muted-foreground">Our team will verify your payment (1-2 business days)</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <EnvelopeIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Approval & Confirmation</p>
                    <p className="text-sm text-muted-foreground">You&apos;ll receive an email with your admission details</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Contact Info */}
            <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary dark:text-primary/80">
                <strong>Questions?</strong> Contact us at{' '}
                <a href="mailto:info@hkddojo.com" className="underline">info@hkddojo.com</a>
                {' '}or call <a href="tel:+8801XXXXXXXXX" className="underline">+880 1XXX-XXXXXX</a>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/karate/courses"
                className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-foreground rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-center text-sm font-medium transition-colors"
              >
                Browse More Courses
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-center text-sm font-medium transition-colors"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </MaxWidthWrapper>
      </main>
      <Footer />
    </>
  );
}
