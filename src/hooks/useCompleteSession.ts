'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface CompleteUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  profile?: string;
  role?: string;
  emailVerified?: boolean;
}

interface CompleteSession {
  user: CompleteUser;
  expires: string;
}

/**
 * Hook that waits for complete session data including user ID and role
 * Solves the issue of incremental session loading in NextAuth
 */
export function useCompleteSession() {
  const { data: session, status } = useSession();
  const [completeSession, setCompleteSession] = useState<CompleteSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
      return;
    }

    if (status === 'unauthenticated') {
      setCompleteSession(null);
      setIsLoading(false);
      setRetryCount(0);
      return;
    }

    // Check if session has all required data
    if (session?.user?.id && session?.user?.email) {
      // Session is complete
      setCompleteSession(session as CompleteSession);
      setIsLoading(false);
      setRetryCount(0);
    } else if (session?.user?.email && retryCount < 10) {
      // Session is partial, wait a bit and retry
      const timeout = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 200); // Check every 200ms

      return () => clearTimeout(timeout);
    } else {
      // Either no session or max retries reached
      if (session?.user?.email) {
        console.warn('Session loaded without complete data after retries, proceeding anyway');
        setCompleteSession(session as CompleteSession);
      }
      setIsLoading(false);
      setRetryCount(0);
    }
  }, [session, status, retryCount]);

  return {
    data: completeSession,
    status: isLoading ? 'loading' : status,
    isLoading,
    hasCompleteData: !!completeSession?.user?.id,
  };
}
