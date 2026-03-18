import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getRBACContext } from '@/lib/rbac/middleware';
import { hasRole } from '@/lib/rbac/permissions';
import { normalizeStudentLevel } from '@/lib/auth/external-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const context = await getRBACContext();
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin =
    (await hasRole(context.userId, 'SUPER_ADMIN')) ||
    (await hasRole(context.userId, 'ADMIN'));

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

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
    .where(eq(profiles.id, profileId))
    .returning({
      id: profiles.id,
      memberNumber: profiles.memberNumber,
      studentLevel: profiles.studentLevel,
    });

  if (updated.length === 0) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, profile: updated[0] });
}
