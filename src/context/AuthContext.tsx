'use client'

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// Create a single supabase client for interacting with your database
const supabase = createClient()

// Export the supabase client for use in other components
export { supabase }

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // Track the current user ID to avoid unnecessary state updates on token refresh
  const currentUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      currentUserIdRef.current = session?.user?.id ?? null
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        const newUserId = newSession?.user?.id ?? null

        // For TOKEN_REFRESHED events where the user hasn't changed,
        // only update the session silently (for the new access token)
        // without triggering a full re-render cascade.
        if (
          event === 'TOKEN_REFRESHED' &&
          currentUserIdRef.current === newUserId &&
          currentUserIdRef.current !== null
        ) {
          // Update session ref for token freshness but avoid re-rendering
          // downstream hooks that depend on session identity (useRBAC, etc.)
          // We still update session state so the token is available,
          // but we use a functional update that preserves reference when user is same.
          setSession(prev => {
            // If the user ID is the same, keep the previous reference for
            // downstream memoization, but store the new access token.
            if (prev?.user?.id === newSession?.user?.id) {
              // Mutate the access_token on the existing object so consumers
              // using the token directly still get the fresh value, but
              // React doesn't see a new reference.
              if (prev && newSession) {
                prev.access_token = newSession.access_token
                prev.refresh_token = newSession.refresh_token
                prev.expires_at = newSession.expires_at
                prev.expires_in = newSession.expires_in
              }
              return prev
            }
            return newSession
          })
          return
        }

        // For actual auth changes (SIGNED_IN, SIGNED_OUT, USER_UPDATED, etc.)
        // update everything normally
        currentUserIdRef.current = newUserId
        setSession(newSession)
        setUser(newSession?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}