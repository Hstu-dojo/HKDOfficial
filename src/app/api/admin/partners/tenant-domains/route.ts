import { NextResponse, type NextRequest } from 'next/server'
import { protectApiRoute } from '@/lib/rbac/middleware'
import type { RBACContext } from '@/lib/rbac/types'

const VERCEL_API_BASE = 'https://api.vercel.com'

function getVercelConfig() {
  const projectId = process.env.VERCEL_PROJECT_ID
  const apiToken = process.env.VERCEL_API_TOKEN
  const tenantBase = process.env.TENANT_BASE_DOMAIN || 'p.hstuma.com'

  if (!projectId || !apiToken) {
    throw new Error('Missing VERCEL_PROJECT_ID or VERCEL_API_TOKEN in environment')
  }

  return { projectId, apiToken, tenantBase }
}

export const GET = protectApiRoute('PARTNER', 'READ', async (_request: NextRequest, _context: RBACContext) => {
  try {
    const { projectId, apiToken, tenantBase } = getVercelConfig()

    const res = await fetch(`${VERCEL_API_BASE}/v1/projects/${projectId}/domains`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[TenantDomains] Vercel GET failed:', err)
      return NextResponse.json({ error: 'Failed to fetch domains from Vercel' }, { status: 502 })
    }

    const data = await res.json()
    const domains = Array.isArray(data.domains) ? data.domains : data

    const tenantSuffix = `.${tenantBase}`

    const filtered = (domains as Array<any>)
      .filter((item) => item?.name && item.name.endsWith(tenantSuffix))
      .map((item) => {
        const normalized = item.name.replace(tenantSuffix, '')
        return {
          slug: normalized,
          domain: item.name,
          ...item,
        }
      })

    return NextResponse.json({ domains: filtered })
  } catch (err) {
    console.error('[TenantDomains] GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = protectApiRoute('PARTNER', 'CREATE', async (request: NextRequest, _context: RBACContext) => {
  try {
    const body = await request.json()
    const { slug } = body

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    const { projectId, apiToken, tenantBase } = getVercelConfig()
    const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '')

    if (!normalizedSlug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }

    const domainName = `${normalizedSlug}.${tenantBase}`

    const res = await fetch(`${VERCEL_API_BASE}/v1/projects/${projectId}/domains`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domainName }),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('[TenantDomains] POST failed:', data)
      return NextResponse.json({ error: data.error?.message || 'Failed to add domain' }, { status: 502 })
    }

    return NextResponse.json({ domain: data, slug: normalizedSlug })
  } catch (err) {
    console.error('[TenantDomains] POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const DELETE = protectApiRoute('PARTNER', 'DELETE', async (request: NextRequest, _context: RBACContext) => {
  try {
    const { projectId, apiToken, tenantBase } = getVercelConfig()
    const url = new URL(request.url)
    const slug = url.searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug query is required' }, { status: 400 })
    }

    const normalizedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^-|-$/g, '')
    const domainName = `${normalizedSlug}.${tenantBase}`

    const res = await fetch(`${VERCEL_API_BASE}/v1/projects/${projectId}/domains/${encodeURIComponent(domainName)}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const data = await res.json()
      console.error('[TenantDomains] DELETE failed:', data)
      return NextResponse.json({ error: data.error?.message || 'Failed to remove domain' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[TenantDomains] DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
})
