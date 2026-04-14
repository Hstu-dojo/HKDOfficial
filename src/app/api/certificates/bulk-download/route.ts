import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProgramCertificates, getCertificateForPdf } from '@/actions/certificate-actions';
import { generateDynamicCertificatePdf, generateCertificatePdf, mergeCertificatePdfs } from '@/lib/pdf/cert-pdf-server';

/**
 * GET /api/certificates/bulk-download?programId=xxx
 *
 * Generates all ISSUED certificates for a program, merges them into a single
 * multi-page PDF and returns it as a download.
 */
export async function GET(request: NextRequest) {
  try {
    const programId = request.nextUrl.searchParams.get('programId');
    if (!programId) {
      return NextResponse.json({ error: 'programId is required' }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all certificates for this program
    const result = await getProgramCertificates(programId);
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error ?? 'No certificates found' },
        { status: 404 }
      );
    }

    // Filter to ISSUED only
    const issuedCerts = result.data.filter((c) => c.status === 'ISSUED');
    if (issuedCerts.length === 0) {
      return NextResponse.json(
        { error: 'No issued certificates found for this program' },
        { status: 404 }
      );
    }

    // Generate individual PDFs
    const pdfBytesArray: Uint8Array[] = [];

    for (const cert of issuedCerts) {
      const fullCert = await getCertificateForPdf(cert.id);
      if (!fullCert.success || !fullCert.data) continue;

      const c = fullCert.data;
      const issueDate = c.issueDate ? new Date(c.issueDate) : new Date();
      const day = issueDate.getDate().toString();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = monthNames[issueDate.getMonth()];
      const year = issueDate.getFullYear().toString();

      const mapBeltRank = (rank: string | null | undefined): string => {
        if (!rank) return '';
        const parts = rank.split('_');
        if (parts.length === 1) return rank.charAt(0).toUpperCase() + rank.slice(1);
        return `${parts[0].charAt(0).toUpperCase() + parts[0].slice(1)} (${parts[1].charAt(0).toUpperCase() + parts[1].slice(1, 4)} ${parts[1].slice(4)})`;
      };

      let pdfBytes: Uint8Array;

      if (c.certificatePdfPath && c.fieldMappings && c.fieldMappings.length > 0) {
        const resolvedValues: Record<string, string | { imageUrl: string }> = {};

        for (const mapping of (c.fieldMappings as any[])) {
          const fieldName = mapping.pdfFieldName;
          if (mapping.kind === 'static') {
            switch (mapping.staticSource) {
              case 'program_title': resolvedValues[fieldName] = c.programTitle || ''; break;
              case 'program_date': resolvedValues[fieldName] = day; break;
              case 'program_month': resolvedValues[fieldName] = month; break;
              case 'program_year': resolvedValues[fieldName] = year; break;
              case 'custom_text': resolvedValues[fieldName] = mapping.staticText || ''; break;
            }
          } else if (mapping.kind === 'dynamic') {
            switch (mapping.dynamicSource) {
              case 'participant_name':
                resolvedValues[fieldName] = c.profileName ?? c.profileNameBangla ?? c.participantName ?? 'Participant';
                break;
              case 'certificate_number':
                resolvedValues[fieldName] = c.certificateNumber || '';
                break;
              case 'belt_test_rank':
                resolvedValues[fieldName] = mapBeltRank(c.newRank ?? (c.metadata as any)?.belt_test_rank);
                break;
            }
          } else if (mapping.kind === 'signature' && mapping.signatureId) {
            const sig = c.mappedSignatures?.find((s: any) => s.id === mapping.signatureId);
            let imgUrl = sig?.signatureImageUrl;

            if (sig?.role === 'TRAINER' && c.trainerSignature?.signatureImageUrl) {
              imgUrl = c.trainerSignature.signatureImageUrl;
            } else if (sig?.role === 'COORDINATOR' && c.coordinatorSignature?.signatureImageUrl) {
              imgUrl = c.coordinatorSignature.signatureImageUrl;
            }

            if (imgUrl) {
              resolvedValues[fieldName] = { imageUrl: imgUrl };
            }
          }
        }

        pdfBytes = await generateDynamicCertificatePdf({
          templatePath: c.certificatePdfPath as string,
          fieldMappings: c.fieldMappings as any[],
          resolvedValues,
        });
      } else {
        pdfBytes = await generateCertificatePdf({
          name: c.profileName ?? c.profileNameBangla ?? c.participantName ?? 'Participant',
          programName: c.programTitle,
          date: day,
          month,
          year,
          certId: c.certificateNumber,
          trainerName: c.trainerSignature?.name ?? '',
          coordinatorName: c.coordinatorSignature?.name ?? '',
          trainerSignatureUrl: c.trainerSignature?.signatureImageUrl,
          coordinatorSignatureUrl: c.coordinatorSignature?.signatureImageUrl,
        });
      }

      pdfBytesArray.push(pdfBytes);
    }

    if (pdfBytesArray.length === 0) {
      return NextResponse.json({ error: 'Failed to generate any certificates' }, { status: 500 });
    }

    // Merge into single PDF
    const mergedPdf = await mergeCertificatePdfs(pdfBytesArray);

    const filename = `Certificates_Program_${programId}_${Date.now()}.pdf`;
    const buf = new Uint8Array(mergedPdf).buffer as ArrayBuffer;
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[cert-bulk-download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate bulk certificates' },
      { status: 500 }
    );
  }
}
