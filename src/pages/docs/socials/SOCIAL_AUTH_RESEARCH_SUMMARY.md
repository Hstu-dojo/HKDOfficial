# Social Provider Authentication - Research Summary

## Documentation Reviewed

1. **Supabase Social Login**: https://supabase.com/docs/guides/auth/social-login
2. **Identity Linking**: https://supabase.com/docs/guides/auth/auth-identity-linking
3. **Identities**: https://supabase.com/docs/guides/auth/identities
4. **User Management**: https://supabase.com/docs/guides/auth/managing-user-data
5. **Google OAuth**: https://supabase.com/docs/guides/auth/social-login/auth-google

## Key Findings

### 1. Supabase Handles Identity Linking Automatically

**From Documentation:**
> "Supabase Auth automatically links identities with the same email address to a single user. This helps to improve the user experience when multiple OAuth login options are presented since the user does not need to remember which OAuth account they used to sign up with."

**What This Means:**
- If user registers with `user@gmail.com` using email/password
- Then logs in with Google using same `user@gmail.com`
- Supabase automatically links the Google identity to the same user
- User can now login with either method

### 2. Identity Structure in Supabase

**auth.users table:**
- One row per user
- Contains: id, email, email_confirmed_at, user_metadata, etc.

**auth.identities table:**
- Multiple rows per user (one per authentication method)
- Contains: provider, provider_id, identity_data, user_id

**Example:**
```
User: john@gmail.com
  └── Identities:
        ├── { provider: 'email', provider_id: 'uuid', identity_data: {...} }
        ├── { provider: 'google', provider_id: 'google-id', identity_data: {...} }
        └── { provider: 'github', provider_id: 'github-id', identity_data: {...} }
```

### 3. Adding Password to OAuth Account

**From Documentation:**
> "Call the `updateUser({ password: 'validpassword'})` to add email with password authentication to an account created with an OAuth provider (Google, GitHub, etc.)."

**Implementation:**
```javascript
// User signed up with Google
// Later wants to add password for email/password login
const { error } = await supabase.auth.updateUser({
  password: 'new_password_123'
})

// Now user can login with:
// 1. Google OAuth
// 2. Email + Password
```

### 4. Detecting User's Auth Methods

**Access user identities:**
```javascript
const { data } = await supabase.auth.getUser()
const identities = data.user.identities

// Check which methods user has
const hasEmail = identities.some(i => i.provider === 'email')
const hasGoogle = identities.some(i => i.provider === 'google')
const hasGitHub = identities.some(i => i.provider === 'github')

// First-time OAuth user (no password set)
const isOAuthOnly = identities.length === 1 && identities[0].provider !== 'email'
```

### 5. Provider Data Available

**From OAuth providers, you get:**
- Email (always)
- Full name / Display name
- Avatar URL / Profile picture
- Provider-specific ID
- Provider access token (optional)

**Example Google identity_data:**
```json
{
  "email": "user@gmail.com",
  "email_verified": true,
  "full_name": "John Doe",
  "avatar_url": "https://lh3.googleusercontent.com/...",
  "picture": "https://lh3.googleusercontent.com/...",
  "provider_id": "123456789",
  "sub": "123456789"
}
```

## Implementation Strategy

### Scenario 1: Existing Email User → Add OAuth

```
User Flow:
1. User has account with email@test.com + password
2. User clicks "Sign in with Google" using same email
3. Supabase automatically links Google identity
4. Update local DB: Add 'google' to authProviders array

No additional steps needed - Supabase handles it!
```

### Scenario 2: New OAuth User → Add Password

```
User Flow:
1. User clicks "Sign in with Google" (first time)
2. Supabase creates user with Google identity only
3. Our app detects: identities.length === 1 && provider !== 'email'
4. Redirect to "Set Password" page
5. User creates password
6. Call supabase.auth.updateUser({ password })
7. Supabase adds 'email' identity
8. Create local DB record with emailVerified: true

Result: User can now login with Google OR email+password
```

### Scenario 3: OAuth User Returns

```
User Flow:
1. User logs in with Google (has used it before)
2. Supabase authenticates
3. Our callback checks local DB
4. If user exists: Update lastLoginAt
5. If not: Create record (shouldn't happen but failsafe)
6. Redirect to app

Simple flow - no password prompt needed
```

## Database Design

### Store Provider Info in Local Database

```typescript
// user table
{
  supabaseUserId: string  // Links to auth.users.id
  email: string
  emailVerified: boolean
  hasPassword: boolean     // NEW: Track if user set a password
  authProviders: json     // NEW: Array of linked providers
  // [
  //   { provider: 'google', email: 'user@gmail.com', linkedAt: '2024-01-01' },
  //   { provider: 'email', email: 'user@gmail.com', linkedAt: '2024-01-02' }
  // ]
  userName: string
  userAvatar: string
  // ... other fields
}
```

### Why Store Provider Info?

1. **Display in Profile**: Show user which accounts are linked
2. **Security**: User can see all their login methods
3. **Unlink Feature**: Allow users to remove providers (future feature)
4. **Analytics**: Track which auth methods are popular
5. **Audit**: Know when each provider was linked

## Key Benefits

✅ **No Duplicate Accounts**: Same email = same user (handled by Supabase)
✅ **Flexible Login**: Users choose their preferred method
✅ **Better UX**: OAuth users can add password later if needed
✅ **Security**: OAuth providers handle authentication securely
✅ **Email Verification**: OAuth emails are pre-verified
✅ **Provider Tokens**: Can access Google/GitHub APIs if needed (optional)

## Important Notes

1. **Automatic Linking Only for Same Email**
   - Different emails = different accounts
   - This is intentional security feature

2. **Unverified Emails Not Linked**
   - From docs: "It would be insecure to automatically link an identity to a user with an unverified email"
   - Supabase removes unconfirmed identities when linking

3. **SAML SSO Users Excluded**
   - Enterprise SSO users not subject to automatic linking
   - Our app doesn't use SAML, so not relevant

4. **Provider Tokens Not Stored by Supabase**
   - Supabase doesn't store provider tokens in database
   - If needed, extract from session and store securely
   - We don't need provider tokens for basic auth

## Next Steps

1. ✅ Read all documentation (DONE)
2. ✅ Understand identity linking (DONE)
3. ✅ Plan implementation (DONE)
4. ⏳ Update database schema
5. ⏳ Create set-password page
6. ⏳ Update callback route
7. ⏳ Add social login buttons
8. ⏳ Test all scenarios

## References

- [Supabase Social Login](https://supabase.com/docs/guides/auth/social-login)
- [Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking)
- [FAQ: Add password to OAuth account](https://supabase.com/docs/guides/auth/auth-identity-linking#how-to-add-emailpassword-login-to-an-oauth-account)
- [Server-Side Auth with Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

---

**Ready to implement! All documentation reviewed and strategy planned.** 🚀
