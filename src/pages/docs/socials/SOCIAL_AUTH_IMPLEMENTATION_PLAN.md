# Social Provider Authentication Implementation Plan

## Based on Supabase Documentation Research

### Key Concepts from Supabase Docs:

1. **Automatic Identity Linking**
   - Supabase automatically links OAuth providers with same email
   - Each user in `auth.users` can have multiple identities in `auth.identities`
   - Identity object contains: `provider`, `provider_id`, `identity_data`, `email`

2. **Adding Password to OAuth Account**
   - Documentation states: "Call updateUser({ password: 'validpassword'}) to add email/password authentication to an account created with an OAuth provider"
   - This allows users who signed up with Google/GitHub to also login with email/password

3. **User Identities Structure**
   ```
   auth.users (one user)
     └── auth.identities (multiple identities)
           ├── email identity (if registered with email/password)
           ├── google identity (if logged in with Google)
           └── github identity (if logged in with GitHub)
   ```

## Implementation Strategy

### Scenario 1: User Has Email/Password Account → Logs in with OAuth
**Supabase Behavior:** Automatically links OAuth identity to existing user

**Our Implementation:**
1. Supabase links the provider automatically
2. In callback route, detect new identity added
3. Update local `user` table:
   - Store provider info in `authProviders` JSON column
   - Keep existing username, email, etc.

```typescript
// In callback route
const { data } = await supabase.auth.getUser()
const identities = data.user.identities

// Get all providers
const providers = identities.map(identity => ({
  provider: identity.provider,
  providerId: identity.provider_id,
  email: identity.identity_data.email,
  lastSignInAt: identity.last_sign_in_at
}))

// Update local database
await db.update(user)
  .set({ authProviders: providers })
  .where(eq(user.supabaseUserId, data.user.id))
```

### Scenario 2: First-Time OAuth User (No Email/Password)
**User Journey:**
1. User clicks "Sign in with Google"
2. Supabase creates user with Google identity
3. Redirect to our callback
4. **NEW:** Redirect to "Set Password" page
5. User creates password
6. Call `supabase.auth.updateUser({ password })`
7. Create local database record with verified email

**Implementation:**
```typescript
// In callback route - detect first-time OAuth user
if (data.user.identities.length === 1 && 
    data.user.identities[0].provider !== 'email') {
  // First-time OAuth user - needs to set password
  
  // Store user info in session/localStorage
  const providerData = {
    supabaseUserId: data.user.id,
    email: data.user.email,
    provider: data.user.identities[0].provider,
    fullName: data.user.user_metadata.full_name,
    avatarUrl: data.user.user_metadata.avatar_url,
    needsPassword: true
  }
  
  // Redirect to password setup page
  return NextResponse.redirect(
    new URL(`/en/onboarding/set-password?data=${encodeURIComponent(JSON.stringify(providerData))}`, requestUrl.origin)
  )
}
```

### Scenario 3: OAuth User Returns
**Supabase Behavior:** User logs in with same provider

**Our Implementation:**
1. Supabase authenticates user
2. Callback checks if user exists in local DB
3. If exists: Update last login timestamp
4. If not exists: Create local record
5. Redirect to app

## Database Schema Updates

### Add `authProviders` Column to User Table

```typescript
// In user schema
export const user = pgTable("user", {
  // ... existing fields
  
  // Store array of auth providers
  authProviders: jsonb("auth_providers").$type<Array<{
    provider: string // 'google', 'github', 'email', etc.
    providerId: string
    email: string
    linkedAt: string
  }>>().default([]),
  
  // Track if user set a password after OAuth signup
  hasPassword: boolean("has_password").default(false).notNull(),
  
  // OAuth users have email verified automatically
  emailVerified: boolean("email_verified").default(false).notNull(),
})
```

## New Pages/Components Needed

### 1. Set Password Page (`/en/onboarding/set-password`)
```typescript
// After OAuth signup, prompt user to set password
'use client'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const userData = // get from URL params
  
  const handleSetPassword = async () => {
    // Validate passwords match
    if (password !== confirmPassword) {
      toast.error("Passwords don't match")
      return
    }
    
    // Add password to OAuth account
    const { error } = await supabase.auth.updateUser({ password })
    
    if (error) {
      toast.error(error.message)
      return
    }
    
    // Create local database record
    await fetch('/api/auth/create-oauth-user', {
      method: 'POST',
      body: JSON.stringify({
        supabaseUserId: userData.supabaseUserId,
        email: userData.email,
        userName: generateUsername(userData.fullName, userData.email),
        userAvatar: userData.avatarUrl,
        provider: userData.provider,
        emailVerified: true, // OAuth emails are verified
        hasPassword: true
      })
    })
    
    toast.success("Account setup complete!")
    router.push('/en/profile')
  }
  
  return (
    <div>
      <h1>Complete Your Account Setup</h1>
      <p>You signed in with {userData.provider}. Set a password to also login with email.</p>
      
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      
      <Input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      
      <Button onClick={handleSetPassword}>
        Complete Setup
      </Button>
      
      <Button variant="ghost" onClick={() => router.push('/en/profile')}>
        Skip for now
      </Button>
    </div>
  )
}
```

### 2. API Route: Create OAuth User

```typescript
// /api/auth/create-oauth-user/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { user } from '@/db/schema'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    supabaseUserId,
    email,
    userName,
    userAvatar,
    provider,
    emailVerified,
    hasPassword
  } = body
  
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.supabaseUserId, supabaseUserId))
    .limit(1)
  
  if (existingUser.length > 0) {
    // Update existing user
    await db.update(user)
      .set({
        hasPassword,
        authProviders: sql`
          CASE 
            WHEN auth_providers IS NULL THEN jsonb_build_array(jsonb_build_object(
              'provider', ${provider},
              'email', ${email},
              'linkedAt', NOW()
            ))
            ELSE auth_providers || jsonb_build_array(jsonb_build_object(
              'provider', ${provider},
              'email', ${email},
              'linkedAt', NOW()
            ))
          END
        `
      })
      .where(eq(user.supabaseUserId, supabaseUserId))
    
    return NextResponse.json({ success: true, updated: true })
  }
  
  // Create new user
  await db.insert(user).values({
    supabaseUserId,
    email,
    emailVerified,
    password: `oauth_${supabaseUserId}`, // Placeholder
    userName,
    userAvatar,
    defaultRole: "GUEST",
    hasPassword,
    authProviders: [{
      provider,
      email,
      linkedAt: new Date().toISOString()
    }]
  })
  
  return NextResponse.json({ success: true, created: true })
}
```

## Updated Callback Route Logic

```typescript
// /app/auth/callback/route.ts
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  
  const supabase = createRouteHandlerClient({ cookies })
  
  // Handle OAuth callback (code exchange)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      const supabaseUser = data.user
      const identities = supabaseUser.identities || []
      
      // Check if this is first-time OAuth user
      const isOAuthOnly = identities.length === 1 && identities[0].provider !== 'email'
      
      // Check if user exists in local database
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.supabaseUserId, supabaseUser.id))
        .limit(1)
      
      if (existingUser.length === 0 && isOAuthOnly) {
        // First-time OAuth user - redirect to set password
        const providerData = {
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email,
          provider: identities[0].provider,
          fullName: supabaseUser.user_metadata.full_name || supabaseUser.user_metadata.name,
          avatarUrl: supabaseUser.user_metadata.avatar_url || supabaseUser.user_metadata.picture,
          needsPassword: true
        }
        
        return NextResponse.redirect(
          new URL(
            `/en/onboarding/set-password?data=${encodeURIComponent(JSON.stringify(providerData))}`,
            requestUrl.origin
          )
        )
      }
      
      if (existingUser.length === 0) {
        // User has email identity - create record directly
        await db.insert(user).values({
          supabaseUserId: supabaseUser.id,
          email: supabaseUser.email,
          emailVerified: supabaseUser.email_confirmed_at ? true : false,
          password: `supabase_${supabaseUser.id}`,
          userName: generateUsername(supabaseUser),
          userAvatar: getUserAvatar(supabaseUser),
          defaultRole: "GUEST",
          hasPassword: identities.some(i => i.provider === 'email'),
          authProviders: identities.map(i => ({
            provider: i.provider,
            providerId: i.provider_id,
            email: i.identity_data.email,
            linkedAt: i.created_at
          }))
        })
      } else {
        // Update existing user's providers
        const currentProviders = existingUser[0].authProviders || []
        const newProviders = identities.map(i => ({
          provider: i.provider,
          providerId: i.provider_id,
          email: i.identity_data.email,
          linkedAt: i.last_sign_in_at
        }))
        
        await db.update(user)
          .set({
            authProviders: newProviders,
            hasPassword: identities.some(i => i.provider === 'email')
          })
          .where(eq(user.supabaseUserId, supabaseUser.id))
      }
      
      return NextResponse.redirect(new URL('/en/profile', requestUrl.origin))
    }
  }
  
  // Handle email confirmation (existing logic)
  // ...
}
```

## Social Login Buttons Component

```typescript
// /components/auth/social-login-buttons.tsx
'use client'

import { FaGoogle, FaGithub } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'

export function SocialLoginButtons() {
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    
    if (error) {
      toast.error(`Failed to sign in with ${provider}`)
      console.error(error)
    }
  }
  
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        onClick={() => handleSocialLogin('google')}
        className="w-full"
      >
        <FaGoogle className="mr-2" />
        Continue with Google
      </Button>
      
      <Button
        variant="outline"
        onClick={() => handleSocialLogin('github')}
        className="w-full"
      >
        <FaGithub className="mr-2" />
        Continue with GitHub
      </Button>
    </div>
  )
}
```

## Benefits of This Approach

✅ **Follows Supabase Best Practices**: Uses built-in identity linking
✅ **Flexible Authentication**: Users can login with any method they've linked
✅ **No Duplicate Accounts**: Supabase automatically links same email
✅ **Provider Info Stored**: Track which providers each user has used
✅ **Optional Password**: OAuth users can add password later via profile settings
✅ **Seamless Experience**: Existing users can add OAuth providers easily

## Migration Steps

1. ✅ Add `authProviders` and `hasPassword` columns to user schema
2. ✅ Run migration: `npm run db:push`
3. ✅ Create `/api/auth/create-oauth-user` endpoint
4. ✅ Create `/en/onboarding/set-password` page
5. ✅ Update callback route with OAuth detection logic
6. ✅ Add social login buttons to login/register pages
7. ✅ Test all scenarios
8. ✅ Update profile page to show linked providers

## Testing Checklist

- [ ] Register with email → Add Google → Should link automatically
- [ ] Register with Google → Set password → Can login with both
- [ ] Register with Google → Skip password → Can only login with Google
- [ ] Register with email → Login with same email via Google → Should link
- [ ] User with email tries Google with different email → Should create separate account
