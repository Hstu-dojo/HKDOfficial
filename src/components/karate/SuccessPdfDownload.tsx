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
}

export default function SuccessPdfDownload({ courseId }: SuccessPdfDownloadProps) {
  const [hasData, setHasData] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const saved = loadFormFromLocalStorage(courseId);
    setHasData(!!saved);
  }, [courseId]);

  const handleDownloadFilled = async () => {
    setGenerating(true);
    try {
      const saved = loadFormFromLocalStorage(courseId);
      if (!saved) {
        alert('Form data not found. It may have been cleared from your browser.');
        return;
      }
      const pdfBytes = await fillPdfForm(saved.formData, saved.images);
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
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <p className="text-sm text-green-800 font-medium mb-3">
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
          className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-green-300 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
        >
          <FileDown className="w-4 h-4" />
          Blank
        </button>
      </div>
    </div>
  );
}
