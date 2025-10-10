# Social Auth - Quick Start Guide

## What We're Building

**Goal:** Users can login with Google/GitHub AND email/password interchangeably

## How Supabase Handles It

### Automatic Identity Linking ✨
- User registers with `user@gmail.com` + password
- Later logs in with Google using same email
- **Supabase automatically links them!**
- User can now use either method to login

### OAuth User Flow
1. **New OAuth User** → Prompted to set password → Can use both methods
2. **Returning OAuth User** → Just logs in → Seamless
3. **Email User adds OAuth** → Automatic linking → No changes needed

## Implementation Summary

### 1. Database Changes
```typescript
// Add to user schema:
{
  hasPassword: boolean          // Track if password is set
  authProviders: json          // Array of providers used
  // Example: [
  //   { provider: 'google', linkedAt: '2024-01-01' },
  //   { provider: 'email', linkedAt: '2024-01-02' }
  // ]
}
```

### 2. OAuth Callback Detection
```typescript
// In /auth/callback/route.ts
const identities = user.identities

// First-time OAuth user (no password)
if (identities.length === 1 && identities[0].provider !== 'email') {
  // Redirect to set-password page
  return redirect('/en/onboarding/set-password')
}

// Has password or returning user
// Create/update local DB record
// Redirect to app
```

### 3. Set Password Page
```typescript
// /en/onboarding/set-password
// User enters password
await supabase.auth.updateUser({ password })

// This adds 'email' identity to user
// Now they can login with email+password too!
```

### 4. Social Login Buttons
```typescript
// On login/register pages
<Button onClick={() => signInWithOAuth({ provider: 'google' })}>
  Continue with Google
</Button>

<Button onClick={() => signInWithOAuth({ provider: 'github' })}>
  Continue with GitHub
</Button>
```

## User Scenarios

### Scenario A: Email User → Add Google
```
1. User registers: email@test.com + password123
2. Local DB created with hasPassword: true
3. Later, user clicks "Sign in with Google"
4. Supabase links Google identity automatically
5. Update local DB: authProviders: ['email', 'google']
6. User can now use either method ✅
```

### Scenario B: Google User → Add Password
```
1. User clicks "Sign in with Google"
2. Supabase creates user with Google identity
3. Detect: first-time OAuth user
4. Redirect to "Set Password" page
5. User creates password
6. Call updateUser({ password })
7. Supabase adds 'email' identity
8. Create local DB with hasPassword: true
9. User can now use either method ✅
```

### Scenario C: Google User → Skip Password
```
1. User clicks "Sign in with Google"
2. Supabase creates user
3. Detect: first-time OAuth user
4. Show "Set Password" page with "Skip" button
5. User clicks "Skip"
6. Create local DB with hasPassword: false
7. User can only login with Google
8. (Can add password later in profile settings)
```

## Code Locations

```
📁 karate_dojo/
  📁 src/
    📁 app/
      📁 auth/
        📁 callback/
          📄 route.ts          ← Update with OAuth detection
      📁 (with-theme)/
        📁 [locale]/
          📁 onboarding/
            📁 set-password/
              📄 page.tsx      ← NEW: Create this page
          📁 login/
            📄 page.tsx        ← Add social login buttons
          📁 register/
            📄 page.tsx        ← Add social login buttons
    📁 components/
      📁 auth/
        📄 social-login-buttons.tsx  ← NEW: Create component
    📁 db/
      📁 schemas/
        📁 auth/
          📄 users.ts          ← Add hasPassword, authProviders
    📁 app/api/auth/
      📁 create-oauth-user/
        📄 route.ts            ← NEW: Create endpoint
```

## Migration Steps

1. **Update Schema** (5 min)
   ```bash
   # Add hasPassword and authProviders to user schema
   # Run: npm run db:push
   ```

2. **Create Set Password Page** (15 min)
   ```bash
   # Create /en/onboarding/set-password/page.tsx
   # Add password input form
   # Call updateUser({ password })
   ```

3. **Update Callback Route** (10 min)
   ```typescript
   # Add OAuth user detection
   # Add redirect logic
   # Add provider tracking
   ```

4. **Add Social Buttons** (10 min)
   ```typescript
   # Create SocialLoginButtons component
   # Add to login/register pages
   ```

5. **Test Everything** (20 min)
   ```
   # Test all 3 scenarios
   # Verify DB records created correctly
   # Check identity linking works
   ```

**Total Time: ~1 hour** ⏱️

## Testing Checklist

- [ ] Register with email → Works
- [ ] Login with email → Works
- [ ] Login with Google (first time) → Prompts for password
- [ ] Set password after Google → Can login with both
- [ ] Skip password after Google → Only Google works
- [ ] Register email → Login Google (same email) → Links automatically
- [ ] Check DB: authProviders array populated
- [ ] Check DB: hasPassword field correct
- [ ] Profile shows all linked providers
- [ ] Can add password later from profile

## What You Get

✅ **Flexible Authentication** - Users choose their method
✅ **No Duplicate Accounts** - Same email = same user
✅ **Better UX** - One-click OAuth signin
✅ **Security** - OAuth providers handle verification
✅ **Future-Proof** - Easy to add more providers (Facebook, Twitter, etc.)

## Next: Configure Providers in Supabase

1. **Google OAuth:**
   - Go to: https://console.cloud.google.com/
   - Create OAuth credentials
   - Add to Supabase Dashboard → Authentication → Providers → Google

2. **GitHub OAuth:**
   - Go to: https://github.com/settings/developers
   - Create OAuth App
   - Add to Supabase Dashboard → Authentication → Providers → GitHub

3. **Redirect URLs:**
   - Add: `http://localhost:3000/auth/callback`
   - Add: `https://karate-hstu.vercel.app/auth/callback`

---

**Ready to implement! Documentation reviewed, plan created, code examples ready.** 🎉
