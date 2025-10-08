'use client'

import { useAuth } from '@/context/AuthContext'
import { useMemo } from 'react'

/**
 * Compatibility hook that provides session data in NextAuth format
 * This makes migration easier for existing components
 */
export function useSession() {
  const { user, session, loading } = useAuth()

  const sessionData = useMemo(() => {
    if (loading) {
      return { data: null, status: 'loading' as const }
    }

    if (!user || !session) {
      return { data: null, status: 'unauthenticated' as const }
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

    return {
      data: formattedSession,
      status: 'authenticated' as const
    }
  }, [user, session, loading])

  return sessionData
}