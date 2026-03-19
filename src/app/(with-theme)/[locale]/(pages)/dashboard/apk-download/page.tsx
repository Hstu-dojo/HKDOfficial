'use client';

import { useState, useEffect } from 'react';
import {
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface APKInfo {
  id: string;
  version: string;
  downloadUrl: string;
  releaseNotes: string;
  isActive: boolean;
  createdAt: string;
}

function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export default function APKDownloadPage() {
  const [apkInfo, setApkInfo] = useState<APKInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAPKInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://hstukarate.vercel.app/apk-download', {
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('Failed to fetch APK info');
        const data: APKInfo = await response.json();
        setApkInfo(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load APK information');
      } finally {
        setLoading(false);
      }
    };

    fetchAPKInfo();
  }, []);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
          <div className="p-2 rounded-xl bg-primary/10">
            <DevicePhoneMobileIcon className="h-6 w-6 text-primary" />
          </div>
          Mobile Application
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Download the official HKD Dojo mobile app to access tutorials and manage your enrollments.
        </p>
      </div>

      {loading ? (
        <Card className="p-8 animate-pulse flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        </Card>
      ) : error ? (
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800/30">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        </Card>
      ) : apkInfo ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Main Download Card - Takes up 3 cols on large screens */}
          <div className="md:col-span-3 space-y-6">
            <Card>
              <div className="p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center p-3 shadow-inner border border-primary/10">
                      <SparklesIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        HKD Dojo Tuto
                      </h2>
                      <p className="text-sm font-medium text-slate-500">
                        Version {apkInfo.version}
                      </p>
                    </div>
                  </div>
                  
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50">
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Latest Release
                  </span>
                </div>

                <a
                  href={apkInfo.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white py-3.5 px-6 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-sm shadow-primary/20"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download APK
                </a>
                <p className="text-center text-xs text-slate-400 mt-4">
                  Android • Direct Download 
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                  Release Notes
                </h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800/50 whitespace-pre-wrap">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {apkInfo.releaseNotes || 'No release notes provided.'}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50 text-xs text-slate-500">
                    Released on {format(new Date(apkInfo.createdAt), 'MMMM dd, yyyy')}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                  Installation Guide
                </h3>
                <ol className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-200">
                      1
                    </span>
                    <span>Download the application.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-200">
                      2
                    </span>
                    <span>Go to Settings → Security and enable &quot;Install from Unknown Sources&quot;.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-200">
                      3
                    </span>
                    <span>Open the file and tap &quot;Install&quot;.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-200">
                      4
                    </span>
                    <span>Log in and access your material!</span>
                  </li>
                </ol>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
