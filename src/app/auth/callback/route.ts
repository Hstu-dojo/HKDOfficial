import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/en'

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.user) {
        // Update user verification status in your local database
        try {
          await db
            .update(user)
            .set({ emailVerified: true })
            .where(eq(user.email, data.user.email!))
        } catch (dbError) {
          console.error('Database update error:', dbError)
        }

        // Redirect to success page with language prefix
        return NextResponse.redirect(new URL(`${next}?verified=true`, requestUrl.origin))
      }
    } catch (exchangeError) {
      console.error('Code exchange error:', exchangeError)
    }
  }

  // Redirect to error page with language prefix
  return NextResponse.redirect(new URL('/en/auth/auth-code-error', requestUrl.origin))
}