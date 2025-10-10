import { createClient } from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database
// Configure to use PKCE flow for OAuth (more secure, returns 'code' instead of token in URL)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce', // Use PKCE flow instead of implicit flow
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  }
)