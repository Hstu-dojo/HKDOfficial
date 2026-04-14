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
import { partnerAdmins } from '@/db/schemas/partner'
import { eq } from 'drizzle-orm'
import { and, count } from 'drizzle-orm'
import { hash } from '@/lib/hash'

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

      const admins = await db
        .select({
          id: partnerAdmins.id,
          name: partnerAdmins.name,
          email: partnerAdmins.email,
          phone: partnerAdmins.phone,
          isActive: partnerAdmins.isActive,
          createdAt: partnerAdmins.createdAt,
          updatedAt: partnerAdmins.updatedAt,
        })
        .from(partnerAdmins)
        .where(eq(partnerAdmins.partnerId, partnerId))
        .orderBy(partnerAdmins.createdAt)

      return NextResponse.json({ admins: admins.slice().reverse() })
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

      const normalizedEmail = String(email).trim().toLowerCase()

      const existing = await db
        .select({ id: partnerAdmins.id })
        .from(partnerAdmins)
        .where(eq(partnerAdmins.email, normalizedEmail))
        .limit(1)

      if (existing.length > 0) {
        return NextResponse.json(
          { error: `Email "${email}" is already registered as a partner admin` },
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
          name: String(name || partner.name + ' Admin').trim(),
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

      const [admin] = await db
        .select({ id: partnerAdmins.id, partnerId: partnerAdmins.partnerId })
        .from(partnerAdmins)
        .where(eq(partnerAdmins.id, adminId))
        .limit(1)

      if (!admin) {
        return NextResponse.json(
          { error: 'Admin account not found' },
          { status: 404 }
        )
      }

      if (admin.partnerId !== partnerId) {
        return NextResponse.json(
          { error: 'Admin does not belong to this partner' },
          { status: 403 }
        )
      }

      // Check we're not deleting the last admin for this partner
      const remaining = await db
        .select({ total: count() })
        .from(partnerAdmins)
        .where(eq(partnerAdmins.partnerId, partnerId))

      if ((remaining[0]?.total || 0) <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin account for this partner' },
          { status: 400 }
        )
      }

      await db.delete(partnerAdmins).where(and(eq(partnerAdmins.id, adminId), eq(partnerAdmins.partnerId, partnerId)))

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
