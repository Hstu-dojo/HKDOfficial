import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { user } from '@/db/schema'
import { eq, or } from 'drizzle-orm'

/**
 * Check if email or username already exists
 * Used before registration to prevent duplicate accounts
 */
export async function POST(request: NextRequest) {
  try {
    const { email, userName } = await request.json()

    if (!email && !userName) {
      return NextResponse.json(
        { error: 'Email or username is required' },
        { status: 400 }
      )
    }

    // Check local database for username and email
    let usernameExists = false
    let emailExists = false
    
    if (userName || email) {
      const conditions = []
      
      if (userName) {
        conditions.push(eq(user.userName, userName))
      }
      
      if (email) {
        conditions.push(eq(user.email, email))
      }

      const existingUsers = await db
        .select({
          userName: user.userName,
          email: user.email,
        })
        .from(user)
        .where(or(...conditions))

      for (const existingUser of existingUsers) {
        if (userName && existingUser.userName === userName) {
          usernameExists = true
        }
        if (email && existingUser.email === email) {
          emailExists = true
        }
      }
    }

    return NextResponse.json({
      emailExists,
      usernameExists,
    })
  } catch (error) {
    console.error('Check registration error:', error)
    return NextResponse.json(
      { error: 'Failed to check registration details' },
      { status: 500 }
    )
  }
}
