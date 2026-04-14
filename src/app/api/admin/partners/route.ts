/**
 * Admin API — Partner Management
 * 
 * GET    /api/admin/partners — List all partners
 * POST   /api/admin/partners — Create a new partner + Payload admin user
 * PATCH  /api/admin/partners — Update a partner
 * DELETE /api/admin/partners — Deactivate a partner
 */
import { NextResponse } from 'next/server'
import { protectApiRoute } from '@/lib/rbac/middleware'
import type { RBACContext } from '@/lib/rbac/types'
import { db } from '@/lib/connect-db'
import { partners } from '@/db/schemas/partner'
import { members } from '@/db/schemas/karate/members'
import { eq, desc, count, and } from 'drizzle-orm'
import { partnerAdmins } from '@/db/schemas/partner'
import { hash } from '@/lib/hash'

export const GET = protectApiRoute('PARTNER', 'READ', async (request: Request, context: RBACContext) => {
  try {
    const allPartners = await db
      .select()
      .from(partners)
      .orderBy(desc(partners.createdAt))

    // Get member counts for each partner
    const partnersWithStats = await Promise.all(
      allPartners.map(async (partner) => {
        const [memberCount] = await db
          .select({ total: count() })
          .from(members)
          .where(eq(members.partnerId, partner.id))

        return {
          ...partner,
          memberCount: memberCount?.total || 0,
        }
      })
    )

    return NextResponse.json({ partners: partnersWithStats })
  } catch (err) {
    console.error('[AdminPartners] GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
  }
})

export const POST = protectApiRoute('PARTNER', 'CREATE', async (request: Request, context: RBACContext) => {
  try {
    const body = await request.json()

    const {
      name,
      slug,
      description,
      location,
      contactEmail,
      contactPhone,
      // Admin user details for Partner Portal
      adminName,
      adminEmail,
      adminPassword,
    } = body

    // Validate required fields
    if (!name || !slug || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Name, slug, admin email, and admin password are required' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existing = await db
      .select({ id: partners.id })
      .from(partners)
      .where(eq(partners.slug, slug))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 })
    }

    // Step 1: Create the partner organization in Drizzle
    const [newPartner] = await db
      .insert(partners)
      .values({
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: description || null,
        location: location || null,
        contactEmail: contactEmail || adminEmail,
        contactPhone: contactPhone || null,
        isActive: true,
      })
      .returning()

    // Step 2: Create the initial partner-admin account
    try {
      const email = String(adminEmail).trim().toLowerCase()

      const existingAdmin = await db
        .select({ id: partnerAdmins.id })
        .from(partnerAdmins)
        .where(eq(partnerAdmins.email, email))
        .limit(1)

      if (existingAdmin.length > 0) {
        await db.delete(partners).where(eq(partners.id, newPartner.id))
        return NextResponse.json(
          { error: `Email "${email}" is already registered as a partner admin` },
          { status: 409 }
        )
      }

      const passwordHash = await hash(String(adminPassword))

      await db.insert(partnerAdmins).values({
        partnerId: newPartner.id,
        email,
        passwordHash,
        name: String(adminName || name + ' Admin').trim(),
        phone: contactPhone || null,
        isActive: true,
      })
    } catch (adminErr: any) {
      console.error('[AdminPartners] Failed to create partner admin:', adminErr?.message || adminErr)
      await db.delete(partners).where(eq(partners.id, newPartner.id))
      return NextResponse.json(
        {
          error: 'Failed to create partner admin account',
          details: adminErr?.message || 'Unknown error',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        partner: newPartner,
        adminUser: { email: String(adminEmail).trim().toLowerCase() },
        message: `Partner "${name}" created successfully. Admin can log in at /partner-admin`,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[AdminPartners] POST error:', err)
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
  }
})

export const PATCH = protectApiRoute('PARTNER', 'UPDATE', async (request: Request, context: RBACContext) => {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 })
    }

    // Only allow specific field updates
    const allowedFields = ['name', 'slug', 'description', 'location', 'contactEmail', 'contactPhone', 'isActive']
    const safeUpdates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in updates) {
        safeUpdates[field] = updates[field]
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    safeUpdates.updatedAt = new Date()

    const [updated] = await db
      .update(partners)
      .set(safeUpdates)
      .where(eq(partners.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // If deactivating, also deactivate partner-admin accounts
    if ('isActive' in safeUpdates && !safeUpdates.isActive) {
      try {
        await db
          .update(partnerAdmins)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(partnerAdmins.partnerId, id))
      } catch (adminErr) {
        console.error('[AdminPartners] Failed to deactivate partner admins:', adminErr)
      }
    }

    return NextResponse.json({ partner: updated })
  } catch (err) {
    console.error('[AdminPartners] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
  }
})
