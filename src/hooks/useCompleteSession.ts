'use client';

import { useSession } from '@/hooks/useSessionCompat';
import { useEffect, useState, useRef } from 'react';

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
 * Hook that waits for complete session data including user ID and role.
 * Stabilized: once a complete session is established for a given user,
 * subsequent token refreshes won't trigger loading states or retry loops.
 */
export function useCompleteSession() {
  const { data: session, status } = useSession();
  const [completeSession, setCompleteSession] = useState<CompleteSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  // Track the user ID we've already resolved, to skip re-processing on token refreshes
  const resolvedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      // Only show loading if we haven't resolved a user yet
      if (!resolvedUserIdRef.current) {
        setIsLoading(true);
      }
      return;
    }

    if (status === 'unauthenticated') {
      resolvedUserIdRef.current = null;
      setCompleteSession(null);
      setIsLoading(false);
      setRetryCount(0);
      return;
    }

    // If we already resolved this user, don't re-enter the loading/retry flow
    if (
      resolvedUserIdRef.current &&
      session?.user?.id === resolvedUserIdRef.current
    ) {
      return;
    }

    // Check if session has all required data
    if (session?.user?.id && session?.user?.email) {
      // Session is complete
      resolvedUserIdRef.current = session.user.id;
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
        resolvedUserIdRef.current = session?.user?.id ?? null;
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
