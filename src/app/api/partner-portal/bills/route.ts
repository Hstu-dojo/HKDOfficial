/**
 * Partner Portal — Bills API
 * 
 * GET /api/partner-portal/bills — List bills for the partner
 */
import { NextResponse } from 'next/server'
import { requirePayloadPartnerUser } from '@/lib/payload/auth'
import { db } from '@/lib/connect-db'
import { partnerBills } from '@/db/schemas/partner'
import { eq, and, desc, count } from 'drizzle-orm'

export async function GET(request: Request) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser()
  if (error) return error

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100)
  const status = url.searchParams.get('status') // 'pending' | 'paid' | 'overdue'

  try {
    const conditions = [eq(partnerBills.partnerId, partnerUser.partnerId)]

    if (status) {
      conditions.push(eq(partnerBills.status, status))
    }

    const offset = (page - 1) * limit

    const [results, totalResult] = await Promise.all([
      db
        .select()
        .from(partnerBills)
        .where(and(...conditions))
        .orderBy(desc(partnerBills.year), desc(partnerBills.month))
        .limit(limit)
        .offset(offset),

      db
        .select({ total: count() })
        .from(partnerBills)
        .where(and(...conditions)),
    ])

    const total = totalResult[0]?.total || 0

    return NextResponse.json({
      bills: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('[PartnerPortal] Bills GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}
