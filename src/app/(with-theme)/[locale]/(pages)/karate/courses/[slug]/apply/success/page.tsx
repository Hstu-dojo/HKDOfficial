import Link from 'next/link';
import { CheckCircleIcon, ClockIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

interface PageProps {
  searchParams: Promise<{
    applicationId?: string;
  }>;
}

export default async function ApplicationSuccessPage({ searchParams }: PageProps) {
  const { applicationId } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Submitted!
          </h1>
          
          {applicationId && (
            <p className="text-sm text-gray-500 mb-4">
              Application ID: <span className="font-mono font-medium">{applicationId.slice(0, 8)}...</span>
            </p>
          )}

          <p className="text-gray-600 mb-6">
            Thank you for applying! Your application and payment have been submitted for review.
          </p>

          {/* Timeline */}
          <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Application Submitted</p>
                  <p className="text-sm text-gray-500">Your application is now in our system</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ClockIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Payment Verification</p>
                  <p className="text-sm text-gray-500">Our team will verify your payment (1-2 business days)</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <EnvelopeIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Approval & Confirmation</p>
                  <p className="text-sm text-gray-500">You&apos;ll receive an email with your admission details</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Questions?</strong> Contact us at{' '}
              <a href="mailto:info@hkddojo.com" className="underline">info@hkddojo.com</a>
              {' '}or call <a href="tel:+8801XXXXXXXXX" className="underline">+880 1XXX-XXXXXX</a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/karate/courses"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
            >
              Browse More Courses
            </Link>
            <Link
              href="/dashboard"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
