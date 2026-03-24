import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          if (!document.cookie) return []

          return document.cookie
            .split(';')
            .map((c) => c.trim())
            .filter(Boolean)
            .map((cookie) => {
              const eqIndex = cookie.indexOf('=')
              const name = eqIndex >= 0 ? cookie.slice(0, eqIndex) : cookie
              const value = eqIndex >= 0 ? cookie.slice(eqIndex + 1) : ''
              return { name, value }
            })
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return

          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}`
            cookie += `; Path=${options?.path || '/'}`

            if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`
            if (options?.expires) {
              const expires =
                options.expires instanceof Date
                  ? options.expires
                  : new Date(options.expires)
              cookie += `; Expires=${expires.toUTCString()}`
            }
            if (options?.domain) cookie += `; Domain=${options.domain}`
            if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`
            if (options?.secure) cookie += '; Secure'

            document.cookie = cookie
          })
        },
      },
    }
  )
}