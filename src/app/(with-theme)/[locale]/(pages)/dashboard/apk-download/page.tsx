'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Download App | HKD Dojo',
  description: 'Download the HKD Dojo mobile application to access your tutorials and certificates on the go.',
};

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
      className={`bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export default function APKDownloadPage() {
  const [apkInfo, setApkInfo] = useState<APKInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchAPKInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://hstukarate.vercel.app/apk-download');
        if (!response.ok) throw new Error('Failed to fetch APK info');
        const data: APKInfo = await response.json();
        setApkInfo(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load APK information');
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAPKInfo();
  }, []);

  const handleDownload = async () => {
    if (!apkInfo) return;

    try {
      setIsDownloading(true);
      const link = document.createElement('a');
      link.href = apkInfo.downloadUrl;
      link.download = `hkd-dojo-${apkInfo.version}.apk`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ArrowDownTrayIcon className="h-8 w-8 text-primary" />
            Download App
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Get the HKD Dojo app to access tutorials, certificates, and more on your mobile device.
          </p>
        </div>
      </div>

      {/* Main Download Card */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10"></div>

          <div className="relative p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left Side - Info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    HKD Dojo Mobile App
                  </h2>
                  <p className="text-base text-slate-600 dark:text-slate-300">
                    Your martial arts journey is now at your fingertips
                  </p>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-32 animate-pulse"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-24 animate-pulse"></div>
                  </div>
                )}

                {/* Error State */}
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 dark:text-red-200">Error</p>
                      <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                {/* Success State - Features */}
                {apkInfo && !error && (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-slate-700 dark:text-slate-200">Watch online tutorials anytime, anywhere</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-slate-700 dark:text-slate-200">View your certificates instantly</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-slate-700 dark:text-slate-200">Track your progress and achievements</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-slate-700 dark:text-slate-200">Secure authentication & personalized dashboard</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Version & Release Notes */}
                {apkInfo && !error && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Version Information
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Version</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{apkInfo.version}</p>
                      </div>
                      <div className="h-12 w-px bg-slate-200 dark:bg-slate-700"></div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Released</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {new Date(apkInfo.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side - Action */}
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 flex items-center justify-center shadow-lg">
                  <SparklesIcon className="h-16 w-16 text-primary" />
                </div>

                {!loading && apkInfo && !error && (
                  <>
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="w-full px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 active:bg-primary/80 transition-all duration-150 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5" />
                      {isDownloading ? 'Downloading...' : 'Download APK'}
                    </button>

                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      Click to download • ~42 MB • Android 8.0+
                    </p>
                  </>
                )}

                {error && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                    Unable to load download. Please try again later.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* System Requirements */}
      <Card>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">System Requirements</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Minimum Requirements
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Android 8.0 or higher</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>100 MB available storage</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Stable internet connection</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Recommended
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Android 12 or higher</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>4G or better connection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>1 GB free storage</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Additional Info */}
      <Card>
        <div className="p-6 md:p-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Getting Started</h3>
          <ol className="space-y-3 text-slate-600 dark:text-slate-300">
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                1
              </span>
              <span>Download the APK file to your Android device</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                2
              </span>
              <span>Go to Settings → Security and enable &quot;Unknown Sources&quot; (if needed)</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                3
              </span>
              <span>Open the downloaded APK file and tap &quot;Install&quot;</span>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                4
              </span>
              <span>Log in with your HKD Dojo account and start exploring</span>
            </li>
          </ol>
        </div>
      </Card>

      {/* Help Section */}
      <Card>
        <div className="p-6 md:p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">Need Help?</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            If you encounter any issues during installation or use, please{' '}
            <Link
              href="/en/contact"
              className="text-primary hover:underline font-semibold"
            >
              contact our support team
            </Link>
            . We&apos;re here to help!
          </p>
        </div>
      </Card>
    </div>
  );
}
