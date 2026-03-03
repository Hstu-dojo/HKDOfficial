import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { eq, and } from 'drizzle-orm';
import {
  programCertificates,
  certificateSignatures,
} from '@/db/schemas/karate/certificates';
import { programs } from '@/db/schemas/karate/programs';
import { profiles } from '@/db/schemas/karate/members';

/**
 * GET /api/certificates/verify?certId=HKD-P-XXXXXX
 *
 * Public endpoint — no auth required.
 * Verifies a certificate by its certificate number and returns public details.
 */
export async function GET(request: NextRequest) {
  try {
    const certId = request.nextUrl.searchParams.get('certId');
    if (!certId || certId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Certificate ID is required' },
        { status: 400 }
      );
    }

    const [cert] = await db
      .select({
        id: programCertificates.id,
        certificateNumber: programCertificates.certificateNumber,
        status: programCertificates.status,
        issueDate: programCertificates.issueDate,
        trainerSignatureId: programCertificates.trainerSignatureId,
        coordinatorSignatureId: programCertificates.coordinatorSignatureId,
        // Program info
        programTitle: programs.title,
        programType: programs.type,
        programStartDate: programs.startDate,
        programEndDate: programs.endDate,
        programLocation: programs.location,
        programDescription: programs.description,
        // Profile info (public-safe fields only)
        profileName: profiles.fullNameEnglish,
        profileNameBangla: profiles.fullNameBangla,
        memberNumber: profiles.memberNumber,
      })
      .from(programCertificates)
      .innerJoin(programs, eq(programCertificates.programId, programs.id))
      .innerJoin(profiles, eq(programCertificates.profileId, profiles.id))
      .where(
        and(
          eq(programCertificates.certificateNumber, certId.trim()),
          eq(programCertificates.status, 'ISSUED')
        )
      )
      .limit(1);

    if (!cert) {
      return NextResponse.json(
        { valid: false, error: 'Certificate not found or has been revoked' },
        { status: 404 }
      );
    }

    // Get signature data for display
    let trainerSig = null;
    let coordinatorSig = null;

    if (cert.trainerSignatureId) {
      const sig = await db.query.certificateSignatures.findFirst({
        where: eq(certificateSignatures.id, cert.trainerSignatureId),
      });
      if (sig) {
        trainerSig = { name: sig.name, title: sig.title, role: sig.role };
      }
    }
    if (cert.coordinatorSignatureId) {
      const sig = await db.query.certificateSignatures.findFirst({
        where: eq(certificateSignatures.id, cert.coordinatorSignatureId),
      });
      if (sig) {
        coordinatorSig = { name: sig.name, title: sig.title, role: sig.role };
      }
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        id: cert.id,
        certificateNumber: cert.certificateNumber,
        issueDate: cert.issueDate,
        recipientName: cert.profileName ?? cert.profileNameBangla ?? 'Participant',
        recipientNameBangla: cert.profileNameBangla,
        memberNumber: cert.memberNumber,
        program: {
          title: cert.programTitle,
          type: cert.programType,
          startDate: cert.programStartDate,
          endDate: cert.programEndDate,
          location: cert.programLocation,
          description: cert.programDescription,
        },
        signatures: {
          trainer: trainerSig,
          coordinator: coordinatorSig,
        },
      },
    });
  } catch (error) {
    console.error('[cert-verify] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify certificate' },
      { status: 500 }
    );
  }
}
