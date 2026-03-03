'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeSlashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import {
  getSignatures,
  createSignature,
  updateSignature,
  deleteSignature,
} from '@/actions/certificate-actions';
import type { CertificateSignature } from '@/db/schemas/karate/certificates';

// ---------------------------------------------------------------------------
// Signature Form Modal
// ---------------------------------------------------------------------------

interface SignatureFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: CertificateSignature | null;
}

function SignatureFormModal({ isOpen, onClose, onSuccess, initialData }: SignatureFormProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [nameBangla, setNameBangla] = useState(initialData?.nameBangla ?? '');
  const [role, setRole] = useState<'TRAINER' | 'COORDINATOR'>(initialData?.role ?? 'TRAINER');
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [signatureImageUrl, setSignatureImageUrl] = useState(initialData?.signatureImageUrl ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max 2MB.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/certificates/upload-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl }),
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const result = await res.json();
      setSignatureImageUrl(result.secureUrl);
      toast.success('Signature image uploaded');
    } catch {
      toast.error('Failed to upload signature image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!signatureImageUrl) {
      toast.error('Signature image is required');
      return;
    }

    setSaving(true);
    try {
      if (initialData) {
        const result = await updateSignature(initialData.id, {
          name: name.trim(),
          nameBangla: nameBangla.trim() || null,
          role,
          title: title.trim() || null,
          signatureImageUrl,
        });
        if (!result.success) throw new Error(result.error);
        toast.success('Signature updated');
      } else {
        const result = await createSignature({
          name: name.trim(),
          nameBangla: nameBangla.trim() || null,
          role,
          title: title.trim() || null,
          signatureImageUrl,
        });
        if (!result.success) throw new Error(result.error);
        toast.success('Signature created');
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save signature');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {initialData ? 'Edit Signature' : 'Add New Signature'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name (English) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Md. Karim Ahmed"
              required
            />
          </div>
          {/* Name Bangla */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name (Bangla)
            </label>
            <input
              type="text"
              value={nameBangla}
              onChange={(e) => setNameBangla(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="বাংলায় নাম"
            />
          </div>
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'TRAINER' | 'COORDINATOR')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="TRAINER">Trainer / Chief Instructor</option>
              <option value="COORDINATOR">Coordinator / General Secretary</option>
            </select>
          </div>
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title / Designation
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Chief Instructor"
            />
          </div>
          {/* Signature Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Signature Image <span className="text-red-500">*</span>
            </label>
            {signatureImageUrl && (
              <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                <img src={signatureImageUrl} alt="Signature" className="h-12 object-contain" />
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileUpload}
              disabled={uploading}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
            />
            {uploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
          </div>
          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SignatureManagement() {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [signatures, setSignatures] = useState<CertificateSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CertificateSignature | null>(null);

  const canCreate = hasPermission('CERTIFICATE', 'CREATE');
  const canUpdate = hasPermission('CERTIFICATE', 'UPDATE');
  const canDelete = hasPermission('CERTIFICATE', 'DELETE');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getSignatures();
      if (result.success && result.data) {
        setSignatures(result.data);
      } else {
        toast.error('Failed to load signatures');
      }
    } catch {
      toast.error('Failed to load signatures');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!rbacLoading) fetchData();
  }, [rbacLoading, fetchData]);

  const handleToggleActive = async (sig: CertificateSignature) => {
    const result = await updateSignature(sig.id, { isActive: !sig.isActive });
    if (result.success) {
      toast.success(sig.isActive ? 'Signature deactivated' : 'Signature activated');
      fetchData();
    } else {
      toast.error(result.error || 'Failed to update');
    }
  };

  const handleDelete = async (sig: CertificateSignature) => {
    if (!confirm(`Delete signature for "${sig.name}"? This cannot be undone.`)) return;
    const result = await deleteSignature(sig.id);
    if (result.success) {
      toast.success('Signature deleted');
      fetchData();
    } else {
      toast.error(result.error || 'Failed to delete');
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Certificate Signatures</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage reusable signatures for program certificates.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Signature
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {signatures.map((sig) => (
                <tr key={sig.id} className={!sig.isActive ? 'opacity-50' : ''}>
                  <td className="px-6 py-4">
                    <img
                      src={sig.signatureImageUrl}
                      alt={`${sig.name}'s signature`}
                      className="h-8 object-contain"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                    <div>{sig.name}</div>
                    {sig.nameBangla && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{sig.nameBangla}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sig.role === 'TRAINER'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                        : 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300'
                    }`}>
                      {sig.role === 'TRAINER' ? 'Trainer' : 'Coordinator'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {sig.title || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      sig.isActive
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {sig.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm space-x-2">
                    {canUpdate && (
                      <>
                        <button
                          onClick={() => handleToggleActive(sig)}
                          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          title={sig.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {sig.isActive ? <EyeSlashIcon className="h-4 w-4 inline" /> : <EyeIcon className="h-4 w-4 inline" />}
                        </button>
                        <button
                          onClick={() => { setEditing(sig); setShowForm(true); }}
                          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4 inline" />
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(sig)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {signatures.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    No signatures yet. Add one to start issuing certificates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <SignatureFormModal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); fetchData(); }}
          initialData={editing}
        />
      )}
    </div>
  );
}
