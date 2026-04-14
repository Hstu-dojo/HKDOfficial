import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from '../auth';
import { programTypeEnum } from '../enums';

export type ProgramCertificateMappingKind = 'static' | 'dynamic' | 'signature';

export type ProgramCertificateStaticSource =
  | 'custom_text'
  | 'program_title'
  | 'program_date'
  | 'program_month'
  | 'program_year';

export type ProgramCertificateDynamicSource =
  | 'participant_name'
  | 'belt_test_rank'
  | 'certificate_number';

export type ProgramCertificateWidgetRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ProgramCertificateFieldMapping =
  | {
      pdfFieldName: string;
      kind: 'static';
      staticSource: ProgramCertificateStaticSource;
      staticText?: string;
      widgets?: ProgramCertificateWidgetRect[];
    }
  | {
      pdfFieldName: string;
      kind: 'dynamic';
      dynamicSource: ProgramCertificateDynamicSource;
      widgets?: ProgramCertificateWidgetRect[];
    }
  | {
      pdfFieldName: string;
      kind: 'signature';
      signatureId: string;
      widgets?: ProgramCertificateWidgetRect[];
    };

// Program Types - dynamic templates for Programs
export const programTypes = pgTable('program_types', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().unique(),

  // Category drives business rules (e.g. Belt Test requires a course)
  category: programTypeEnum('category').notNull().default('OTHER'),

  // Public-relative path, e.g. "certs/fillable - program cert.pdf"
  certificatePdfPath: text('certificate_pdf_path').notNull(),

  // JSON field mapping config used later for certificate generation
  fieldMappings: jsonb('field_mappings').$type<ProgramCertificateFieldMapping[]>().notNull().default(sql`'[]'::jsonb`),

  isActive: boolean('is_active').notNull().default(true),

  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ProgramType = typeof programTypes.$inferSelect;
export type NewProgramType = typeof programTypes.$inferInsert;
