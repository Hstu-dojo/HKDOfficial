'use client';

import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import {
  PHOTO_BOX,
  SIGNATURE_POSITIONS,
  FORM_FIELDS,
  FIELD_COORDS,
} from './form-fields';

export type FormData = Record<string, string>;

export interface ImageData {
  photo?: string; // base64 data URL
  signature?: string; // base64 data URL
}

// ---------------------------------------------------------------------------
// Canvas → PNG text renderer (handles Bangla / Unicode natively)
// ---------------------------------------------------------------------------

function renderTextToImage(
  text: string,
  fieldWidth: number,
  fieldHeight: number
): string {
  const scale = 4;
  const fontSize = fieldHeight * 0.85;
  const canvasWidth = fieldWidth * scale;
  const canvasHeight = fieldHeight * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = '#000000';
  ctx.font = `${fontSize * scale}px "Noto Sans Bengali", "Noto Sans", Arial, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 1 * scale, canvasHeight / 2);

  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getImageType(dataUrl: string): 'png' | 'jpg' {
  return dataUrl.includes('image/png') ? 'png' : 'jpg';
}

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------

/**
 * Fill the PDF template with form values and images.
 * All text is rendered as canvas PNG images → embedded at exact coords.
 */
export async function fillPdfForm(
  formValues: FormData,
  images: ImageData
): Promise<Uint8Array> {
  const response = await fetch('/blank-form.pdf');
  const pdfBytes = await response.arrayBuffer();

  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const form = pdfDoc.getForm();
  const page = pdfDoc.getPages()[0];

  // Map form field IDs → PDF field IDs
  const pdfFieldData: Record<string, string> = {};
  for (const field of FORM_FIELDS) {
    const value = formValues[field.id];
    if (value !== undefined && value !== '') {
      pdfFieldData[field.pdfFieldId] = value;
    }
  }

  // Draw each field's text as a rendered PNG image
  for (const [fieldName, fieldValue] of Object.entries(pdfFieldData)) {
    const coords = FIELD_COORDS[fieldName];
    if (!coords) continue;
    try {
      const pngDataUrl = renderTextToImage(fieldValue, coords.w, coords.h);
      if (pngDataUrl) {
        const pngBytes = dataUrlToUint8Array(pngDataUrl);
        const pngImage = await pdfDoc.embedPng(pngBytes);
        page.drawImage(pngImage, {
          x: coords.x,
          y: coords.y,
          width: coords.w,
          height: coords.h,
        });
      }
    } catch (err) {
      console.warn(`Could not render field ${fieldName}:`, err);
    }
  }

  // Remove form fields so they don't overlay
  try {
    form.flatten();
  } catch {
    /* OK if fields already flat */
  }

  // Embed photo
  if (images.photo) {
    try {
      const photoBytes = dataUrlToUint8Array(images.photo);
      const photoType = getImageType(images.photo);
      const image =
        photoType === 'png'
          ? await pdfDoc.embedPng(photoBytes)
          : await pdfDoc.embedJpg(photoBytes);
      page.drawImage(image, {
        x: PHOTO_BOX.x,
        y: PHOTO_BOX.y,
        width: PHOTO_BOX.width,
        height: PHOTO_BOX.height,
      });
    } catch (err) {
      console.error('Error embedding photo:', err);
    }
  }

  // Embed signature
  if (images.signature) {
    try {
      const sigBytes = dataUrlToUint8Array(images.signature);
      const sigType = getImageType(images.signature);
      const sigImage =
        sigType === 'png'
          ? await pdfDoc.embedPng(sigBytes)
          : await pdfDoc.embedJpg(sigBytes);
      const pos = SIGNATURE_POSITIONS.student;
      page.drawImage(sigImage, {
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
      });
    } catch (err) {
      console.error('Error embedding signature:', err);
    }
  }

  return await pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Download helpers
// ---------------------------------------------------------------------------

export function downloadPdf(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(pdfBytes)], {
    type: 'application/pdf',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBlankForm() {
  const a = document.createElement('a');
  a.href = '/blank-form.pdf';
  a.download = 'HKD_Registration_Form_Blank.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---------------------------------------------------------------------------
// Image validation
// ---------------------------------------------------------------------------

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  dimensions?: { width: number; height: number };
}

export function validateImage(
  file: File,
  type: 'photo' | 'signature'
): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const constraints =
      type === 'photo'
        ? {
            maxSizeMB: 5,
            maxSizeBytes: 5 * 1024 * 1024,
            acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
            minWidth: 150,
            minHeight: 180,
            maxWidth: 2000,
            maxHeight: 2400,
            recommendedWidth: 300,
            recommendedHeight: 360,
            aspectRatioMin: 0.6,
            aspectRatioMax: 1.0,
          }
        : {
            maxSizeMB: 2,
            maxSizeBytes: 2 * 1024 * 1024,
            acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
            minWidth: 50,
            minHeight: 20,
            maxWidth: 2000,
            maxHeight: 1000,
            recommendedWidth: 400,
            recommendedHeight: 150,
            aspectRatioMin: 0.5,
            aspectRatioMax: 8.0,
          };

    if (!constraints.acceptedTypes.includes(file.type)) {
      errors.push(
        `Invalid file type: ${file.type || 'unknown'}. Please upload a JPG or PNG.`
      );
    }
    if (file.size > constraints.maxSizeBytes) {
      errors.push(
        `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds ${constraints.maxSizeMB}MB.`
      );
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const { width, height } = img;

      if (width < constraints.minWidth || height < constraints.minHeight) {
        errors.push(
          `Image too small (${width}×${height}px). Min: ${constraints.minWidth}×${constraints.minHeight}px.`
        );
      }
      if (width > constraints.maxWidth || height > constraints.maxHeight) {
        warnings.push(
          `Image very large (${width}×${height}px). Recommended: ${constraints.recommendedWidth}×${constraints.recommendedHeight}px.`
        );
      }

      const aspectRatio = width / height;
      if (
        aspectRatio < constraints.aspectRatioMin ||
        aspectRatio > constraints.aspectRatioMax
      ) {
        warnings.push(
          type === 'photo'
            ? `Aspect ratio (${aspectRatio.toFixed(2)}) is unusual for a photo. Portrait orientation (~0.75) recommended.`
            : `Aspect ratio (${aspectRatio.toFixed(2)}) is unusual for a signature. Landscape orientation (~2.5) recommended.`
        );
      }

      resolve({
        valid: errors.length === 0,
        errors,
        warnings,
        dimensions: { width, height },
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      errors.push('Could not read image file. It may be corrupted.');
      resolve({ valid: false, errors, warnings });
    };

    img.src = objectUrl;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY_PREFIX = 'hkd_course_form_';

export function saveFormToLocalStorage(
  courseId: string,
  formData: FormData,
  images: ImageData
) {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${courseId}_data`,
      JSON.stringify(formData)
    );
    if (images.photo) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${courseId}_photo`, images.photo);
    }
    if (images.signature) {
      localStorage.setItem(
        `${STORAGE_KEY_PREFIX}${courseId}_signature`,
        images.signature
      );
    }
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

export function loadFormFromLocalStorage(courseId: string): {
  formData: FormData;
  images: ImageData;
} {
  try {
    const formDataStr = localStorage.getItem(
      `${STORAGE_KEY_PREFIX}${courseId}_data`
    );
    const photo =
      localStorage.getItem(`${STORAGE_KEY_PREFIX}${courseId}_photo`) || undefined;
    const signature =
      localStorage.getItem(`${STORAGE_KEY_PREFIX}${courseId}_signature`) ||
      undefined;
    return {
      formData: formDataStr ? JSON.parse(formDataStr) : {},
      images: { photo, signature },
    };
  } catch {
    return { formData: {}, images: {} };
  }
}

export function clearFormLocalStorage(courseId: string) {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${courseId}_data`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${courseId}_photo`);
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${courseId}_signature`);
}
