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
 * 
 * OPTIMIZED: Eliminated the 200ms retry polling loop. If the session has
 * user.id + user.email on the first check, it resolves immediately.
 * Only retries (up to 3x at 150ms) if the session is partial (has email
 * but no ID), which is a rare edge case during initial Supabase hydration.
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

    // FAST PATH: session already has all required data → resolve immediately
    if (session?.user?.id && session?.user?.email) {
      resolvedUserIdRef.current = session.user.id;
      setCompleteSession(session as CompleteSession);
      setIsLoading(false);
      setRetryCount(0);
      return;
    }

    // SLOW PATH: session is partial (has email but not ID) — rare edge case
    // during initial Supabase hydration. Retry a few times quickly.
    if (session?.user?.email && retryCount < 3) {
      const timeout = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 150);

      return () => clearTimeout(timeout);
    }

    // Either no session or max retries reached
    if (session?.user?.email) {
      console.warn('Session loaded without complete data after retries, proceeding anyway');
      resolvedUserIdRef.current = session?.user?.id ?? null;
      setCompleteSession(session as CompleteSession);
    }
    setIsLoading(false);
    setRetryCount(0);
  }, [session, status, retryCount]);

  return {
    data: completeSession,
    status: isLoading ? 'loading' : status,
    isLoading,
    hasCompleteData: !!completeSession?.user?.id,
  };
}
