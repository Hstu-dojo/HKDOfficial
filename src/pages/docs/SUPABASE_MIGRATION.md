# Supabase Authentication Migration Guide

## ✅ Completed Steps

1. **Environment Variables Setup** - Added Supabase URL and anon key to `.env`
2. **Installed Supabase Libraries** - Added `@supabase/supabase-js` and `@supabase/auth-helpers-nextjs`
3. **Created Supabase Client Configuration** - Set up client utilities in `/src/lib/supabase/`
4. **Updated Registration Flow** - Created `/api/auth/supabase-signup/route.ts`
5. **Updated Login Flow** - Created `/api/auth/supabase-signin/route.ts`
6. **Email Verification Handler** - Created `/app/auth/callback/route.ts`
7. **Auth Context Provider** - Created `/src/context/AuthContext.tsx`

## 🔧 Required Actions

### 1. Get Supabase Credentials
You need to update your `.env` file with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_ANON_KEY = YOUR_ACTUAL_SUPABASE_ANON_KEY_HERE
```

**To get your Supabase anon key:**
1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project: `ktvsgutudcvdfqvphevz`
3. Go to Settings → API
4. Copy the "anon public" key
5. Replace `YOUR_SUPABASE_ANON_KEY_HERE` in your `.env` file

### 2. Configure Supabase Auth Settings
In your Supabase dashboard:

1. **Go to Authentication → Settings**
2. **Set Site URL:** `https://karate-hstu.vercel.app`
3. **Add Redirect URLs:**
   - `https://karate-hstu.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for development)

### 3. Enable Email Confirmation
In Supabase dashboard:
1. Go to Authentication → Settings
2. Enable "Confirm email" under Email Auth
3. Customize email templates if needed

### 4. Update Your Application

#### a) Update Root Layout to Include AuthProvider
Add the AuthProvider to your root layout:

```tsx
// In your layout.tsx or _app.tsx
import { AuthProvider } from '@/context/AuthContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

#### b) Update Components to Use Supabase Auth
Replace `useSession()` from NextAuth with `useAuth()` from our context:

```tsx
// Before (NextAuth)
import { useSession } from 'next-auth/react'
const { data: session } = useSession()

// After (Supabase Auth)
import { useAuth } from '@/context/AuthContext'
const { user, session } = useAuth()
```

### 5. Database Schema Updates (Optional)
Since Supabase handles authentication, you might want to:
- Remove the `verification_token` table
- Update user table structure to match Supabase user IDs (UUID format)
- Set up Row Level Security (RLS) policies

## 🗑️ Cleanup Tasks

### Files to Remove/Update:
- `/src/app/api/auth/signup/route.ts` (old custom signup)
- `/src/app/api/auth/verify-mail/` (entire directory)
- `/src/actions/emailSend/accountVerify.js`
- `/src/components/component/verify-mail.tsx`
- Custom verification email templates

### Environment Variables to Remove:
```env
# These are no longer needed
RESEND_API_KEY
EMAIL_FROM_ADDRESS
```

## 🚀 Testing the New Flow

1. **Registration:**
   - User registers → Supabase sends confirmation email
   - User clicks link → Email confirmed via callback route
   - User can now sign in

2. **Login:**
   - User signs in → Supabase handles authentication
   - Session managed by Supabase Auth
   - Automatic token refresh handled by Supabase

## 🎯 Benefits of This Migration

✅ **Automatic Email Sending** - No need for Resend API
✅ **Built-in Email Templates** - Customizable in Supabase dashboard
✅ **Better Security** - Industry-standard JWT tokens
✅ **Automatic Session Management** - Handle token refresh automatically
✅ **Reduced Complexity** - Less custom code to maintain
✅ **Better Performance** - Optimized authentication flow

## 📞 Next Steps

1. Update your `.env` with actual Supabase anon key
2. Configure Supabase Auth settings in dashboard
3. Update your app layout to include AuthProvider
4. Test the registration and login flows
5. Clean up old authentication code

Let me know when you're ready to proceed with any of these steps!