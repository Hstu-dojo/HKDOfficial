import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCertificateForPdf } from '@/actions/certificate-actions';
import { generateCertificatePdf } from '@/lib/pdf/cert-pdf-server';

/**
 * GET /api/certificates/[id]/download
 *
 * Generates a flattened certificate PDF on-demand and returns it as a download.
 * Both admin and the certificate owner can download.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch certificate + related data
    const result = await getCertificateForPdf(id);
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error ?? 'Certificate not found' },
        { status: 404 }
      );
    }

    const cert = result.data;

    // Only allow download of ISSUED certificates
    if (cert.status !== 'ISSUED') {
      return NextResponse.json(
        { error: 'Certificate has not been issued yet' },
        { status: 400 }
      );
    }

    // Parse the issue date for PDF fields
    const issueDate = cert.issueDate ? new Date(cert.issueDate) : new Date();
    const day = issueDate.getDate().toString();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[issueDate.getMonth()];
    const year = issueDate.getFullYear().toString();

    // Generate the flattened PDF
    const pdfBytes = await generateCertificatePdf({
      name: cert.profileName ?? cert.profileNameBangla ?? 'Participant',
      programName: cert.programTitle,
      date: day,
      month,
      year,
      certId: cert.certificateNumber,
      trainerName: cert.trainerSignature?.name ?? '',
      coordinatorName: cert.coordinatorSignature?.name ?? '',
      trainerSignatureUrl: cert.trainerSignature?.signatureImageUrl,
      coordinatorSignatureUrl: cert.coordinatorSignature?.signatureImageUrl,
    });

    // Return as downloadable PDF
    const filename = `Certificate_${cert.certificateNumber}.pdf`;
    const inline = _request.nextUrl.searchParams.get('inline') === 'true';
    const buf = new Uint8Array(pdfBytes).buffer as ArrayBuffer;
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[cert-download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
