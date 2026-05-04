import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { committeeMembers, committees, profiles, user } from '@/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { getRBACContext } from '@/lib/rbac/middleware';
import { hasPermission } from '@/lib/rbac/permissions';

export async function GET(request: NextRequest) {
  try {
    const context = await getRBACContext();
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canRead = await hasPermission(context.userId, 'MEMBER', 'READ');
    if (!canRead) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const committeeId = searchParams.get('committeeId');
    const statusFilter = searchParams.get('status') || undefined;

    if (!committeeId) {
      return NextResponse.json({ error: 'committeeId is required' }, { status: 400 });
    }

    const conditions = [eq(committeeMembers.committeeId, committeeId)];
    if (statusFilter) {
      conditions.push(eq(committeeMembers.status, statusFilter as any));
    }

    const rows = await db
      .select({
        application: committeeMembers,
        committee: committees,
        profile: profiles,
        applicant: user,
      })
      .from(committeeMembers)
      .leftJoin(committees, eq(committeeMembers.committeeId, committees.id))
      .leftJoin(profiles, eq(committeeMembers.profileId, profiles.id))
      .leftJoin(user, eq(committeeMembers.userId, user.id))
      .where(and(...conditions))
      .orderBy(desc(committeeMembers.createdAt));

    const excelData = rows.map((row, index) => {
      const profile = row.profile;
      const applicant = row.applicant;
      const committee = row.committee;

      return {
        'S/N': index + 1,
        'Committee Title': committee?.title || '-',
        'Committee Year': committee?.year || '-',
        'Status': row.application.status || '-',
        'Position Title': row.application.positionTitle || '-',
        'RBAC Role ID': row.application.rbacRoleId || '-',
        'Applicant Name': profile?.fullNameEnglish || applicant?.userName || '-',
        'Applicant Email': profile?.email || applicant?.email || '-',
        'Applicant Phone': profile?.phoneNumber || '-',
        'Member Number': profile?.memberNumber || '-',
        'Institution': row.application.institution || '-',
        'Department': row.application.department || '-',
        'Statement': row.application.statement || '-',
        'Applied At': row.application.createdAt
          ? format(new Date(row.application.createdAt), 'dd/MM/yyyy HH:mm')
          : '-',
        'Approved At': row.application.approvedAt
          ? format(new Date(row.application.approvedAt), 'dd/MM/yyyy HH:mm')
          : '-',
      };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet['!cols'] = [
      { wch: 5 },
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 22 },
      { wch: 20 },
      { wch: 25 },
      { wch: 28 },
      { wch: 15 },
      { wch: 18 },
      { wch: 25 },
      { wch: 20 },
      { wch: 30 },
      { wch: 20 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Committee Applications');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `committee-applications-${statusFilter || 'all'}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Committee export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
