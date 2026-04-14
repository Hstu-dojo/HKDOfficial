'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { toast } from 'sonner';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import type { ProgramType, ProgramCertificateFieldMapping } from '@/db/schemas/karate/program-types';
import {
  createProgramType,
  deleteProgramType,
  extractCertificateFields,
  getProgramTypes,
  listCertificateTemplates,
  updateProgramType,
  type AvailableCertificateTemplate,
  type ExtractedPdfField,
} from '@/actions/program-types-actions';
import { getActiveSignatures } from '@/actions/certificate-actions';
import type { CertificateSignature } from '@/db/schemas/karate/certificates';
import Link from 'next/link';

const CATEGORY_OPTIONS = [
  { value: 'BELT_TEST', label: 'Belt Test' },
  { value: 'COMPETITION', label: 'Competition' },
  { value: 'SEMINAR', label: 'Seminar' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'SPECIAL_TRAINING', label: 'Special Training' },
  { value: 'OTHER', label: 'Other' },
] as const;

type MappingKind = '' | 'static' | 'dynamic' | 'signature';

type UiFieldMappingState = {
  kind: MappingKind;
  staticSource: '' | 'custom_text' | 'program_title' | 'program_date' | 'program_month' | 'program_year';
  staticText: string;
  dynamicSource: '' | 'participant_name' | 'belt_test_rank' | 'certificate_number';
  signatureId: string;
};

function emptyFieldState(): UiFieldMappingState {
  return {
    kind: '',
    staticSource: '',
    staticText: '',
    dynamicSource: '',
    signatureId: '',
  };
}

interface ProgramTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: ProgramType | null;
}

function ProgramTypeFormModal({ isOpen, onClose, onSuccess, initialData }: ProgramTypeFormModalProps) {
  const [saving, setSaving] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingFields, setLoadingFields] = useState(false);
  const [templates, setTemplates] = useState<AvailableCertificateTemplate[]>([]);
  const [extractedFields, setExtractedFields] = useState<ExtractedPdfField[]>([]);
  const [signatures, setSignatures] = useState<CertificateSignature[]>([]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('OTHER');
  const [certificatePdfPath, setCertificatePdfPath] = useState('');

  const [fieldStates, setFieldStates] = useState<Record<string, UiFieldMappingState>>({});

  const staticSourceOptions = useMemo(
    () => [
      { value: 'program_title', label: 'Program Title' },
      { value: 'program_date', label: 'Program Date (full)' },
      { value: 'program_month', label: 'Program Month' },
      { value: 'program_year', label: 'Program Year' },
      { value: 'custom_text', label: 'Custom Text' },
    ] as const,
    []
  );

  const dynamicSourceOptions = useMemo(
    () => [
      { value: 'participant_name', label: 'Participant Name' },
      { value: 'belt_test_rank', label: 'Belt Test Rank' },
      { value: 'certificate_number', label: 'Certificate Number' },
    ] as const,
    []
  );

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await listCertificateTemplates();
      if (!res.success) throw new Error(res.error);
      setTemplates(res.data);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load certificate templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const loadActiveSignatures = useCallback(async () => {
    try {
      const res = await getActiveSignatures();
      if (!res.success) return;
      setSignatures(res.data || []);
    } catch {
      // ignore; signatures are optional until user selects signature mapping
    }
  }, []);

  const loadFields = useCallback(async (nextPath: string) => {
    if (!nextPath) {
      setExtractedFields([]);
      setFieldStates({});
      return;
    }

    setLoadingFields(true);
    try {
      const res = await extractCertificateFields(nextPath);
      if (!res.success) throw new Error(res.error);
      setExtractedFields(res.data);

      const nextStates: Record<string, UiFieldMappingState> = {};
      for (const f of res.data) {
        nextStates[f.name] = emptyFieldState();
      }
      setFieldStates(nextStates);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to extract PDF fields');
      setExtractedFields([]);
      setFieldStates({});
    } finally {
      setLoadingFields(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    setName(initialData?.name ?? '');
    setCategory((initialData?.category as any) ?? 'OTHER');
    setCertificatePdfPath(initialData?.certificatePdfPath ?? '');
    setExtractedFields([]);
    setFieldStates({});

    loadTemplates();
    loadActiveSignatures();
  }, [isOpen, initialData, loadTemplates, loadActiveSignatures]);

  useEffect(() => {
    if (!isOpen) return;
    if (!certificatePdfPath) return;

    // When editing, load fields for selected PDF so user can remap.
    loadFields(certificatePdfPath);
  }, [certificatePdfPath, isOpen, loadFields]);

  useEffect(() => {
    if (!isOpen) return;
    if (!initialData) return;
    const existingMappings = (initialData.fieldMappings || []) as ProgramCertificateFieldMapping[];
    if (!existingMappings.length) return;
    if (!extractedFields.length) return;

    setFieldStates((prev) => {
      const next: Record<string, UiFieldMappingState> = { ...prev };

      // Ensure all extracted fields exist
      for (const f of extractedFields) {
        next[f.name] = next[f.name] || emptyFieldState();
      }

      for (const m of existingMappings) {
        if (!m || !m.pdfFieldName) continue;

        if (m.kind === 'static') {
          next[m.pdfFieldName] = {
            kind: 'static',
            staticSource: (m.staticSource as any) || '',
            staticText: m.staticText || '',
            dynamicSource: '',
            signatureId: '',
          };
        }

        if (m.kind === 'dynamic') {
          next[m.pdfFieldName] = {
            kind: 'dynamic',
            staticSource: '',
            staticText: '',
            dynamicSource: (m.dynamicSource as any) || '',
            signatureId: '',
          };
        }

        if (m.kind === 'signature') {
          next[m.pdfFieldName] = {
            kind: 'signature',
            staticSource: '',
            staticText: '',
            dynamicSource: '',
            signatureId: m.signatureId || '',
          };
        }
      }

      return next;
    });
  }, [extractedFields, initialData, isOpen]);

  const buildFieldMappings = (): ProgramCertificateFieldMapping[] => {
    const mappings: ProgramCertificateFieldMapping[] = [];

    for (const f of extractedFields) {
      const st = fieldStates[f.name];
      if (!st || !st.kind) continue; // allow partial mapping

      if (st.kind === 'static') {
        if (!st.staticSource) throw new Error(`Select static source for field: ${f.name}`);
        if (st.staticSource === 'custom_text' && !st.staticText.trim()) {
          throw new Error(`Enter custom text for field: ${f.name}`);
        }
        mappings.push({
          pdfFieldName: f.name,
          kind: 'static',
          staticSource: st.staticSource as any,
          staticText: st.staticSource === 'custom_text' ? st.staticText.trim() : undefined,
          widgets: f.widgets,
        });
      }

      if (st.kind === 'dynamic') {
        if (!st.dynamicSource) throw new Error(`Select dynamic source for field: ${f.name}`);
        mappings.push({
          pdfFieldName: f.name,
          kind: 'dynamic',
          dynamicSource: st.dynamicSource as any,
          widgets: f.widgets,
        });
      }

      if (st.kind === 'signature') {
        if (!st.signatureId) throw new Error(`Select signature for field: ${f.name}`);
        mappings.push({
          pdfFieldName: f.name,
          kind: 'signature',
          signatureId: st.signatureId,
          widgets: f.widgets,
        });
      }
    }

    return mappings;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Type name is required');
      return;
    }
    if (!certificatePdfPath) {
      toast.error('Please select a certificate template');
      return;
    }

    setSaving(true);
    try {
      const fieldMappings = buildFieldMappings();

      if (initialData) {
        const res = await updateProgramType(initialData.id, {
          name: name.trim(),
          category: category as any,
          certificatePdfPath,
          fieldMappings,
        });
        if (!res.success) throw new Error(res.error);
        toast.success('Program type updated');
      } else {
        const res = await createProgramType({
          name: name.trim(),
          category: category as any,
          certificatePdfPath,
          fieldMappings,
          isActive: true,
        } as any);
        if (!res.success) throw new Error(res.error);
        toast.success('Program type created');
      }

      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save program type');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4">
      <div className="fixed inset-0 bg-gray-500/75 dark:bg-gray-900/80 transition-opacity" onClick={onClose} />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl max-h-[calc(100dvh-2rem)]">
        <div className="shrink-0 px-4 pt-5 pb-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
            {initialData ? 'Edit Program Type' : 'Create Program Type'}
          </h3>
          <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                  placeholder="e.g. Belt Test Certificate"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Certificate Template (PDF)</label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={certificatePdfPath}
                    onChange={(e) => setCertificatePdfPath(e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    disabled={loadingTemplates}
                    required
                  >
                    <option value="">{loadingTemplates ? 'Loading templates...' : 'Select a PDF from public/certs'}</option>
                    {templates.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={loadTemplates}
                    className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Templates are read from <span className="font-mono">public/certs</span>.
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Certificate Fields</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Select each PDF field and map it to static, dynamic, or signature.</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadFields(certificatePdfPath)}
                  disabled={!certificatePdfPath || loadingFields}
                  className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {loadingFields ? 'Extracting...' : 'Extract Fields'}
                </button>
              </div>

              <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">PDF Field</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Map As</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {extractedFields.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400" colSpan={3}>
                          {certificatePdfPath ? 'Click “Extract Fields” to load fields from the selected PDF.' : 'Select a PDF template first.'}
                        </td>
                      </tr>
                    ) : (
                      extractedFields.map((f) => {
                        const st = fieldStates[f.name] || emptyFieldState();

                        return (
                          <tr key={f.name}>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {f.name}
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">{f.fieldType}</div>
                            </td>

                            <td className="px-4 py-3">
                              <select
                                value={st.kind}
                                onChange={(e) => {
                                  const kind = e.target.value as MappingKind;
                                  setFieldStates((prev) => ({
                                    ...prev,
                                    [f.name]: {
                                      ...prev[f.name],
                                      ...emptyFieldState(),
                                      kind,
                                    },
                                  }));
                                }}
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                              >
                                <option value="">Unassigned</option>
                                <option value="static">Static</option>
                                <option value="dynamic">Dynamic</option>
                                <option value="signature">Signature</option>
                              </select>
                            </td>

                            <td className="px-4 py-3">
                              {st.kind === '' && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">—</div>
                              )}

                              {st.kind === 'static' && (
                                <div className="flex flex-col gap-2">
                                  <select
                                    value={st.staticSource}
                                    onChange={(e) => {
                                      const staticSource = e.target.value as UiFieldMappingState['staticSource'];
                                      setFieldStates((prev) => ({
                                        ...prev,
                                        [f.name]: {
                                          ...prev[f.name],
                                          kind: 'static',
                                          staticSource,
                                          staticText: staticSource === 'custom_text' ? prev[f.name]?.staticText || '' : '',
                                        },
                                      }));
                                    }}
                                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                  >
                                    <option value="">Select static value</option>
                                    {staticSourceOptions.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label}
                                      </option>
                                    ))}
                                  </select>

                                  {st.staticSource === 'custom_text' && (
                                    <input
                                      value={st.staticText}
                                      onChange={(e) => {
                                        const staticText = e.target.value;
                                        setFieldStates((prev) => ({
                                          ...prev,
                                          [f.name]: {
                                            ...prev[f.name],
                                            kind: 'static',
                                            staticSource: 'custom_text',
                                            staticText,
                                          },
                                        }));
                                      }}
                                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                      placeholder="Enter text"
                                    />
                                  )}
                                </div>
                              )}

                              {st.kind === 'dynamic' && (
                                <select
                                  value={st.dynamicSource}
                                  onChange={(e) => {
                                    const dynamicSource = e.target.value as UiFieldMappingState['dynamicSource'];
                                    setFieldStates((prev) => ({
                                      ...prev,
                                      [f.name]: {
                                        ...prev[f.name],
                                        kind: 'dynamic',
                                        dynamicSource,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                >
                                  <option value="">Select dynamic value</option>
                                  {dynamicSourceOptions.map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {st.kind === 'signature' && (
                                <select
                                  value={st.signatureId}
                                  onChange={(e) => {
                                    const signatureId = e.target.value;
                                    setFieldStates((prev) => ({
                                      ...prev,
                                      [f.name]: {
                                        ...prev[f.name],
                                        kind: 'signature',
                                        signatureId,
                                      },
                                    }));
                                  }}
                                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                >
                                  <option value="">Select signature</option>
                                  {signatures.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.role})
                                    </option>
                                  ))}
                                </select>
                              )}

                              {st.kind === 'signature' && signatures.length === 0 && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  No active signatures. <Link href="/admin/programs/signatures" className="underline">Add one</Link>
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                You can leave fields &quot;Unassigned&quot; for now; they won’t be filled during certificate generation.
              </p>
            </div>

            <div className="mt-5 sm:mt-6 flex justify-end gap-3 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : initialData ? 'Update Type' : 'Create Type'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ProgramTypesManagement() {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [types, setTypes] = useState<ProgramType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ProgramType | null>(null);

  const canCreate = hasPermission('PROGRAM', 'CREATE');
  const canUpdate = hasPermission('PROGRAM', 'UPDATE');
  const canDelete = hasPermission('PROGRAM', 'DELETE');

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProgramTypes({ includeInactive: true });
      if (!res.success) throw new Error(res.error);
      setTypes(res.data || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load program types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!rbacLoading) fetchTypes();
  }, [rbacLoading, fetchTypes]);

  const handleCloseModal = (refresh: boolean) => {
    setShowForm(false);
    setEditing(null);
    if (refresh) fetchTypes();
  };

  const handleDelete = async (row: ProgramType) => {
    if (!confirm(`Delete program type "${row.name}"?`)) return;

    try {
      const res = await deleteProgramType(row.id);
      if (!res.success) throw new Error(res.error);
      toast.success('Program type deleted');
      fetchTypes();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete program type');
    }
  };

  if (rbacLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Program Types</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create dynamic program types tied to certificate templates.</p>
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Type
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Certificate PDF</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {types.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                  No program types yet. Create one to enable dynamic program type selection.
                </td>
              </tr>
            ) : (
              types.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{t.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{String(t.category).replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{t.certificatePdfPath}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        t.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      {canUpdate && (
                        <button
                          onClick={() => {
                            setEditing(t);
                            setShowForm(true);
                          }}
                          className="inline-flex items-center whitespace-nowrap text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(t)}
                          className="inline-flex items-center whitespace-nowrap text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <ProgramTypeFormModal
          isOpen={showForm}
          onClose={() => handleCloseModal(false)}
          onSuccess={() => handleCloseModal(true)}
          initialData={editing}
        />
      )}
    </div>
  );
}
