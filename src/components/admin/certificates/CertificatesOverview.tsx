'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import {
  DocumentCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { getAllCertificates } from '@/actions/certificate-actions';

interface CertOverview {
  id: string;
  programId: string;
  profileId: string;
  certificateNumber: string;
  status: string;
  issueDate: Date | string | null;
  issuedAt: Date | string | null;
  profileName: string | null;
  memberNumber: string;
  programTitle: string;
  programType?: string | null;
  beltTestNewRank?: string | null;
}

function formatBeltRank(rank?: string | null) {
  if (!rank) return '—';
  switch (rank) {
    case 'brown_kyu3':
      return 'Brown (Kyu 3)';
    case 'brown_kyu2':
      return 'Brown (Kyu 2)';
    case 'brown_kyu1':
      return 'Brown (Kyu 1)';
    case 'brown':
      return 'Brown';
    default:
      return rank.charAt(0).toUpperCase() + rank.slice(1);
  }
}

export default function CertificatesOverview() {
  const { loading: rbacLoading } = useRBAC();
  const [certificates, setCertificates] = useState<CertOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAllCertificates();
      if (result.success && result.data) {
        setCertificates(result.data as CertOverview[]);
      } else {
        toast.error('Failed to load certificates');
      }
    } catch {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!rbacLoading) fetchData();
  }, [rbacLoading, fetchData]);

  const filtered = certificates.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.certificateNumber.toLowerCase().includes(s) ||
      (c.profileName?.toLowerCase().includes(s) ?? false) ||
      c.memberNumber.toLowerCase().includes(s) ||
      c.programTitle.toLowerCase().includes(s) ||
      (c.programType === 'BELT_TEST' && (c.beltTestNewRank?.toLowerCase().includes(s) ?? false))
    );
  });

  const issuedCount = certificates.filter((c) => c.status === 'ISSUED').length;
  const eligibleCount = certificates.filter((c) => c.status === 'ELIGIBLE').length;
  const revokedCount = certificates.filter((c) => c.status === 'REVOKED').length;

  const handleDownload = (certId: string) => {
    window.open(`/api/certificates/${certId}/download?admin=true`, '_blank');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Certificates Overview</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          All certificates across all programs.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <DocumentCheckIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Eligible</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{eligibleCount}</p>
        </div>
        <div className="rounded-lg p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Issued</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{issuedCount}</p>
        </div>
        <div className="rounded-lg p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Revoked</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{revokedCount}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by cert #, name, member #, or program..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Belt Test</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 text-xs font-mono text-gray-600 dark:text-gray-400">{c.certificateNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{c.profileName || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{c.memberNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{c.programTitle}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {c.programType === 'BELT_TEST' ? formatBeltRank(c.beltTestNewRank) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.status === 'ISSUED'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : c.status === 'ELIGIBLE'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {c.issueDate
                      ? new Date(c.issueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'ISSUED' && (
                      <button
                        onClick={() => handleDownload(c.id)}
                        className="inline-flex items-center text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    {search ? 'No certificates match your search.' : 'No certificates found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
