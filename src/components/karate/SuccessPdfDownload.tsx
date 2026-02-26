'use client';

import { useState, useEffect } from 'react';
import { Download, FileDown, Loader2 } from 'lucide-react';
import {
  fillPdfForm,
  downloadPdf,
  downloadBlankForm,
  loadFormFromLocalStorage,
} from '@/lib/pdf/pdf-utils';

interface SuccessPdfDownloadProps {
  courseId: string;
  applicationId?: string;
}

export default function SuccessPdfDownload({ courseId, applicationId }: SuccessPdfDownloadProps) {
  const [hasData, setHasData] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // Check localStorage first; if not available, check via applicationId
    const saved = loadFormFromLocalStorage(courseId);
    if (saved && Object.keys(saved.formData).length > 0) {
      setHasData(true);
    } else if (applicationId) {
      // Data was cleared but we have an applicationId — we can fetch from API
      setHasData(true);
    }
  }, [courseId, applicationId]);

  const handleDownloadFilled = async () => {
    setGenerating(true);
    try {
      // Try localStorage first
      const saved = loadFormFromLocalStorage(courseId);
      let formData = saved?.formData || {};
      let images = saved?.images || {};

      // If localStorage is empty, fetch from API
      if (Object.keys(formData).length === 0 && applicationId) {
        const res = await fetch(`/api/enrollments/${applicationId}/form-data`);
        if (!res.ok) {
          throw new Error('Could not retrieve your application data');
        }
        const data = await res.json();
        formData = data.formData || {};

        // For images, use Cloudinary URLs fetched from API
        // The PDF generator needs data URLs, so we fetch and convert
        const fetchImageAsDataUrl = async (url: string): Promise<string> => {
          const resp = await fetch(url);
          const blob = await resp.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };

        if (data.profilePhotoUrl) {
          try {
            images = { ...images, photo: await fetchImageAsDataUrl(data.profilePhotoUrl) };
          } catch {
            // Photo fetch failed, proceed without it
          }
        }
        if (data.signatureUrl) {
          try {
            images = { ...images, signature: await fetchImageAsDataUrl(data.signatureUrl) };
          } catch {
            // Signature fetch failed, proceed without it
          }
        }
      }

      if (Object.keys(formData).length === 0) {
        alert('Form data not found. It may have been cleared from your browser.');
        return;
      }

      const pdfBytes = await fillPdfForm(formData, images);
      downloadPdf(pdfBytes, `HKD-Registration-${courseId.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  if (!hasData) return null;

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4 mb-6">
      <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-3">
        Download your registration form as a PDF
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDownloadFilled}
          disabled={generating}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {generating ? 'Generating...' : 'Filled Form'}
        </button>
        <button
          onClick={() => downloadBlankForm()}
          className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 text-sm font-medium rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Blank
        </button>
      </div>
    </div>
  );
}
