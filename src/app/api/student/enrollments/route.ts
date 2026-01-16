import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { courseEnrollments, courses, members } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getLocalUserId } from '@/lib/rbac/middleware';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/student/enrollments - Get current user's enrollments
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const localUserId = await getLocalUserId(session.user.id);
    if (!localUserId) {
      return NextResponse.json([]);
    }

    // First find member record for this user
    const memberRecord = await db
      .select()
      .from(members)
      .where(eq(members.userId, localUserId))
      .limit(1);

    if (memberRecord.length === 0) {
      return NextResponse.json([]);
    }

    // Get enrollments for this member
    const enrollments = await db
      .select({
        enrollment: courseEnrollments,
        course: courses,
      })
      .from(courseEnrollments)
      .leftJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.memberId, memberRecord[0].id))
      .orderBy(courseEnrollments.createdAt);

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Error fetching student enrollments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
