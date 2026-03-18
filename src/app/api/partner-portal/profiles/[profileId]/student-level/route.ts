import { NextRequest, NextResponse } from 'next/server';
import { requirePayloadPartnerUser } from '@/lib/payload/auth';
import { db } from '@/lib/connect-db';
import { profiles } from '@/db/schemas/karate/members';
import { and, eq } from 'drizzle-orm';
import { normalizeStudentLevel } from '@/lib/auth/external-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { user: partnerUser, error } = await requirePayloadPartnerUser();
  if (error) return error;

  const { profileId } = await params;
  if (!profileId) {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const studentLevel = normalizeStudentLevel(body?.studentLevel);

  if (body?.studentLevel !== null && body?.studentLevel !== undefined && !studentLevel) {
    return NextResponse.json({ error: 'Invalid student level' }, { status: 400 });
  }

  const updated = await db
    .update(profiles)
    .set({
      studentLevel,
      updatedAt: new Date(),
    })
    .where(and(eq(profiles.id, profileId), eq(profiles.partnerId, partnerUser.partnerId)))
    .returning({
      id: profiles.id,
      memberNumber: profiles.memberNumber,
      studentLevel: profiles.studentLevel,
    });

  if (updated.length === 0) {
    return NextResponse.json(
      { error: 'Profile not found in your organization' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, profile: updated[0] });
}
