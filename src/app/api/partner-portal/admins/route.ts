/**
 * Partner Portal — Admin Management API
 * 
 * Allows partner admins (owner/admin role) to manage co-admins in their org.
 * 
 * GET    /api/partner-portal/admins — List all admins in my organization
 * POST   /api/partner-portal/admins — Add a new admin to my organization
 * PATCH  /api/partner-portal/admins — Update a co-admin (activate/deactivate, change role)
 */
import { NextResponse } from 'next/server'
import { requirePartnerAdminUser } from '@/lib/partner-admin/auth'
import { db } from '@/lib/connect-db'
import { partnerAdmins } from '@/db/schemas/partner'
import { and, eq, count } from 'drizzle-orm'
import { hash } from '@/lib/hash'

export async function GET() {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
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
      .where(eq(partnerAdmins.partnerId, partnerUser.partnerId))
      .orderBy(partnerAdmins.createdAt)

    return NextResponse.json({
      admins: admins
        .slice()
        .reverse()
        .map((a) => ({
          ...a,
          isCurrentUser: a.id === partnerUser.id,
        })),
    })
  } catch (err) {
    console.error('[PartnerPortal] Admins GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { name, email, password, phone } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    const existing = await db
      .select({ total: count() })
      .from(partnerAdmins)
      .where(eq(partnerAdmins.email, String(email).trim().toLowerCase()))

    if ((existing[0]?.total || 0) > 0) {
      return NextResponse.json(
        { error: 'An admin with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hash(String(password))

    const [newAdmin] = await db
      .insert(partnerAdmins)
      .values({
        partnerId: partnerUser.partnerId,
        email: String(email).trim().toLowerCase(),
        passwordHash,
        name: String(name).trim(),
        phone: phone ? String(phone) : null,
        isActive: true,
      })
      .returning({ id: partnerAdmins.id, name: partnerAdmins.name, email: partnerAdmins.email })

    return NextResponse.json(
      {
        admin: {
          id: newAdmin.id,
          name: newAdmin.name,
          email: newAdmin.email,
        },
        message: `Admin "${name}" added to your organization`,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[PartnerPortal] Admins POST error:', err)
    return NextResponse.json({ error: 'Failed to add admin' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { user: partnerUser, error } = await requirePartnerAdminUser()
  if (error) return error

  try {
    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    // Cannot modify yourself via this endpoint
    if (id === partnerUser.id) {
      return NextResponse.json(
        { error: 'Cannot modify your own account via this endpoint. Use the profile settings.' },
        { status: 400 }
      )
    }

    const [target] = await db
      .select({ id: partnerAdmins.id, partnerId: partnerAdmins.partnerId })
      .from(partnerAdmins)
      .where(eq(partnerAdmins.id, String(id)))
      .limit(1)

    if (!target || target.partnerId !== partnerUser.partnerId) {
      return NextResponse.json({ error: 'Admin not found in your organization' }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}

    if (typeof isActive === 'boolean') {
      updates.isActive = isActive
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const [updated] = await db
      .update(partnerAdmins)
      .set({
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(partnerAdmins.id, String(id)), eq(partnerAdmins.partnerId, partnerUser.partnerId)))
      .returning({ id: partnerAdmins.id, name: partnerAdmins.name, isActive: partnerAdmins.isActive })

    if (!updated) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })

    return NextResponse.json({
      admin: {
        id: updated.id,
        name: updated.name,
        isActive: updated.isActive,
      },
      message: 'Admin updated successfully',
    })
  } catch (err) {
    console.error('[PartnerPortal] Admins PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
  }
}
