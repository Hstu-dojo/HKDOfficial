import Link from 'next/link';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <ShieldExclamationIcon className="mx-auto h-24 w-24 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don&apos;t have the required permissions to access this page.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <p className="text-sm text-gray-500">
            If you believe you should have access to this page, please contact your administrator.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Home
            </Link>
            
            <Link
              href="/contact"
              className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Contact Support
            </Link>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Need admin access?
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Admin access is restricted to authorized personnel only. 
                  Please contact your system administrator if you need elevated permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
