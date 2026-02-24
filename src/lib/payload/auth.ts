/**
 * Payload CMS Auth Bridge
 * 
 * Validates Payload JWT tokens from partner admin requests.
 * Used by /api/partner-portal/* routes to authenticate partner admins.
 */
import { headers, cookies } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export interface PayloadPartnerUser {
  id: string
  email: string
  name: string
  partnerId: string
  partnerName: string
  partnerSlug: string
  isActive: boolean
}

/**
 * Get the authenticated Payload partner admin user from the current request.
 * Returns null if not authenticated or not a valid partner admin.
 */
export async function getPayloadPartnerUser(): Promise<PayloadPartnerUser | null> {
  try {
    const payload = await getPayload({ config: configPromise })

    // Get headers to pass to Payload for auth
    const headersList = await headers()

    // Use Payload's built-in auth to verify the token
    const { user } = await payload.auth({ headers: headersList })

    if (!user) return null

    // Verify this is a partner-admin user with required fields
    const partnerUser = user as Record<string, unknown>

    if (!partnerUser.partnerId || !partnerUser.isActive) {
      return null
    }

    return {
      id: String(partnerUser.id),
      email: String(partnerUser.email),
      name: String(partnerUser.name || ''),
      partnerId: String(partnerUser.partnerId),
      partnerName: String(partnerUser.partnerName || ''),
      partnerSlug: String(partnerUser.partnerSlug || ''),
      isActive: Boolean(partnerUser.isActive),
    }
  } catch (error) {
    console.error('[PayloadAuth] Error verifying partner user:', error)
    return null
  }
}

/**
 * Require an authenticated partner admin. Returns 401/403 response or the user.
 */
export async function requirePayloadPartnerUser(): Promise<
  | { user: PayloadPartnerUser; error: null }
  | { user: null; error: Response }
> {
  const user = await getPayloadPartnerUser()

  if (!user) {
    return {
      user: null,
      error: Response.json(
        { error: 'Unauthorized — please log in to the Partner Admin panel' },
        { status: 401 }
      ),
    }
  }

  if (!user.isActive) {
    return {
      user: null,
      error: Response.json(
        { error: 'Account deactivated — contact system administrator' },
        { status: 403 }
      ),
    }
  }

  return { user, error: null }
}
