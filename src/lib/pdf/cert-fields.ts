// Certificate PDF field coordinates — extracted from fillable program cert PDF
// Template: /public/certs/fillable - program cert.pdf
// Page: 1 page, landscape 842.25 x 595.5

export interface CertFieldCoord {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Text field coordinates on the certificate PDF.
 * These map directly to the AcroForm field positions.
 */
export const CERT_FIELD_COORDS: Record<string, CertFieldCoord> = {
  // Participant name (large, centered)
  name:              { x: 151, y: 315, w: 298, h: 36 },
  // Program title
  program_name:      { x: 151, y: 271, w: 297, h: 23 },
  // Date components
  date:              { x: 193, y: 234, w: 52,  h: 13 },
  month:             { x: 278, y: 233, w: 52,  h: 13 },
  year:              { x: 386, y: 233, w: 52,  h: 13 },
  // Certificate number
  cert_id:           { x: 363, y: 171, w: 79,  h: 18 },
  // Signer names (text below signatures)
  trainer_name:      { x: 140, y: 117, w: 134, h: 15 },
  coordinator_name:  { x: 325, y: 117, w: 134, h: 15 },
};

/**
 * Signature image positions on the certificate PDF.
 * These are overlay regions where signature PNGs are drawn.
 */
export const CERT_SIGNATURE_POSITIONS = {
  trainer:     { x: 140, y: 135, w: 135, h: 33 },
  coordinator: { x: 324, y: 135, w: 135, h: 33 },
} as const;

/**
 * Page dimensions for the certificate PDF template.
 */
export const CERT_PAGE = {
  width: 842.25,
  height: 595.5,
  orientation: 'landscape' as const,
};

/** All text field names on the certificate */
export type CertTextFieldName = keyof typeof CERT_FIELD_COORDS;

/** All signature slot names on the certificate */
export type CertSignatureSlot = keyof typeof CERT_SIGNATURE_POSITIONS;
