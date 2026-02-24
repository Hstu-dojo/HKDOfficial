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
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET() {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  try {
    const payload = await getPayload({ config: configPromise })

    const admins = await payload.find({
      collection: 'partner-admins',
      where: { partnerId: { equals: partnerUser.partnerId } },
      sort: '-createdAt',
    })

    return NextResponse.json({
      admins: admins.docs.map((a: any) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role || 'staff',
        phone: a.phone,
        isActive: a.isActive,
        isCurrentUser: a.id === partnerUser.id,
        createdAt: a.createdAt,
      })),
      currentUserRole: partnerUser.role,
    })
  } catch (err) {
    console.error('[PartnerPortal] Admins GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  // Only owners and admins can add new admins
  if (partnerUser.role !== 'owner' && partnerUser.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only owners and admins can add new admins' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { name, email, password, role, phone } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Enforce role hierarchy: admins cannot create owners
    let assignedRole = role || 'staff'
    if (partnerUser.role === 'admin' && assignedRole === 'owner') {
      return NextResponse.json(
        { error: 'Only owners can assign the owner role' },
        { status: 403 }
      )
    }

    if (!['owner', 'admin', 'staff'].includes(assignedRole)) {
      assignedRole = 'staff'
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
        partnerId: partnerUser.partnerId,
        partnerName: partnerUser.partnerName,
        partnerSlug: partnerUser.partnerSlug,
        role: assignedRole,
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
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  // Only owners and admins can manage other admins
  if (partnerUser.role !== 'owner' && partnerUser.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only owners and admins can manage admins' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { id, isActive, role } = body

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

    const payload = await getPayload({ config: configPromise })

    // Verify the target admin belongs to the same organization
    const target = await payload.findByID({
      collection: 'partner-admins',
      id,
    })

    if (!target || (target as any).partnerId !== partnerUser.partnerId) {
      return NextResponse.json({ error: 'Admin not found in your organization' }, { status: 404 })
    }

    // Enforce role hierarchy
    const targetRole = (target as any).role || 'staff'

    // Admins cannot modify owners
    if (partnerUser.role === 'admin' && targetRole === 'owner') {
      return NextResponse.json(
        { error: 'Admins cannot modify owner accounts' },
        { status: 403 }
      )
    }

    // Admins cannot promote to owner
    if (partnerUser.role === 'admin' && role === 'owner') {
      return NextResponse.json(
        { error: 'Only owners can assign the owner role' },
        { status: 403 }
      )
    }

    const updates: Record<string, unknown> = {}

    if (typeof isActive === 'boolean') {
      updates.isActive = isActive
    }

    if (role && ['owner', 'admin', 'staff'].includes(role)) {
      updates.role = role
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
        role: (updated as any).role,
        isActive: (updated as any).isActive,
      },
      message: 'Admin updated successfully',
    })
  } catch (err) {
    console.error('[PartnerPortal] Admins PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update admin' }, { status: 500 })
  }
}
