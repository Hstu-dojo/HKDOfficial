'use server';

import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { db } from '@/lib/connect-db';
import { programTypes, programs } from '@/db/schemas/karate';
import { user } from '@/db/schemas/auth';
import { revalidatePath } from 'next/cache';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import type {
  NewProgramType,
  ProgramType,
  ProgramCertificateWidgetRect,
  ProgramCertificateFieldMapping,
} from '@/db/schemas/karate/program-types';

export type AvailableCertificateTemplate = {
  value: string; // public-relative, e.g. "certs/foo.pdf"
  label: string; // filename
};

export type ExtractedPdfField = {
  name: string;
  fieldType: string;
  widgets: ProgramCertificateWidgetRect[];
};

function walkUpDirs(startDir: string, maxLevels = 12) {
  const dirs: string[] = [];
  let current = startDir;
  for (let i = 0; i < maxLevels; i++) {
    dirs.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return dirs;
}

function getRuntimeAnchorDirs() {
  const anchors: string[] = [];
  try {
    anchors.push(process.cwd());
  } catch {
    // ignore
  }

  // When bundled, the module directory can be a useful anchor (e.g. .next/server/app/...).
  try {
    // eslint-disable-next-line no-undef
    if (typeof __dirname === 'string' && __dirname) anchors.push(__dirname);
  } catch {
    // ignore
  }

  return Array.from(new Set(anchors));
}

function getPublicDirCandidates() {
  const anchors = getRuntimeAnchorDirs();
  const candidates: string[] = [];
  for (const anchor of anchors) {
    for (const dir of walkUpDirs(anchor)) {
      candidates.push(path.join(dir, 'public'));
    }
  }
  return Array.from(new Set(candidates));
}

async function resolvePublicCertsDir() {
  const candidates = getPublicDirCandidates().map((p) => path.join(p, 'certs'));
  for (const candidate of candidates) {
    try {
      const s = await stat(candidate);
      if (s.isDirectory()) return candidate;
    } catch {
      // continue
    }
  }
  return null;
}

async function resolvePublicFileAbsPath(publicRelativePath: string) {
  const candidates = getPublicDirCandidates().map((p) => path.join(p, publicRelativePath));
  for (const candidate of candidates) {
    try {
      const s = await stat(candidate);
      if (s.isFile()) return candidate;
    } catch {
      // continue
    }
  }
  return null;
}

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  const localUser = await db.query.user.findFirst({
    where: eq(user.supabaseUserId, session.user.id),
  });
  return localUser?.id ?? null;
}

function assertSafeCertPath(publicRelativePath: string) {
  // Only allow selecting from /public/certs
  if (!publicRelativePath || typeof publicRelativePath !== 'string') {
    throw new Error('Invalid certificate template path');
  }
  if (publicRelativePath.includes('..') || publicRelativePath.startsWith('/') || publicRelativePath.startsWith('\\')) {
    throw new Error('Invalid certificate template path');
  }
  if (!publicRelativePath.startsWith('certs/')) {
    throw new Error('Invalid certificate template path');
  }
  if (!publicRelativePath.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF templates are supported');
  }
}

// ---------------------------------------------------------------------------
// PDF templates
// ---------------------------------------------------------------------------

export async function listCertificateTemplates() {
  try {
    const certsDir = await resolvePublicCertsDir();
    if (!certsDir) {
      return {
        success: false as const,
        error:
          'Cannot find the "public/certs" directory at runtime. ' +
          'If you are running a standalone build, ensure the public folder is copied and you start the server from the app root.',
      };
    }

    const files = await readdir(certsDir);
    const pdfs = files
      .filter((f) => f.toLowerCase().endsWith('.pdf'))
      .sort((a, b) => a.localeCompare(b))
      .map((filename) => ({
        value: `certs/${filename}`,
        label: filename,
      } satisfies AvailableCertificateTemplate));

    return { success: true as const, data: pdfs };
  } catch (error: any) {
    console.error('[program-types] listCertificateTemplates error:', error);
    const msg = error?.message ? String(error.message) : String(error);
    const code = error?.code ? String(error.code) : '';
    return {
      success: false as const,
      error: `Failed to list certificate templates${code ? ` (${code})` : ''}: ${msg}`,
    };
  }
}

export async function extractCertificateFields(publicRelativePath: string) {
  try {
    assertSafeCertPath(publicRelativePath);

    const abs = await resolvePublicFileAbsPath(publicRelativePath);
    if (!abs) {
      return {
        success: false as const,
        error:
          `Cannot find certificate template at runtime: ${publicRelativePath}. ` +
          `Ensure it exists under public/certs and is included in your deployment image.`,
      };
    }
    const pdfBytes = await readFile(abs);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const extracted: ExtractedPdfField[] = fields.map((field) => {
      const fieldType = field.constructor.name;
      const name = field.getName();

      const widgets = (field as any).acroField?.getWidgets?.() ?? [];
      const rects: ProgramCertificateWidgetRect[] = [];
      for (const widget of widgets) {
        try {
          const rect = widget.getRectangle();
          rects.push({
            x: Number(rect.x),
            y: Number(rect.y),
            width: Number(rect.width),
            height: Number(rect.height),
          });
        } catch {
          // ignore
        }
      }

      return { name, fieldType, widgets: rects };
    });

    return { success: true as const, data: extracted };
  } catch (error: any) {
    console.error('[program-types] extractCertificateFields error:', error);
    return { success: false as const, error: error?.message || 'Failed to extract PDF fields' };
  }
}

// ---------------------------------------------------------------------------
// Program Types CRUD
// ---------------------------------------------------------------------------

export async function getProgramTypes(options?: { includeInactive?: boolean; search?: string }) {
  try {
    const includeInactive = options?.includeInactive ?? true;
    const search = options?.search?.trim();

    const whereParts: any[] = [];
    if (!includeInactive) whereParts.push(eq(programTypes.isActive, true));
    if (search) whereParts.push(ilike(programTypes.name, `%${search}%`));

    const rows = await db.query.programTypes.findMany({
      where: whereParts.length ? and(...whereParts) : undefined,
      orderBy: [desc(programTypes.createdAt)],
    });

    return { success: true as const, data: rows };
  } catch (error) {
    console.error('[program-types] getProgramTypes error:', error);
    return { success: false as const, error: 'Failed to fetch program types' };
  }
}

export async function createProgramType(data: Omit<NewProgramType, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false as const, error: 'Unauthorized' };

    if (!data.name?.trim()) return { success: false as const, error: 'Name is required' };
    if (!data.certificatePdfPath?.trim()) return { success: false as const, error: 'Certificate template is required' };
    assertSafeCertPath(data.certificatePdfPath);

    const [row] = await db
      .insert(programTypes)
      .values({
        ...data,
        name: data.name.trim(),
        createdBy: userId,
      })
      .returning();

    revalidatePath('/admin/programs');
    revalidatePath('/admin/programs/types');

    return { success: true as const, data: row };
  } catch (error: any) {
    console.error('[program-types] createProgramType error:', error);
    return { success: false as const, error: error?.message || 'Failed to create program type' };
  }
}

export async function updateProgramType(
  id: string,
  data: Partial<Pick<ProgramType, 'name' | 'category' | 'certificatePdfPath' | 'fieldMappings' | 'isActive'>>
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false as const, error: 'Unauthorized' };

    const patch: any = { ...data, updatedAt: new Date() };

    if (typeof patch.name === 'string') {
      patch.name = patch.name.trim();
      if (!patch.name) return { success: false as const, error: 'Name is required' };
    }

    if (typeof patch.certificatePdfPath === 'string') {
      patch.certificatePdfPath = patch.certificatePdfPath.trim();
      if (!patch.certificatePdfPath) return { success: false as const, error: 'Certificate template is required' };
      assertSafeCertPath(patch.certificatePdfPath);
    }

    if (patch.fieldMappings) {
      // Basic shape check: ensure each mapping has a pdfFieldName and kind.
      const mappings = patch.fieldMappings as ProgramCertificateFieldMapping[];
      if (!Array.isArray(mappings)) return { success: false as const, error: 'Invalid field mappings' };
      for (const m of mappings) {
        if (!m || typeof (m as any).pdfFieldName !== 'string' || !(m as any).pdfFieldName.trim()) {
          return { success: false as const, error: 'Invalid field mappings' };
        }
        if (!['static', 'dynamic', 'signature'].includes((m as any).kind)) {
          return { success: false as const, error: 'Invalid field mappings' };
        }
      }
    }

    const [row] = await db.update(programTypes).set(patch).where(eq(programTypes.id, id)).returning();

    revalidatePath('/admin/programs');
    revalidatePath('/admin/programs/types');

    return { success: true as const, data: row };
  } catch (error: any) {
    console.error('[program-types] updateProgramType error:', error);
    return { success: false as const, error: error?.message || 'Failed to update program type' };
  }
}

export async function deleteProgramType(id: string) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false as const, error: 'Unauthorized' };

    const inUse = await db
      .select({ id: programs.id })
      .from(programs)
      .where(eq(programs.programTypeId, id))
      .limit(1);

    if (inUse.length > 0) {
      return { success: false as const, error: 'Cannot delete: program type is used by existing programs. Deactivate it instead.' };
    }

    await db.delete(programTypes).where(eq(programTypes.id, id));

    revalidatePath('/admin/programs/types');

    return { success: true as const };
  } catch (error: any) {
    console.error('[program-types] deleteProgramType error:', error);
    return { success: false as const, error: error?.message || 'Failed to delete program type' };
  }
}
