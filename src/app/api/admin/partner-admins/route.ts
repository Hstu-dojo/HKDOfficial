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
import { partnerAdmins } from '@/db/schemas/partner'
import { hash } from '@/lib/hash'

export const GET = protectApiRoute('PARTNER', 'READ', async (request: Request, context: RBACContext) => {
  try {
    const url = new URL(request.url)
    const partnerId = url.searchParams.get('partnerId')

    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required' }, { status: 400 })
    }

    const admins = await db
      .select({
        id: partnerAdmins.id,
        name: partnerAdmins.name,
        email: partnerAdmins.email,
        phone: partnerAdmins.phone,
        isActive: partnerAdmins.isActive,
        createdAt: partnerAdmins.createdAt,
      })
      .from(partnerAdmins)
      .where(eq(partnerAdmins.partnerId, partnerId))
      .orderBy(partnerAdmins.createdAt)

    return NextResponse.json({ admins: admins.slice().reverse() })
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

    const normalizedEmail = String(email).trim().toLowerCase()

    const existing = await db
      .select({ id: partnerAdmins.id })
      .from(partnerAdmins)
      .where(eq(partnerAdmins.email, normalizedEmail))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hash(String(password))

    const [newAdmin] = await db
      .insert(partnerAdmins)
      .values({
        partnerId: partner.id,
        email: normalizedEmail,
        passwordHash,
        name: String(name).trim(),
        phone: phone || null,
        isActive: true,
      })
      .returning({ id: partnerAdmins.id, name: partnerAdmins.name, email: partnerAdmins.email })

    return NextResponse.json(
      {
        admin: {
          id: newAdmin.id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: adminRole,
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

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const [updated] = await db
      .update(partnerAdmins)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(partnerAdmins.id, id))
      .returning({ id: partnerAdmins.id, name: partnerAdmins.name, isActive: partnerAdmins.isActive })

    if (!updated) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

    return NextResponse.json({
      admin: {
        id: updated.id,
        name: updated.name,
        isActive: updated.isActive,
      },
      message: 'Partner admin updated successfully',
    })
  } catch (err) {
    console.error('[AdminPartnerAdmins] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update partner admin' }, { status: 500 })
  }
})
