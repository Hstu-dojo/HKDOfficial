/**
 * Server-side certificate PDF generation using pdf-lib + node-canvas.
 *
 * This module is server-only — never import from client components.
 * It mirrors the pattern in src/lib/pdf/pdf-utils.ts but uses node-canvas
 * instead of browser canvas for text→PNG rendering.
 */

import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { createCanvas } from 'canvas';
import { readFile } from 'fs/promises';
import { join } from 'path';

import {
  CERT_FIELD_COORDS,
  CERT_SIGNATURE_POSITIONS,
  type CertFieldCoord,
} from './cert-fields';

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
  /** Month name (e.g. "January" or "জানুয়ারি") */
  month: string;
  /** Year (e.g. "2026") */
  year: string;
  /** Certificate number (e.g. "HKD-CERT-2026-0001") */
  certId: string;
  /** Trainer / Chief Instructor name */
  trainerName: string;
  /** Coordinator / General Secretary name */
  coordinatorName: string;
  /** Trainer signature image URL (Cloudinary) */
  trainerSignatureUrl?: string;
  /** Coordinator signature image URL (Cloudinary) */
  coordinatorSignatureUrl?: string;
}

// ---------------------------------------------------------------------------
// Server-side text → PNG via node-canvas
// ---------------------------------------------------------------------------

function renderTextToImage(
  text: string,
  fieldWidth: number,
  fieldHeight: number,
): Buffer {
  const scale = 4;
  const fontSize = fieldHeight * 0.85;
  const canvasWidth = fieldWidth * scale;
  const canvasHeight = fieldHeight * scale;

  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#000000';
  ctx.font = `${fontSize * scale}px "Noto Sans Bengali", "Noto Sans", Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 1 * scale, canvasHeight / 2);

  return canvas.toBuffer('image/png');
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
// Core: generate a single flattened certificate PDF
// ---------------------------------------------------------------------------

/**
 * Generates a single certificate PDF filled with the given data.
 * Returns flattened PDF bytes (Uint8Array).
 */
export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  // Load the fillable template
  const templatePath = join(process.cwd(), 'public', 'certs', 'fillable - program cert.pdf');
  const templateBytes = await readFile(templatePath);

  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const form = pdfDoc.getForm();
  const page = pdfDoc.getPages()[0];

  // Map CertificateData → field name → value
  const fieldValues: Record<string, string> = {
    name: data.name,
    program_name: data.programName,
    date: data.date,
    month: data.month,
    year: data.year,
    cert_id: data.certId,
    trainer_name: data.trainerName,
    coordinator_name: data.coordinatorName,
  };

  // Render each text field as a PNG image at exact coordinates
  for (const [fieldName, fieldValue] of Object.entries(fieldValues)) {
    if (!fieldValue) continue;
    const coords: CertFieldCoord | undefined = CERT_FIELD_COORDS[fieldName];
    if (!coords) continue;

    try {
      const pngBuffer = renderTextToImage(fieldValue, coords.w, coords.h);
      const pngImage = await pdfDoc.embedPng(pngBuffer);
      page.drawImage(pngImage, {
        x: coords.x,
        y: coords.y,
        width: coords.w,
        height: coords.h,
      });
    } catch (err) {
      console.warn(`[cert-pdf] Could not render field "${fieldName}":`, err);
    }
  }

  // Embed signature images
  if (data.trainerSignatureUrl) {
    try {
      const { buffer, type } = await fetchImageBuffer(data.trainerSignatureUrl);
      const img = type === 'png'
        ? await pdfDoc.embedPng(buffer)
        : await pdfDoc.embedJpg(buffer);
      const pos = CERT_SIGNATURE_POSITIONS.trainer;
      page.drawImage(img, { x: pos.x, y: pos.y, width: pos.w, height: pos.h });
    } catch (err) {
      console.warn('[cert-pdf] Could not embed trainer signature:', err);
    }
  }

  if (data.coordinatorSignatureUrl) {
    try {
      const { buffer, type } = await fetchImageBuffer(data.coordinatorSignatureUrl);
      const img = type === 'png'
        ? await pdfDoc.embedPng(buffer)
        : await pdfDoc.embedJpg(buffer);
      const pos = CERT_SIGNATURE_POSITIONS.coordinator;
      page.drawImage(img, { x: pos.x, y: pos.y, width: pos.w, height: pos.h });
    } catch (err) {
      console.warn('[cert-pdf] Could not embed coordinator signature:', err);
    }
  }

  // Flatten to prevent editing (fraud prevention)
  try {
    form.flatten();
  } catch {
    /* OK if form fields already flat or not present */
  }

  return await pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Merge multiple single-page certificate PDFs into one document
// ---------------------------------------------------------------------------

/**
 * Merges multiple certificate PDFs (each 1 page) into a single PDF document.
 */
export async function mergeCertificatePdfs(pdfBytesArray: Uint8Array[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();

  for (const pdfBytes of pdfBytesArray) {
    const srcDoc = await PDFDocument.load(pdfBytes);
    const [copiedPage] = await mergedDoc.copyPages(srcDoc, [0]);
    mergedDoc.addPage(copiedPage);
  }

  return await mergedDoc.save();
}
