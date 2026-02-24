/**
 * Admin API — Partner Admin Management
 * 
 * GET    /api/admin/partner-admins?partnerId=xxx — List admins for a partner org
 * POST   /api/admin/partner-admins — Add a new admin to a partner org
 * PATCH  /api/admin/partner-admins — Update a partner admin (activate/deactivate, change role)
 */
import { NextResponse } from 'next/server'
import { protectApiRoute } from '@/lib/rbac/middleware'
import type { RBACContext } from '@/lib/rbac/types'
import { db } from '@/lib/connect-db'
import { partners } from '@/db/schemas/partner'
import { eq } from 'drizzle-orm'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const GET = protectApiRoute('PARTNER', 'READ', async (request: Request, context: RBACContext) => {
  try {
    const url = new URL(request.url)
    const partnerId = url.searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const admins = await payload.find({
      collection: 'partner-admins',
      where: { partnerId: { equals: partnerId } },
      sort: '-createdAt',
    })

    return NextResponse.json({
      admins: admins.docs.map((a: any) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        isActive: a.isActive,
        createdAt: a.createdAt,
      })),
    })
  } catch (err) {
    console.error('[AdminPartnerAdmins] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch partner admins' }, { status: 500 })
  }
})

export const POST = protectApiRoute('PARTNER', 'CREATE', async (request: Request, context: RBACContext) => {
  try {
    const body = await request.json()
    const { partnerId, name, email, password, role, phone } = body

    if (!partnerId || !email || !password || !name) {
      return NextResponse.json(
        { error: 'partnerId, name, email, and password are required' },
        { status: 400 }
      )
    }

    const validRoles = ['admin']
    const adminRole = 'admin'

    // Verify partner exists
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1)

    if (!partner) {
      return NextResponse.json({ error: 'Partner organization not found' }, { status: 404 })
    }

    const payload = await getPayload({ config: configPromise })

    // Check if email is already in use
    const existing = await payload.find({
      collection: 'partner-admins',
      where: { email: { equals: email } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 409 }
      )
    }

    const newAdmin = await payload.create({
      collection: 'partner-admins',
      data: {
        email,
        password,
        name,
        partnerId: partner.id,
        partnerName: partner.name,
        partnerSlug: partner.slug,
        role: adminRole,
        phone: phone || '',
        isActive: true,
      },
    })

    return NextResponse.json(
      {
        admin: {
          id: newAdmin.id,
          name: newAdmin.name,
          email: (newAdmin as any).email,
          role: (newAdmin as any).role,
        },
        message: `Partner admin "${name}" added successfully`,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[AdminPartnerAdmins] POST error:', err)
    return NextResponse.json({ error: 'Failed to create partner admin' }, { status: 500 })
  }
})

export const PATCH = protectApiRoute('PARTNER', 'UPDATE', async (request: Request, context: RBACContext) => {
  try {
    const body = await request.json()
    const { id, isActive, role } = body

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    const updates: Record<string, unknown> = {}

    if (typeof isActive === 'boolean') {
      updates.isActive = isActive
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await payload.update({
      collection: 'partner-admins',
      id,
      data: updates,
    })

    return NextResponse.json({
      admin: {
        id: updated.id,
        name: updated.name,
        isActive: (updated as any).isActive,
      },
      message: 'Partner admin updated successfully',
    })
  } catch (err) {
    console.error('[AdminPartnerAdmins] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update partner admin' }, { status: 500 })
  }
})
