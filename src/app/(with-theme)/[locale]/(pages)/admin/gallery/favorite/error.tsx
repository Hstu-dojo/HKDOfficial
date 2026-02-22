'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex h-full flex-col items-center justify-center">
      <h2 className="text-center text-gray-900 dark:text-gray-100">
        {error.message || 'Something went wrong. Try reloading the page'}
      </h2>
      <button
        className="mt-4 rounded-md bg-violet-500 px-4 py-2 text-sm text-white transition-colors hover:bg-violet-400 dark:bg-violet-600 dark:hover:bg-violet-500"
        onClick={
          // Attempt to recover by trying to re-render the invoices route
          () => reset()
        }
      >
        Try again
      </button>
    </main>
  );
}
