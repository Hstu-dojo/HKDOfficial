'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRBAC } from '@/hooks/useRBAC';
import {
  CheckCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  UserGroupIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import {
  getProgramParticipants,
  getProgramCertificates,
  markEligible,
  autoMarkEligible,
  issueCertificates,
  revokeCertificate,
  removeEligibility,
  getActiveSignatures,
  type ProgramParticipant,
} from '@/actions/certificate-actions';
import { getProgramById } from '@/actions/program-actions';
import type { CertificateSignature } from '@/db/schemas/karate/certificates';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CertRow {
  id: string;
  certificateNumber: string;
  status: string;
  profileId: string;
  profileName: string | null;
  profileNameBangla: string | null;
  memberNumber: string;
  issueDate: Date | string | null;
  trainerSignatureId: string | null;
  coordinatorSignatureId: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProgramCertificateManagement() {
  const searchParams = useSearchParams();
  const programId = searchParams?.get('programId') ?? '';
  const { hasPermission, loading: rbacLoading } = useRBAC();

  const [programTitle, setProgramTitle] = useState('');
  const [participants, setParticipants] = useState<ProgramParticipant[]>([]);
  const [certificates, setCertificates] = useState<CertRow[]>([]);
  const [signatures, setSignatures] = useState<CertificateSignature[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state for eligibility
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(new Set());

  // Issue modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedCertIds, setSelectedCertIds] = useState<Set<string>>(new Set());
  const [trainerSigId, setTrainerSigId] = useState('');
  const [coordinatorSigId, setCoordinatorSigId] = useState('');
  const [issuing, setIssuing] = useState(false);

  // Revoke modal
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const canCreate = hasPermission('CERTIFICATE', 'CREATE');
  const canUpdate = hasPermission('CERTIFICATE', 'UPDATE');
  const canDelete = hasPermission('CERTIFICATE', 'DELETE');

  const fetchData = useCallback(async () => {
    if (!programId) return;
    try {
      setLoading(true);
      const [progRes, partRes, certRes, sigRes] = await Promise.all([
        getProgramById(programId),
        getProgramParticipants(programId),
        getProgramCertificates(programId),
        getActiveSignatures(),
      ]);

      if (progRes.success && progRes.data) setProgramTitle(progRes.data.title);
      if (partRes.success && partRes.data) setParticipants(partRes.data);
      if (certRes.success && certRes.data) setCertificates(certRes.data as CertRow[]);
      if (sigRes.success && sigRes.data) setSignatures(sigRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    if (!rbacLoading && programId) fetchData();
  }, [rbacLoading, programId, fetchData]);

  // Participants without a certificate yet
  const uncertified = participants.filter(
    (p) => p.profileId && !p.certificateId
  );

  // Separate cert rows by status
  const eligibleCerts = certificates.filter((c) => c.status === 'ELIGIBLE');
  const issuedCerts = certificates.filter((c) => c.status === 'ISSUED');
  const revokedCerts = certificates.filter((c) => c.status === 'REVOKED');

  const trainerSigs = signatures.filter((s) => s.role === 'TRAINER');
  const coordinatorSigs = signatures.filter((s) => s.role === 'COORDINATOR');

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleAutoMark = async () => {
    const result = await autoMarkEligible(programId);
    if (result.success) {
      toast.success(`Auto-marked ${result.count} participants as eligible`);
      fetchData();
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  const handleManualMark = async () => {
    if (selectedProfileIds.size === 0) {
      toast.error('Select participants first');
      return;
    }
    const result = await markEligible(programId, Array.from(selectedProfileIds));
    if (result.success) {
      toast.success('Marked as eligible');
      setSelectedProfileIds(new Set());
      fetchData();
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  const handleRemoveEligibility = async (certId: string) => {
    if (!confirm('Remove eligibility for this participant?')) return;
    const result = await removeEligibility(certId);
    if (result.success) {
      toast.success('Eligibility removed');
      fetchData();
    } else {
      toast.error(result.error || 'Failed');
    }
  };

  const handleOpenIssueModal = () => {
    if (eligibleCerts.length === 0) {
      toast.error('No eligible certificates to issue');
      return;
    }
    // Pre-select all eligible
    setSelectedCertIds(new Set(eligibleCerts.map((c) => c.id)));
    setShowIssueModal(true);
  };

  const handleIssueCertificates = async () => {
    if (!trainerSigId || !coordinatorSigId) {
      toast.error('Select both trainer and coordinator signatures');
      return;
    }
    if (selectedCertIds.size === 0) {
      toast.error('No certificates selected');
      return;
    }

    setIssuing(true);
    try {
      const result = await issueCertificates(
        Array.from(selectedCertIds),
        trainerSigId,
        coordinatorSigId
      );
      if (result.success) {
        toast.success('Certificates issued successfully!');
        setShowIssueModal(false);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to issue');
      }
    } catch {
      toast.error('Failed to issue certificates');
    } finally {
      setIssuing(false);
    }
  };

  const handleRevoke = async () => {
    if (!revoking) return;
    if (!revokeReason.trim()) {
      toast.error('Revoke reason is required');
      return;
    }
    const result = await revokeCertificate(revoking, revokeReason.trim());
    if (result.success) {
      toast.success('Certificate revoked');
      setRevoking(null);
      setRevokeReason('');
      fetchData();
    } else {
      toast.error(result.error || 'Failed to revoke');
    }
  };

  const handleDownload = (certId: string) => {
    window.open(`/api/certificates/${certId}/download`, '_blank');
  };

  const handleBulkDownload = () => {
    window.open(`/api/certificates/bulk-download?programId=${programId}`, '_blank');
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!programId) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No program selected. Go back to Programs and click &quot;Certificates&quot;.
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Certificates — {programTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage certificate eligibility and issuance for this program.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {issuedCerts.length > 0 && (
            <button
              onClick={handleBulkDownload}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
              Download All ({issuedCerts.length})
            </button>
          )}
          {canCreate && eligibleCerts.length > 0 && (
            <button
              onClick={handleOpenIssueModal}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <DocumentCheckIcon className="h-4 w-4 mr-1.5" />
              Issue Certificates ({eligibleCerts.length})
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total Participants" value={participants.length} icon={UserGroupIcon} />
        <Stat label="Eligible" value={eligibleCerts.length} icon={ShieldCheckIcon} color="amber" />
        <Stat label="Issued" value={issuedCerts.length} icon={CheckCircleIcon} color="green" />
        <Stat label="Revoked" value={revokedCerts.length} icon={ExclamationTriangleIcon} color="red" />
      </div>

      {/* Section: Mark Eligible */}
      {canCreate && uncertified.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Mark Eligible ({uncertified.length} without certificate)
            </h2>
            <div className="flex gap-2">
              <button
                onClick={handleAutoMark}
                className="inline-flex items-center px-3 py-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-xs font-medium"
              >
                Auto-select (verified/approved)
              </button>
              <button
                onClick={handleManualMark}
                disabled={selectedProfileIds.size === 0}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium disabled:opacity-50"
              >
                Mark Selected ({selectedProfileIds.size})
              </button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {uncertified.map((p) => (
              <label
                key={p.registrationId}
                className="flex items-center px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={p.profileId ? selectedProfileIds.has(p.profileId) : false}
                  disabled={!p.profileId}
                  onChange={(e) => {
                    if (!p.profileId) return;
                    const next = new Set(selectedProfileIds);
                    e.target.checked ? next.add(p.profileId) : next.delete(p.profileId);
                    setSelectedProfileIds(next);
                  }}
                  className="mr-3 h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-900 dark:text-gray-100 flex-1">
                  {p.profileName || p.profileNameBangla || 'Unknown'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === 'approved' || p.status === 'payment_verified'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {p.status.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Section: Eligible Certificates */}
      {eligibleCerts.length > 0 && (
        <CertTable
          title={`Eligible (${eligibleCerts.length})`}
          certs={eligibleCerts}
          canUpdate={canUpdate}
          canDelete={canDelete}
          onRemove={handleRemoveEligibility}
        />
      )}

      {/* Section: Issued Certificates */}
      {issuedCerts.length > 0 && (
        <CertTable
          title={`Issued (${issuedCerts.length})`}
          certs={issuedCerts}
          canUpdate={canUpdate}
          onDownload={handleDownload}
          onRevoke={canUpdate ? (id) => setRevoking(id) : undefined}
        />
      )}

      {/* Section: Revoked */}
      {revokedCerts.length > 0 && (
        <CertTable
          title={`Revoked (${revokedCerts.length})`}
          certs={revokedCerts}
        />
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Issue Certificates
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCertIds.size} certificate(s) will be issued. Select signatures:
            </p>

            {/* Trainer Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trainer Signature <span className="text-red-500">*</span>
              </label>
              {trainerSigs.length === 0 ? (
                <p className="text-xs text-red-500">No active trainer signatures. <Link href="/admin/programs/signatures" className="underline">Add one</Link></p>
              ) : (
                <select
                  value={trainerSigId}
                  onChange={(e) => setTrainerSigId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
                >
                  <option value="">Select trainer...</option>
                  {trainerSigs.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.title ? ` — ${s.title}` : ''}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Coordinator Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coordinator Signature <span className="text-red-500">*</span>
              </label>
              {coordinatorSigs.length === 0 ? (
                <p className="text-xs text-red-500">No active coordinator signatures. <Link href="/admin/programs/signatures" className="underline">Add one</Link></p>
              ) : (
                <select
                  value={coordinatorSigId}
                  onChange={(e) => setCoordinatorSigId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
                >
                  <option value="">Select coordinator...</option>
                  {coordinatorSigs.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.title ? ` — ${s.title}` : ''}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowIssueModal(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueCertificates}
                disabled={issuing || !trainerSigId || !coordinatorSigId}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {issuing ? 'Issuing...' : `Issue ${selectedCertIds.size} Certificate(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {revoking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-red-600">Revoke Certificate</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This action cannot be easily undone. Please provide a reason:
            </p>
            <textarea
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
              placeholder="Reason for revocation..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRevoking(null); setRevokeReason(''); }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleRevoke}
                disabled={!revokeReason.trim()}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Stat({
  label,
  value,
  icon: Icon,
  color = 'blue',
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: 'blue' | 'green' | 'amber' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
  };
  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function CertTable({
  title,
  certs,
  canUpdate,
  canDelete,
  onDownload,
  onRevoke,
  onRemove,
}: {
  title: string;
  certs: CertRow[];
  canUpdate?: boolean;
  canDelete?: boolean;
  onDownload?: (id: string) => void;
  onRevoke?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b bg-gray-50 dark:bg-gray-900/50">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/30">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cert #</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member #</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {certs.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2 text-xs font-mono text-gray-600 dark:text-gray-400">{c.certificateNumber}</td>
                <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                  {c.profileName || c.profileNameBangla || '—'}
                </td>
                <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">{c.memberNumber}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-2 text-right space-x-2">
                  {onDownload && c.status === 'ISSUED' && (
                    <button
                      onClick={() => onDownload(c.id)}
                      className="text-green-600 hover:text-green-800 text-xs font-medium"
                    >
                      Download
                    </button>
                  )}
                  {onRevoke && c.status === 'ISSUED' && canUpdate && (
                    <button
                      onClick={() => onRevoke(c.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Revoke
                    </button>
                  )}
                  {onRemove && c.status === 'ELIGIBLE' && canDelete && (
                    <button
                      onClick={() => onRemove(c.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ELIGIBLE: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    ISSUED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
    REVOKED: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
