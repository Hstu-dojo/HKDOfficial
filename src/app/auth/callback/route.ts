import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/supabase'
import { db } from '@/lib/connect-db'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error && data.user) {
      // Update user verification status in your local database
      try {
        await db
          .update(user)
          .set({ emailVerified: true })
          .where(eq(user.id, data.user.id))
      } catch (dbError) {
        console.error('Database update error:', dbError)
      }

      // Redirect to success page
      return NextResponse.redirect(new URL(`${next}?verified=true`, request.url))
    }
  }

  // Redirect to error page
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}