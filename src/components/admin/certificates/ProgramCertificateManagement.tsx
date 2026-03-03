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
  InformationCircleIcon,
  PlusCircleIcon,
  TableCellsIcon,
  LinkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import {
  getProgramParticipants,
  getProgramCertificates,
  markEligible,
  issueCertificates,
  updateCertificateSignatures,
  revokeCertificate,
  removeEligibility,
  getActiveSignatures,
  createManualCertificate,
  attachProfileToCertificate,
  searchProfiles,
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
  profileId: string | null;
  profileName: string | null;
  profileNameBangla: string | null;
  participantName: string | null;
  memberNumber: string | null;
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
  const [programEndDate, setProgramEndDate] = useState<Date | null>(null);
  const [participants, setParticipants] = useState<ProgramParticipant[]>([]);
  const [certificates, setCertificates] = useState<CertRow[]>([]);
  const [signatures, setSignatures] = useState<CertificateSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  // Update signatures modal
  const [showUpdateSigModal, setShowUpdateSigModal] = useState(false);
  const [updateSigCertIds, setUpdateSigCertIds] = useState<string[]>([]);
  const [updateTrainerSigId, setUpdateTrainerSigId] = useState('');
  const [updateCoordinatorSigId, setUpdateCoordinatorSigId] = useState('');
  const [updating, setUpdating] = useState(false);

  // Manual certificate creation
  const [showManualCertForm, setShowManualCertForm] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualTrainerSigId, setManualTrainerSigId] = useState('');
  const [manualCoordinatorSigId, setManualCoordinatorSigId] = useState('');
  const [creatingManual, setCreatingManual] = useState(false);

  // Attach profile modal
  const [attachCertId, setAttachCertId] = useState<string | null>(null);
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [profileSearchResults, setProfileSearchResults] = useState<{ id: string; fullNameEnglish: string | null; fullNameBangla: string | null; memberNumber: string }[]>([]);
  const [profileSearching, setProfileSearching] = useState(false);
  const [attaching, setAttaching] = useState(false);

  const canCreate = hasPermission('CERTIFICATE', 'CREATE');
  const canUpdate = hasPermission('CERTIFICATE', 'UPDATE');
  const canDelete = hasPermission('CERTIFICATE', 'DELETE');

  const fetchData = useCallback(async () => {
    if (!programId) return;
    try {
      setLoading(true);
      setFetchError(null);
      const [progRes, partRes, certRes, sigRes] = await Promise.all([
        getProgramById(programId),
        getProgramParticipants(programId),
        getProgramCertificates(programId),
        getActiveSignatures(),
      ]);

      if (progRes.success && progRes.data) {
        setProgramTitle(progRes.data.title);
        setProgramEndDate(progRes.data.endDate ? new Date(progRes.data.endDate) : null);
      } else if (!progRes.success) setFetchError(progRes.error || 'Failed to load program');

      if (partRes.success && partRes.data) setParticipants(partRes.data);
      else if (!partRes.success) setFetchError(partRes.error || 'Failed to load participants');

      if (certRes.success && certRes.data) setCertificates(certRes.data as CertRow[]);
      else if (!certRes.success) setFetchError(certRes.error || 'Failed to load certificates');

      if (sigRes.success && sigRes.data) setSignatures(sigRes.data);
      else if (!sigRes.success) setFetchError(prev => prev || (sigRes.error || 'Failed to load signatures'));
    } catch (err) {
      console.error('[ProgramCertificateManagement] fetchData error:', err);
      setFetchError('Failed to load data. Please try again.');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    if (!rbacLoading && programId) fetchData();
  }, [rbacLoading, programId, fetchData]);

  // Participants without a certificate yet (and who have profiles)
  const uncertified = participants.filter(
    (p) => p.profileId && !p.certificateId
  );

  // Participants who registered but have no profile yet
  const noProfileParticipants = participants.filter((p) => !p.profileId);

  // Separate cert rows by status
  const eligibleCerts = certificates.filter((c) => c.status === 'ELIGIBLE');
  const issuedCerts = certificates.filter((c) => c.status === 'ISSUED');
  const revokedCerts = certificates.filter((c) => c.status === 'REVOKED');

  const trainerSigs = signatures.filter((s) => s.role === 'TRAINER');
  const coordinatorSigs = signatures.filter((s) => s.role === 'COORDINATOR');

  // Determine workflow stage for stepper
  const workflowStage = issuedCerts.length > 0
    ? 3 // has issued certs
    : eligibleCerts.length > 0
      ? 2 // has eligible, ready to issue
      : participants.length > 0
        ? 1 // has participants, need to mark eligible
        : 0; // no participants yet

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleAutoMark = () => {
    // Select all uncertified participants with approved or payment_verified status — frontend only
    const autoIds = uncertified
      .filter((p) => p.profileId && (p.status === 'approved' || p.status === 'payment_verified'))
      .map((p) => p.profileId as string);
    if (autoIds.length === 0) {
      toast.info('No verified/approved participants to auto-select');
      return;
    }
    setSelectedProfileIds(new Set(autoIds));
    toast.success(`${autoIds.length} participant${autoIds.length !== 1 ? 's' : ''} selected — click "Mark Selected" to confirm`);
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
    if (selectedCertIds.size === 0) {
      toast.error('No certificates selected');
      return;
    }

    setIssuing(true);
    try {
      const result = await issueCertificates(
        Array.from(selectedCertIds),
        trainerSigId || null,
        coordinatorSigId || null,
        programEndDate ?? undefined
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

  const handleOpenUpdateSigModal = (certIds?: string[]) => {
    const ids = certIds ?? issuedCerts.map((c) => c.id);
    if (ids.length === 0) {
      toast.error('No issued certificates to update');
      return;
    }
    setUpdateSigCertIds(ids);
    // Pre-fill with existing signatures from the first selected cert
    const firstCert = issuedCerts.find((c) => ids.includes(c.id));
    setUpdateTrainerSigId(firstCert?.trainerSignatureId ?? '');
    setUpdateCoordinatorSigId(firstCert?.coordinatorSignatureId ?? '');
    setShowUpdateSigModal(true);
  };

  const handleUpdateSignatures = async () => {
    if (updateSigCertIds.length === 0) {
      toast.error('No certificates selected');
      return;
    }
    setUpdating(true);
    try {
      const result = await updateCertificateSignatures(
        updateSigCertIds,
        updateTrainerSigId || null,
        updateCoordinatorSigId || null,
      );
      if (result.success) {
        toast.success(`Signatures updated for ${updateSigCertIds.length} certificate(s)`);
        setShowUpdateSigModal(false);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to update signatures');
      }
    } catch {
      toast.error('Failed to update signatures');
    } finally {
      setUpdating(false);
    }
  };

  const handleDownload = (certId: string) => {
    window.open(`/api/certificates/${certId}/download`, '_blank');
  };

  const handleBulkDownload = () => {
    window.open(`/api/certificates/bulk-download?programId=${programId}`, '_blank');
  };

  const handleExportExcel = () => {
    window.open(`/api/certificates/export-excel?programId=${programId}`, '_blank');
  };

  // Manual certificate creation
  const handleCreateManualCert = async () => {
    if (!manualName.trim()) {
      toast.error('Participant name is required');
      return;
    }
    setCreatingManual(true);
    try {
      const result = await createManualCertificate(
        programId,
        manualName.trim(),
        manualTrainerSigId || null,
        manualCoordinatorSigId || null,
        programEndDate ?? undefined
      );
      if (result.success) {
        toast.success('Manual certificate created!');
        setManualName('');
        setManualTrainerSigId('');
        setManualCoordinatorSigId('');
        setShowManualCertForm(false);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to create');
      }
    } catch {
      toast.error('Failed to create manual certificate');
    } finally {
      setCreatingManual(false);
    }
  };

  // Attach profile to manual certificate
  const handleSearchProfiles = async () => {
    if (!profileSearchQuery.trim()) return;
    setProfileSearching(true);
    try {
      const result = await searchProfiles(profileSearchQuery.trim());
      if (result.success && result.data) {
        setProfileSearchResults(result.data);
      } else {
        toast.error(result.error || 'Search failed');
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setProfileSearching(false);
    }
  };

  const handleAttachProfile = async (profileId: string) => {
    if (!attachCertId) return;
    setAttaching(true);
    try {
      const result = await attachProfileToCertificate(attachCertId, profileId);
      if (result.success) {
        toast.success('Profile linked to certificate');
        setAttachCertId(null);
        setProfileSearchQuery('');
        setProfileSearchResults([]);
        fetchData();
      } else {
        toast.error(result.error || 'Failed to attach profile');
      }
    } catch {
      toast.error('Failed to attach profile');
    } finally {
      setAttaching(false);
    }
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
            Certificates — {programTitle || 'Program'}
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
          {certificates.length > 0 && (
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
            >
              <TableCellsIcon className="h-4 w-4 mr-1.5" />
              Export Excel
            </button>
          )}
          {canCreate && (
            <>
              <button
                onClick={() => setShowManualCertForm(true)}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <PlusCircleIcon className="h-4 w-4 mr-1.5" />
                Manual Certificate
              </button>
              <button
                onClick={handleOpenIssueModal}
                disabled={eligibleCerts.length === 0}
                title={eligibleCerts.length === 0 ? 'Mark participants as eligible first' : `Issue ${eligibleCerts.length} certificate(s)`}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentCheckIcon className="h-4 w-4 mr-1.5" />
                Issue Certificates {eligibleCerts.length > 0 && `(${eligibleCerts.length})`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error loading data</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">{fetchError}</p>
            </div>
            <button onClick={fetchData} className="text-xs font-medium text-red-600 hover:text-red-800 underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Workflow Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4">
        <div className="flex items-center justify-between">
          {[
            { step: 0, label: 'Register', desc: 'Participants register' },
            { step: 1, label: 'Mark Eligible', desc: 'Select who qualifies' },
            { step: 2, label: 'Issue', desc: 'Generate certificates' },
            { step: 3, label: 'Download', desc: 'Download PDFs' },
          ].map(({ step, label, desc }, idx) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center text-center flex-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  workflowStage > step
                    ? 'bg-green-500 border-green-500 text-white'
                    : workflowStage === step
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                }`}>
                  {workflowStage > step ? <CheckCircleIcon className="h-5 w-5" /> : step + 1}
                </div>
                <span className={`mt-1 text-xs font-medium ${
                  workflowStage >= step ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                }`}>{label}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">{desc}</span>
              </div>
              {idx < 3 && (
                <div className={`h-0.5 w-full mx-1 ${
                  workflowStage > step ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Total Participants" value={participants.length} icon={UserGroupIcon} />
        <Stat label="Eligible" value={eligibleCerts.length} icon={ShieldCheckIcon} color="amber" />
        <Stat label="Issued" value={issuedCerts.length} icon={CheckCircleIcon} color="green" />
        <Stat label="Revoked" value={revokedCerts.length} icon={ExclamationTriangleIcon} color="red" />
      </div>

      {/* Warning: Participants without profiles */}
      {noProfileParticipants.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {noProfileParticipants.length} participant{noProfileParticipants.length > 1 ? 's' : ''} without member profiles
              </h3>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                These registered participants do not have member profiles yet. They must complete their profiles before certificates can be issued.
              </p>
              <ul className="mt-2 space-y-1">
                {noProfileParticipants.map((p) => (
                  <li key={p.registrationId} className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    User ID: {p.userId.substring(0, 8)}…
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      p.status === 'approved' || p.status === 'payment_verified'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Empty state: no participants at all */}
      {participants.length === 0 && !fetchError && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-8 text-center">
          <UserGroupIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Registrations Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            No one has registered for this program yet. Participants must register and complete payment before certificates can be issued.
          </p>
          <Link
            href="/admin/programs"
            className="inline-flex items-center mt-4 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to Programs
          </Link>
        </div>
      )}

      {/* Section: Mark Eligible — always visible when there are participants */}
      {canCreate && participants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Mark Eligible
              {uncertified.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({uncertified.length} without certificate)
                </span>
              )}
            </h2>
            {uncertified.length > 0 && (
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
            )}
          </div>

          {uncertified.length > 0 ? (
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
                    {p.memberNumber && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 font-mono">#{p.memberNumber}</span>
                    )}
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
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/30">
              <InformationCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {certificates.length > 0
                  ? 'All participants with profiles already have certificates (eligible, issued, or revoked).'
                  : noProfileParticipants.length > 0 && noProfileParticipants.length === participants.length
                    ? 'All registered participants are missing member profiles. They need to complete their profiles first.'
                    : 'No participants are ready for eligibility marking. Ensure participants have registered and completed their profiles.'}
              </p>
            </div>
          )}
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
        <>
          <CertTable
            title={`Issued (${issuedCerts.length})`}
            certs={issuedCerts}
            signatures={signatures}
            canUpdate={canUpdate}
            onDownload={handleDownload}
            onRevoke={canUpdate ? (id) => setRevoking(id) : undefined}
            onUpdateSignatures={canUpdate ? (id) => handleOpenUpdateSigModal([id]) : undefined}
            onAttachProfile={canUpdate ? (id) => { setAttachCertId(id); setProfileSearchQuery(''); setProfileSearchResults([]); } : undefined}
            headerAction={
              canUpdate ? (
                <button
                  onClick={() => handleOpenUpdateSigModal()}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs font-medium"
                >
                  Update All Signatures
                </button>
              ) : undefined
            }
          />
        </>
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

            {/* Optional signatures note */}
            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
              Signatures are optional. If not selected, the certificate will be issued without trainer/coordinator names and signature images.
            </p>

            {/* Trainer Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trainer Signature <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={trainerSigId}
                onChange={(e) => setTrainerSigId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
              >
                <option value="">— No trainer signature —</option>
                {trainerSigs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.title ? ` — ${s.title}` : ''}</option>
                ))}
              </select>
              {trainerSigs.length === 0 && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">No active trainer signatures. <Link href="/admin/programs/signatures" className="underline">Add one</Link></p>
              )}
            </div>

            {/* Coordinator Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coordinator Signature <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={coordinatorSigId}
                onChange={(e) => setCoordinatorSigId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
              >
                <option value="">— No coordinator signature —</option>
                {coordinatorSigs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.title ? ` — ${s.title}` : ''}</option>
                ))}
              </select>
              {coordinatorSigs.length === 0 && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">No active coordinator signatures. <Link href="/admin/programs/signatures" className="underline">Add one</Link></p>
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
                disabled={issuing}
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

      {/* Update Signatures Modal */}
      {showUpdateSigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Update Signatures
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Update signatures for {updateSigCertIds.length} certificate(s). Certificate IDs and issue dates will remain unchanged.
            </p>

            {/* Trainer Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trainer Signature <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={updateTrainerSigId}
                onChange={(e) => setUpdateTrainerSigId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
              >
                <option value="">— No trainer signature —</option>
                {trainerSigs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.title ? ` — ${s.title}` : ''}</option>
                ))}
              </select>
            </div>

            {/* Coordinator Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coordinator Signature <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={updateCoordinatorSigId}
                onChange={(e) => setUpdateCoordinatorSigId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
              >
                <option value="">— No coordinator signature —</option>
                {coordinatorSigs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.title ? ` — ${s.title}` : ''}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setShowUpdateSigModal(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSignatures}
                disabled={updating}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Signatures'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Certificate Modal */}
      {showManualCertForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create Manual Certificate
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a certificate for someone not registered in the system. You can attach a profile later.
              {programEndDate && (
                <span className="block mt-1 text-xs">
                  Certificate date: <strong>{programEndDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong> (program end date)
                </span>
              )}
            </p>

            {/* Participant Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Participant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Full name of the participant"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
              />
            </div>

            {/* Trainer Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trainer Signature <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={manualTrainerSigId}
                onChange={(e) => setManualTrainerSigId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
              >
                <option value="">— No trainer signature —</option>
                {trainerSigs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.title ? ` — ${s.title}` : ''}</option>
                ))}
              </select>
            </div>

            {/* Coordinator Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Coordinator Signature <span className="text-xs font-normal text-gray-400">(optional)</span>
              </label>
              <select
                value={manualCoordinatorSigId}
                onChange={(e) => setManualCoordinatorSigId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none"
              >
                <option value="">— No coordinator signature —</option>
                {coordinatorSigs.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.title ? ` — ${s.title}` : ''}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => { setShowManualCertForm(false); setManualName(''); }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualCert}
                disabled={creatingManual || !manualName.trim()}
                className="px-4 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {creatingManual ? 'Creating...' : 'Create & Issue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attach Profile Modal */}
      {attachCertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Attach Member Profile
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Search for a member profile to link to this certificate.
            </p>

            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={profileSearchQuery}
                  onChange={(e) => setProfileSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchProfiles()}
                  placeholder="Search by name or member number..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none text-sm"
                />
              </div>
              <button
                onClick={handleSearchProfiles}
                disabled={profileSearching || !profileSearchQuery.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {profileSearching ? '...' : 'Search'}
              </button>
            </div>

            {/* Results */}
            {profileSearchResults.length > 0 && (
              <div className="max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700 border rounded-md">
                {profileSearchResults.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {p.fullNameEnglish || p.fullNameBangla || 'Unknown'}
                      </span>
                      <span className="ml-2 text-xs text-gray-400 font-mono">#{p.memberNumber}</span>
                    </div>
                    <button
                      onClick={() => handleAttachProfile(p.id)}
                      disabled={attaching}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {attaching ? '...' : 'Link'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {profileSearchResults.length === 0 && profileSearchQuery && !profileSearching && (
              <p className="text-sm text-gray-400 text-center py-3">No profiles found. Try a different search.</p>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => { setAttachCertId(null); setProfileSearchQuery(''); setProfileSearchResults([]); }}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Close
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
  onUpdateSignatures,
  onAttachProfile,
  headerAction,
  signatures,
}: {
  title: string;
  certs: CertRow[];
  canUpdate?: boolean;
  canDelete?: boolean;
  onDownload?: (id: string) => void;
  onRevoke?: (id: string) => void;
  onRemove?: (id: string) => void;
  onUpdateSignatures?: (id: string) => void;
  onAttachProfile?: (id: string) => void;
  headerAction?: React.ReactNode;
  signatures?: CertificateSignature[];
}) {
  const sigName = (id: string | null) => {
    if (!id || !signatures) return null;
    const s = signatures.find((sig) => sig.id === id);
    return s?.name ?? null;
  };

  const showSigColumns = !!signatures && signatures.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/30">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cert #</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member #</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              {showSigColumns && (
                <>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trainer</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinator</th>
                </>
              )}
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {certs.map((c) => {
              const displayName = c.profileName || c.profileNameBangla || c.participantName || '—';
              const isManual = !c.profileId;

              return (
                <tr key={c.id}>
                  <td className="px-4 py-2 text-xs font-mono text-gray-600 dark:text-gray-400">{c.certificateNumber}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {displayName}
                    {isManual && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        Manual
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">{c.memberNumber || '—'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={c.status} />
                  </td>
                  {showSigColumns && (
                    <>
                      <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {sigName(c.trainerSignatureId) || <span className="text-gray-400 italic">—</span>}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {sigName(c.coordinatorSignatureId) || <span className="text-gray-400 italic">—</span>}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-2 text-right space-x-2">
                    {onDownload && c.status === 'ISSUED' && (
                      <button
                        onClick={() => onDownload(c.id)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        Download
                      </button>
                    )}
                    {onAttachProfile && isManual && c.status === 'ISSUED' && (
                      <button
                        onClick={() => onAttachProfile(c.id)}
                        className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                      >
                        Attach Profile
                      </button>
                    )}
                    {onUpdateSignatures && c.status === 'ISSUED' && canUpdate && (
                      <button
                        onClick={() => onUpdateSignatures(c.id)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Edit Sig
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
              );
            })}
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
