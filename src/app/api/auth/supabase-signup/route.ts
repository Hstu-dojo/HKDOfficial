import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { createUser } from '@/lib/db/user'
import { hash } from '@/lib/hash'

function getOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto')
  if (forwardedHost) {
    const proto = forwardedProto || 'https'
    return `${proto}://${forwardedHost}`
  }

  return request.nextUrl.origin
}

function getCanonicalOrigin(request: NextRequest): string {
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host || '').toLowerCase()
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const proto = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'https'

  if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return request.nextUrl.origin
  }

  const rootDomain = process.env.ROOT_DOMAIN || 'hstuma.com'
  return `${proto}://${rootDomain}`
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, userName, userAvatar } = await request.json()

    if (!email || !password || !userName) {
      return NextResponse.json(
        { error: 'Email, password, and username are required' },
        { status: 400 }
      )
    }

    // Sign up user with Supabase Auth
    const supabase = createClient();
    const origin = getOrigin(request)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userName,
          avatar_url: userAvatar,
        },
        // Keep redirect_to clean (no query params) so Supabase allowlist matching succeeds.
        emailRedirectTo: `${origin}/auth/callback`
      }
    })

    if (authError) {
      console.error('Supabase Auth Error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Create user in your database (optional - you might want to do this via database triggers)
    try {
      const hashedPassword = await hash(password)
      await createUser({
        email,
        password: hashedPassword,
        userName,
        userAvatar,
      })
    } catch (dbError) {
      console.error('Database Error:', dbError)
      // User created in Supabase but failed to create in local DB
      // You might want to handle this differently based on your needs
    }

    return NextResponse.json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailVerified: authData.user.email_confirmed_at !== null
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}