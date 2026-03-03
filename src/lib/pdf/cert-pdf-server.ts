/**
 * Server-side certificate PDF generation using pdf-lib.
 *
 * Strategy:
 *  1. Load the fillable PDF template (has AcroForm text fields).
 *  2. Fill each text field directly using form.getTextField(name).setText(value).
 *  3. Overlay signature images on top of the PDFSignature field rectangles.
 *  4. Flatten the form so the PDF is no longer editable.
 *
 * This module is server-only — never import from client components.
 */

import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CertificateData {
  /** Participant full name (English or Bangla) */
  name: string;
  /** Program title */
  programName: string;
  /** Day of month (e.g. "15") */
  date: string;
  /** Month name (e.g. "January") */
  month: string;
  /** Year (e.g. "2026") */
  year: string;
  /** Certificate number (e.g. "HKD-CERT-2026-0001") */
  certId: string;
  /** Trainer / Chief Instructor name */
  trainerName: string;
  /** Coordinator / General Secretary name */
  coordinatorName: string;
  /** Trainer signature image URL (remote) */
  trainerSignatureUrl?: string;
  /** Coordinator signature image URL (remote) */
  coordinatorSignatureUrl?: string;
}

// ---------------------------------------------------------------------------
// Fetch remote image as Buffer
// ---------------------------------------------------------------------------

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; type: 'png' | 'jpg' }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const arrayBuf = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);
  const contentType = res.headers.get('content-type') ?? '';
  const type = contentType.includes('png') ? 'png' as const : 'jpg' as const;
  return { buffer, type };
}

// ---------------------------------------------------------------------------
// Core: fill + flatten certificate PDF
// ---------------------------------------------------------------------------

/**
 * Fills the fillable PDF template fields, overlays any signature images,
 * then flattens (locks) the form so it cannot be re-edited.
 *
 * Field names in the template (confirmed via pdf-lib introspection):
 *   name, program_name, date, month, year, cert_id,
 *   trainer_name, coordinator_name,
 *   trainer_signature (PDFSignature), coordinator_signature (PDFSignature)
 */
export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const templatePath = join(process.cwd(), 'public', 'certs', 'fillable - program cert.pdf');
  const templateBytes = await readFile(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const page = pdfDoc.getPages()[0];

  // ── Fill text fields ──────────────────────────────────────────────────────
  const textFields: Record<string, string> = {
    name:               data.name,
    program_name:       data.programName,
    date:               data.date,
    month:              data.month,
    year:               data.year,
    cert_id:            data.certId,
    trainer_name:       data.trainerName ?? '',
    coordinator_name:   data.coordinatorName ?? '',
  };

  for (const [fieldName, value] of Object.entries(textFields)) {
    if (!value) continue;
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
    } catch (err) {
      console.warn(`[cert-pdf] Could not set field "${fieldName}":`, err);
    }
  }

  // ── Overlay signature images on the PDFSignature field rectangles ─────────
  // Positions match the actual widget rectangles confirmed from PDF introspection:
  //   trainer_signature:     x:140, y:135, w:135, h:33
  //   coordinator_signature: x:324, y:135, w:135, h:33

  if (data.trainerSignatureUrl) {
    try {
      const { buffer, type } = await fetchImageBuffer(data.trainerSignatureUrl);
      const img = type === 'png' ? await pdfDoc.embedPng(buffer) : await pdfDoc.embedJpg(buffer);
      page.drawImage(img, { x: 140, y: 135, width: 135, height: 33 });
    } catch (err) {
      console.warn('[cert-pdf] Could not embed trainer signature image:', err);
    }
  }

  if (data.coordinatorSignatureUrl) {
    try {
      const { buffer, type } = await fetchImageBuffer(data.coordinatorSignatureUrl);
      const img = type === 'png' ? await pdfDoc.embedPng(buffer) : await pdfDoc.embedJpg(buffer);
      page.drawImage(img, { x: 324, y: 135, width: 135, height: 33 });
    } catch (err) {
      console.warn('[cert-pdf] Could not embed coordinator signature image:', err);
    }
  }

  // ── Flatten — lock the form so it cannot be edited ───────────────────────
  try {
    form.flatten();
  } catch {
    /* safe to ignore if already flat */
  }

  return await pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Merge multiple single-page certificate PDFs into one document
// ---------------------------------------------------------------------------

export async function mergeCertificatePdfs(pdfBytesArray: Uint8Array[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();
  for (const pdfBytes of pdfBytesArray) {
    const srcDoc = await PDFDocument.load(pdfBytes);
    const [copiedPage] = await mergedDoc.copyPages(srcDoc, [0]);
    mergedDoc.addPage(copiedPage);
  }
  return await mergedDoc.save();
}

