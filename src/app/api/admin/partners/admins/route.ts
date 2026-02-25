/**
 * Admin API — Partner Admin Account Management
 *
 * GET    /api/admin/partners/admins?partnerId=xxx  — List all admin accounts for a partner
 * POST   /api/admin/partners/admins               — Create a new admin for a partner
 * DELETE /api/admin/partners/admins                — Delete an admin account
 */
import { NextResponse } from 'next/server'
import { protectApiRoute } from '@/lib/rbac/middleware'
import type { RBACContext } from '@/lib/rbac/types'
import { db } from '@/lib/connect-db'
import { partners } from '@/db/schemas/partner'
import { eq } from 'drizzle-orm'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export const GET = protectApiRoute(
  'PARTNER',
  'READ',
  async (request: Request, _context: RBACContext) => {
    try {
      const { searchParams } = new URL(request.url)
      const partnerId = searchParams.get('partnerId')

      if (!partnerId) {
        return NextResponse.json(
          { error: 'partnerId query parameter is required' },
          { status: 400 }
        )
      }

      const payload = await getPayload({ config: configPromise })
      const admins = await payload.find({
        collection: 'partner-admins',
        where: { partnerId: { equals: partnerId } },
        sort: '-createdAt',
        limit: 100,
      })

      // Return only safe fields (no password hashes)
      const safeAdmins = admins.docs.map((admin) => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: (admin as Record<string, unknown>).phone || null,
        isActive: (admin as Record<string, unknown>).isActive ?? true,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      }))

      return NextResponse.json({ admins: safeAdmins })
    } catch (err) {
      console.error('[AdminPartnerAdmins] GET error:', err)
      return NextResponse.json(
        { error: 'Failed to fetch partner admins' },
        { status: 500 }
      )
    }
  }
)

export const POST = protectApiRoute(
  'PARTNER',
  'CREATE',
  async (request: Request, _context: RBACContext) => {
    try {
      const body = await request.json()
      const { partnerId, name, email, password, phone } = body

      if (!partnerId || !email || !password) {
        return NextResponse.json(
          { error: 'partnerId, email, and password are required' },
          { status: 400 }
        )
      }

      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }

      // Verify the partner exists
      const [partner] = await db
        .select()
        .from(partners)
        .where(eq(partners.id, partnerId))
        .limit(1)

      if (!partner) {
        return NextResponse.json(
          { error: 'Partner organization not found' },
          { status: 404 }
        )
      }

      const payload = await getPayload({ config: configPromise })

      // Check if email is already taken in partner-admins
      const existing = await payload.find({
        collection: 'partner-admins',
        where: { email: { equals: email } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        return NextResponse.json(
          { error: `Email "${email}" is already registered as a partner admin` },
          { status: 409 }
        )
      }

      const newAdmin = await payload.create({
        collection: 'partner-admins',
        data: {
          email,
          password,
          name: name || partner.name + ' Admin',
          partnerId: partner.id,
          partnerName: partner.name,
          partnerSlug: partner.slug,
          role: 'admin',
          phone: phone || '',
          isActive: true,
        },
      })

      return NextResponse.json(
        {
          admin: {
            id: newAdmin.id,
            name: newAdmin.name,
            email: newAdmin.email,
          },
          message: `Admin account created. They can log in at /partner-admin`,
        },
        { status: 201 }
      )
    } catch (err: any) {
      console.error('[AdminPartnerAdmins] POST error:', err)
      return NextResponse.json(
        { error: err?.message || 'Failed to create admin account' },
        { status: 500 }
      )
    }
  }
)

export const DELETE = protectApiRoute(
  'PARTNER',
  'DELETE',
  async (request: Request, _context: RBACContext) => {
    try {
      const body = await request.json()
      const { adminId, partnerId } = body

      if (!adminId || !partnerId) {
        return NextResponse.json(
          { error: 'adminId and partnerId are required' },
          { status: 400 }
        )
      }

      const payload = await getPayload({ config: configPromise })

      // Verify the admin belongs to the right partner
      const admin = await payload.findByID({
        collection: 'partner-admins',
        id: adminId,
      })

      if (!admin) {
        return NextResponse.json(
          { error: 'Admin account not found' },
          { status: 404 }
        )
      }

      if ((admin as Record<string, unknown>).partnerId !== partnerId) {
        return NextResponse.json(
          { error: 'Admin does not belong to this partner' },
          { status: 403 }
        )
      }

      // Check we're not deleting the last admin for this partner
      const remaining = await payload.find({
        collection: 'partner-admins',
        where: { partnerId: { equals: partnerId } },
        limit: 0,
      })

      if (remaining.totalDocs <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin account for this partner' },
          { status: 400 }
        )
      }

      await payload.delete({
        collection: 'partner-admins',
        id: adminId,
      })

      return NextResponse.json({ message: 'Admin account deleted successfully' })
    } catch (err: any) {
      console.error('[AdminPartnerAdmins] DELETE error:', err)
      return NextResponse.json(
        { error: err?.message || 'Failed to delete admin account' },
        { status: 500 }
      )
    }
  }
)
