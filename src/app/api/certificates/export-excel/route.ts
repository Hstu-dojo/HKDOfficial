import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProgramCertificates } from '@/actions/certificate-actions';
import { getProgramById } from '@/actions/program-actions';
import * as XLSX from 'xlsx';

/**
 * GET /api/certificates/export-excel?programId=xxx
 *
 * Exports all certificates for a program as an Excel file.
 * Columns: Certificate ID, Participant Name, Status, Issue Date, Verify Link
 */
export async function GET(request: NextRequest) {
  try {
    const programId = request.nextUrl.searchParams.get('programId');
    if (!programId) {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get program info
    const progRes = await getProgramById(programId);
    const programTitle = progRes.success && progRes.data ? progRes.data.title : 'Program';

    // Get all certificates for this program
    const result = await getProgramCertificates(programId);
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error ?? 'No certificates found' },
        { status: 404 }
      );
    }

    // Build base URL for public verify links
    const origin = request.nextUrl.origin;

    // Build Excel rows
    const rows = result.data.map((cert) => ({
      'Certificate ID': cert.certificateNumber,
      'Participant Name': cert.profileName ?? cert.profileNameBangla ?? cert.participantName ?? '—',
      'Member Number': cert.memberNumber ?? '—',
      'Status': cert.status,
      'Issue Date': cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—',
      'Verify Link': cert.status === 'ISSUED' ? `${origin}/en/cert-verify?certId=${encodeURIComponent(cert.certificateNumber)}` : '—',
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-width columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => {
      const maxLen = Math.max(
        key.length,
        ...rows.map((r) => String(r[key as keyof typeof r] ?? '').length)
      );
      return { wch: Math.min(maxLen + 2, 60) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Certificates');

    // Write to buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const safeName = programTitle.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
    const filename = `Certificates_${safeName}_${Date.now()}.xlsx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[cert-export-excel] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export certificates' },
      { status: 500 }
    );
  }
}
