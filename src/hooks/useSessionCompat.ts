'use client'

import { useAuth } from '@/context/AuthContext'
import { useMemo, useRef } from 'react'

/**
 * Compatibility hook that provides session data in NextAuth format
 * This makes migration easier for existing components.
 * 
 * Stabilized: uses user ID as the cache key instead of the full user/session
 * objects, preventing unnecessary downstream re-renders on token refresh.
 */
export function useSession() {
  const { user, session, loading } = useAuth()
  // Cache the formatted session to maintain reference stability
  const cachedRef = useRef<{
    userId: string | undefined
    result: { data: any; status: 'loading' | 'authenticated' | 'unauthenticated' }
  } | null>(null)

  const sessionData = useMemo(() => {
    if (loading) {
      return { data: null, status: 'loading' as const }
    }

    if (!user || !session) {
      cachedRef.current = null
      return { data: null, status: 'unauthenticated' as const }
    }

    // If the user ID hasn't changed, return the cached result
    // This prevents new object references on token refreshes
    if (cachedRef.current && cachedRef.current.userId === user.id) {
      return cachedRef.current.result
    }

    // Format user data to match NextAuth structure
    const formattedSession = {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.username || user.email?.split('@')[0],
        image: user.user_metadata?.avatar_url || '/default-avatar.png',
        role: user.user_metadata?.role || 'GUEST',
        emailVerified: !!user.email_confirmed_at,
      },
      expires: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : '',
    }

    const result = {
      data: formattedSession,
      status: 'authenticated' as const
    }

    // Cache for next render
    cachedRef.current = { userId: user.id, result }

    return result
  }, [user, session, loading])

  return sessionData
}