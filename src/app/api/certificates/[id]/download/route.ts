import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCertificateForPdf } from '@/actions/certificate-actions';
import { generateDynamicCertificatePdf, generateCertificatePdf } from '@/lib/pdf/cert-pdf-server';
import { formatBeltRankLabel } from '@/lib/belt-rank';

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
    const searchParams = _request.nextUrl.searchParams;
    const admin = searchParams.get('admin') === 'true';
    
    // Admins want "normal textbase pdf.. but not editable pdf like current" -> so ALWAYS flatten.
    // Users want "completely image only pdf" -> Requires external rasterizer, currently falling back to flatten.
    const shouldFlatten = true;

    // Auth check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
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

    

    // Parse the issue date for PDF fields
    const issueDate = cert.issueDate ? new Date(cert.issueDate) : new Date();
    const day = issueDate.getDate().toString();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[issueDate.getMonth()];
    const year = issueDate.getFullYear().toString();

    let pdfBytes: Uint8Array;

    if (cert.certificatePdfPath && cert.fieldMappings && cert.fieldMappings.length > 0) {
      // Dynamic mapped generation
      const resolvedValues: Record<string, string | { imageUrl: string }> = {};

      for (const mapping of (cert.fieldMappings as any[])) {
        const fieldName = mapping.pdfFieldName;
        if (mapping.kind === 'static') {
          switch (mapping.staticSource) {
            case 'program_title': resolvedValues[fieldName] = cert.programTitle || ''; break;
            case 'program_date': resolvedValues[fieldName] = day; break;
            case 'program_month': resolvedValues[fieldName] = month; break;
            case 'program_year': resolvedValues[fieldName] = year; break;
            case 'custom_text': resolvedValues[fieldName] = mapping.staticText || ''; break;
          }
        } else if (mapping.kind === 'dynamic') {
          switch (mapping.dynamicSource) {
            case 'participant_name':
              resolvedValues[fieldName] = cert.participantName ?? cert.profileName ?? cert.profileNameBangla ?? 'Participant';
              break;
            case 'certificate_number':
              resolvedValues[fieldName] = cert.certificateNumber || '';
              break;
            case 'belt_test_rank':
              resolvedValues[fieldName] = formatBeltRankLabel(cert.newRank ?? (cert.metadata as any)?.belt_test_rank, '');
              break;
          }
        } else if (mapping.kind === 'signature' && mapping.signatureId) {
          // Pre-fetched mapped signatures
          const sig = cert.mappedSignatures?.find((s: any) => s.id === mapping.signatureId);
          let imgUrl = sig?.signatureImageUrl;

          // Manual Override Logic based on role:
          if (sig?.role === 'TRAINER' && cert.trainerSignature?.signatureImageUrl) {
            imgUrl = cert.trainerSignature.signatureImageUrl;
          } else if (sig?.role === 'COORDINATOR' && cert.coordinatorSignature?.signatureImageUrl) {
            imgUrl = cert.coordinatorSignature.signatureImageUrl;
          }

          if (imgUrl) {
            resolvedValues[fieldName] = { imageUrl: imgUrl };
          }
        }
      }

      pdfBytes = await generateDynamicCertificatePdf({
        templatePath: cert.certificatePdfPath as string,
        fieldMappings: cert.fieldMappings as any[],
        resolvedValues,
        shouldFlatten,
      });

    } else {
      // Fallback legacy PDF generator
      pdfBytes = await generateCertificatePdf({
          name: cert.participantName ?? cert.profileName ?? cert.profileNameBangla ?? 'Participant',
        programName: cert.programTitle,
        date: day,
        month,
        year,
        certId: cert.certificateNumber,
        trainerName: cert.trainerSignature?.name ?? '',
        coordinatorName: cert.coordinatorSignature?.name ?? '',
        trainerSignatureUrl: cert.trainerSignature?.signatureImageUrl,
        coordinatorSignatureUrl: cert.coordinatorSignature?.signatureImageUrl,
        shouldFlatten,
      });
    }

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
