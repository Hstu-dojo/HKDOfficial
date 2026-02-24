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
import { getPayload } from 'payload'
import configPromise from '@payload-config'

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
      // Admin user details for Payload
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

    // Step 2: Create a Payload admin user for this partner
    let payloadUser = null
    try {
      const payload = await getPayload({ config: configPromise })

      payloadUser = await payload.create({
        collection: 'partner-admins',
        data: {
          email: adminEmail,
          password: adminPassword,
          name: adminName || name + ' Admin',
          partnerId: newPartner.id,
          partnerName: newPartner.name,
          partnerSlug: newPartner.slug,
          role: 'owner',
          phone: contactPhone || '',
          isActive: true,
        },
      })
    } catch (payloadErr: any) {
      // If Payload user creation fails, still keep the partner but log error
      console.error('[AdminPartners] Failed to create Payload user:', payloadErr?.message || payloadErr)

      // Clean up the partner if Payload user creation fails
      await db.delete(partners).where(eq(partners.id, newPartner.id))

      return NextResponse.json(
        {
          error: 'Failed to create partner admin account',
          details: payloadErr?.message || 'Unknown Payload error',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        partner: newPartner,
        adminUser: payloadUser
          ? { id: payloadUser.id, email: adminEmail }
          : null,
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
    const allowedFields = ['name', 'description', 'location', 'contactEmail', 'contactPhone', 'isActive']
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

    // If deactivating, also deactivate the Payload admin user
    if ('isActive' in safeUpdates && !safeUpdates.isActive) {
      try {
        const payload = await getPayload({ config: configPromise })
        const admins = await payload.find({
          collection: 'partner-admins',
          where: { partnerId: { equals: id } },
        })

        for (const admin of admins.docs) {
          await payload.update({
            collection: 'partner-admins',
            id: admin.id,
            data: { isActive: false },
          })
        }
      } catch (payloadErr) {
        console.error('[AdminPartners] Failed to deactivate Payload users:', payloadErr)
      }
    }

    return NextResponse.json({ partner: updated })
  } catch (err) {
    console.error('[AdminPartners] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
  }
})
