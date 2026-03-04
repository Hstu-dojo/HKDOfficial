/**
 * Server-side certificate PDF generation using pdf-lib.
 *
 * Strategy:
 *  1. Load the fillable PDF template (AcroForm text fields).
 *  2. For large display fields (name, program_name): draw text DIRECTLY on the
 *     page with page.drawText() so there is zero clipping. Leave those form
 *     fields empty so they disappear on flatten.
 *  3. For small metadata fields (date, month, year, cert_id, trainer/coordinator
 *     names): set via form.getTextField().setText() — expand widget width by 8pt
 *     to absorb pdf-lib's flatten clipping margin.
 *  4. Overlay signature images on the PDFSignature widget rectangles.
 *  5. Flatten the form so the PDF is no longer editable.
 *
 * This module is server-only — never import from client components.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CertificateData {
  name: string;
  programName: string;
  date: string;
  month: string;
  year: string;
  certId: string;
  trainerName: string;
  coordinatorName: string;
  trainerSignatureUrl?: string;
  coordinatorSignatureUrl?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchImageBuffer(url: string): Promise<{ buffer: Buffer; type: 'png' | 'jpg' }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get('content-type') ?? '';
  return { buffer: buf, type: ct.includes('png') ? 'png' : 'jpg' };
}

/**
 * Draw centred text inside a field rect directly on the page,
 * bypassing AcroForm clipping entirely.
 *
 * fieldRect comes from PDF introspection (bottom-left origin):
 *   name:         x:151, y:315, w:298, h:36
 *   program_name: x:151, y:271, w:297, h:23
 */
async function drawCentredText(
  pdfDoc: PDFDocument,
  page: ReturnType<PDFDocument['getPages']>[0],
  text: string,
  rect: { x: number; y: number; w: number; h: number },
  maxFontSize: number,
) {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Auto-shrink font so text fits inside the rect width
  let fontSize = maxFontSize;
  while (fontSize > 6) {
    const tw = font.widthOfTextAtSize(text, fontSize);
    if (tw <= rect.w) break;
    fontSize -= 0.5;
  }

  const textWidth = font.widthOfTextAtSize(text, fontSize);
  // Centre horizontally
  const x = rect.x + (rect.w - textWidth) / 2;
  // Centre vertically: pdf-lib drawText y = baseline; ascent ≈ 0.72 × fontSize
  const y = rect.y + (rect.h - fontSize) / 2 + fontSize * 0.15;

  page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
}

// ---------------------------------------------------------------------------
// Core: fill + flatten certificate PDF
// ---------------------------------------------------------------------------

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const templateBytes = await readFile(
    join(process.cwd(), 'public', 'certs', 'fillable - program cert.pdf')
  );

  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const page = pdfDoc.getPages()[0];

  // ── Large display fields — draw directly (no AcroForm clipping) ──────────
  // Field rects confirmed via PDF introspection (bottom-left origin):
  //   name:         x:151, y:315, w:298, h:36
  //   program_name: x:151, y:271, w:297, h:23
  if (data.name) {
    await drawCentredText(pdfDoc, page, data.name,
      { x: 151, y: 315, w: 298, h: 36 }, 22);
  }
  if (data.programName) {
    await drawCentredText(pdfDoc, page, data.programName,
      { x: 151, y: 271, w: 297, h: 23 }, 14);
  }

  // ── Small metadata fields — fill via AcroForm (expand width to avoid clip) ─
  const smallFields: Record<string, string> = {
    date:             data.date,
    month:            data.month,
    year:             data.year,
    cert_id:          data.certId,
  };

  for (const [fieldName, value] of Object.entries(smallFields)) {
    if (!value) continue;
    try {
      const field = form.getTextField(fieldName);
      // Expand widget +8pt so the last glyph isn't clipped on flatten
      const widgets = (field as any).acroField.getWidgets();
      for (const w of widgets) {
        const r = w.getRectangle();
        w.setRectangle({ x: r.x, y: r.y, width: r.width + 8, height: r.height });
      }
      field.setText(value);
    } catch (err) {
      console.warn(`[cert-pdf] Could not set field "${fieldName}":`, err);
    }
  }

  // ── Signature name fields — draw directly on page (same approach as name) ─
  // Read the field rect from the PDF form, draw text centred inside it,
  // then clear the form field so it doesn't double-render on flatten.
  for (const [fieldName, value] of Object.entries({
    trainer_name: data.trainerName ?? '',
    coordinator_name: data.coordinatorName ?? '',
  })) {
    if (!value) continue;
    try {
      const field = form.getTextField(fieldName);
      const widgets = (field as any).acroField.getWidgets();
      if (widgets.length > 0) {
        const r = widgets[0].getRectangle();
        await drawCentredText(pdfDoc, page, value,
          { x: r.x, y: r.y, w: r.width, h: r.height }, 10);
      }
      // Clear the form field so it doesn't render on top after flatten
      field.setText('');
    } catch (err) {
      console.warn(`[cert-pdf] Could not draw field "${fieldName}":`, err);
    }
  }

  // ── Signature image overlays ──────────────────────────────────────────────
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

  // ── Flatten — makes PDF non-editable ─────────────────────────────────────
  try { form.flatten(); } catch { /* ignore if already flat */ }

  return await pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Merge multiple PDFs into one
// ---------------------------------------------------------------------------

export async function mergeCertificatePdfs(pdfBytesArray: Uint8Array[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();
  for (const bytes of pdfBytesArray) {
    const src = await PDFDocument.load(bytes);
    const [page] = await mergedDoc.copyPages(src, [0]);
    mergedDoc.addPage(page);
  }
  return await mergedDoc.save();
}


