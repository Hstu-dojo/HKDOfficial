import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Sign in user with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error('Supabase Auth Error:', error)
      
      // Handle specific error cases
      if (error.message === 'Email not confirmed') {
        return NextResponse.json(
          { 
            error: 'Please check your email and click the confirmation link before signing in.',
            code: 'email_not_confirmed',
            email: email // Include email for resend functionality
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to sign in' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Sign in successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailVerified: data.user.email_confirmed_at !== null
      },
      session: data.session
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}