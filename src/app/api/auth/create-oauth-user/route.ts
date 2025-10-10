import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface CreateOAuthUserRequest {
  supabaseUserId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  provider: string;
  hasPassword: boolean;
}

/**
 * Create or update user record for OAuth authenticated users
 * This endpoint is called after OAuth signup/signin to sync with local database
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateOAuthUserRequest = await request.json();
    const {
      supabaseUserId,
      email,
      fullName,
      avatarUrl,
      provider,
      hasPassword
    } = body;

    // Validation
    if (!supabaseUserId || !email || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: supabaseUserId, email, provider' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.supabaseUserId, supabaseUserId))
      .limit(1);

    if (existingUser.length > 0) {
      // User exists - update their auth providers and password status
      const currentUser = existingUser[0];
      const currentProviders = (currentUser.authProviders as any[]) || [];
      
      // Check if provider already exists
      const providerExists = currentProviders.some(
        (p: any) => p.provider === provider
      );
      
      // Add provider if not already linked
      const updatedProviders = providerExists
        ? currentProviders
        : [
            ...currentProviders,
            {
              provider,
              email,
              linkedAt: new Date().toISOString(),
            },
          ];

      await db
        .update(user)
        .set({
          hasPassword,
          authProviders: updatedProviders as any,
          updatedAt: new Date(),
        })
        .where(eq(user.supabaseUserId, supabaseUserId));

      return NextResponse.json({
        success: true,
        updated: true,
        message: 'User updated successfully',
      });
    }

    // Create new user
    // Generate username from name or email
    const generateUsername = () => {
      if (fullName) {
        // Remove spaces and special characters, convert to lowercase
        return fullName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 20) + Math.floor(Math.random() * 1000);
      }
      // Use email prefix
      return email.split('@')[0] + Math.floor(Math.random() * 1000);
    };

    const userName = generateUsername();
    const userAvatar = avatarUrl || '/image/avatar/Milo.svg';

    await db.insert(user).values({
      supabaseUserId,
      email,
      emailVerified: true, // OAuth emails are pre-verified
      password: `oauth_${supabaseUserId}`, // Placeholder password
      userName,
      userAvatar,
      defaultRole: 'GUEST',
      hasPassword,
      authProviders: [
        {
          provider,
          email,
          linkedAt: new Date().toISOString(),
        },
      ] as any,
    });

    return NextResponse.json({
      success: true,
      created: true,
      message: 'User created successfully',
      user: {
        userName,
        email,
        provider,
      },
    });
  } catch (error: any) {
    console.error('Create OAuth user error:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505') {
      if (error.constraint?.includes('user_name')) {
        return NextResponse.json(
          { error: 'Username already exists. Please try again.' },
          { status: 409 }
        );
      }
      if (error.constraint?.includes('supabase_user_id')) {
        return NextResponse.json(
          { error: 'User account already exists.' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to create user account',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
