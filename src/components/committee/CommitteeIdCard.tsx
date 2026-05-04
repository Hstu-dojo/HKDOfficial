'use client';

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { downloadPdf } from '@/lib/pdf/pdf-utils';

interface CommitteeIdCardProps {
  name: string;
  position: string;
  committeeTitle: string;
  year: string;
  memberNumber?: string | null;
  photoUrl?: string | null;
  logoUrl?: string;
  trainerSignature?: {
    name?: string | null;
    title?: string | null;
    signatureImageUrl?: string | null;
  } | null;
  coordinatorSignature?: {
    name?: string | null;
    title?: string | null;
    signatureImageUrl?: string | null;
  } | null;
}

export default function CommitteeIdCard({
  name,
  position,
  committeeTitle,
  year,
  memberNumber,
  photoUrl,
  logoUrl = '/logo.png',
  trainerSignature,
  coordinatorSignature,
}: CommitteeIdCardProps) {
  const dataUrlToUint8Array = (dataUrl: string) => {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const getImageBytes = async (url: string) => {
    if (url.startsWith('data:')) {
      return dataUrlToUint8Array(url);
    }
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  };

  const handleDownload = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([360, 220]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawRectangle({
      x: 10,
      y: 10,
      width: 340,
      height: 200,
      borderWidth: 2,
      borderColor: rgb(0.18, 0.29, 0.45),
      color: rgb(0.97, 0.98, 1),
    });

    page.drawRectangle({
      x: 252,
      y: 98,
      width: 84,
      height: 100,
      borderWidth: 1,
      borderColor: rgb(0.82, 0.85, 0.9),
    });

    try {
      const logoBytes = await getImageBytes(logoUrl);
      const logoIsPng = logoUrl.includes('image/png') || logoUrl.toLowerCase().endsWith('.png');
      const logoImage = logoIsPng ? await pdfDoc.embedPng(logoBytes) : await pdfDoc.embedJpg(logoBytes);
      page.drawImage(logoImage, {
        x: 24,
        y: 170,
        width: 48,
        height: 48,
      });
    } catch (error) {
      console.warn('Could not embed dojo logo in committee ID card', error);
    }

    page.drawText('HSTU Karate Dojo', {
      x: 78,
      y: 185,
      size: 12,
      font: fontBold,
      color: rgb(0.18, 0.29, 0.45),
    });

    page.drawText('Committee ID Card', {
      x: 78,
      y: 168,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(name, {
      x: 24,
      y: 132,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Position: ${position}`, {
      x: 24,
      y: 110,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Committee: ${committeeTitle}`, {
      x: 24,
      y: 92,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Year: ${year}`, {
      x: 24,
      y: 76,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    if (memberNumber) {
      page.drawText(`Member No: ${memberNumber}`, {
        x: 24,
        y: 60,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    if (photoUrl) {
      try {
        const bytes = await getImageBytes(photoUrl);
        const isPng = photoUrl.includes('image/png') || photoUrl.toLowerCase().endsWith('.png');
        const image = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
        page.drawImage(image, {
          x: 252,
          y: 98,
          width: 84,
          height: 100,
        });
      } catch (error) {
        console.warn('Could not embed profile photo in committee ID card', error);
      }
    }

    const signatureBlocks = [
      { data: trainerSignature, x: 24 },
      { data: coordinatorSignature, x: 150 },
    ];

    for (const block of signatureBlocks) {
      if (!block.data?.signatureImageUrl) continue;
      try {
        const sigBytes = await getImageBytes(block.data.signatureImageUrl);
        const sigIsPng = block.data.signatureImageUrl.includes('image/png') || block.data.signatureImageUrl.toLowerCase().endsWith('.png');
        const sigImage = sigIsPng ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
        page.drawImage(sigImage, {
          x: block.x,
          y: 22,
          width: 110,
          height: 28,
        });
      } catch (error) {
        console.warn('Could not embed committee signature', error);
      }

      if (block.data?.name) {
        page.drawText(block.data.name, {
          x: block.x,
          y: 12,
          size: 8,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
      if (block.data?.title) {
        page.drawText(block.data.title, {
          x: block.x,
          y: 4,
          size: 7,
          font,
          color: rgb(0.3, 0.3, 0.3),
        });
      }
    }

    const bytes = await pdfDoc.save();
    downloadPdf(bytes, `committee-id-${year}.pdf`);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Virtual ID Card</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Download your committee ID card.
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Download ID Card
        </button>
      </div>

      <div className="mt-5 rounded-lg border border-dashed border-blue-200 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20 p-4">
        <div className="flex items-center gap-3">
          <img src={logoUrl} alt="Dojo logo" className="h-10 w-10 rounded bg-white p-1" />
          <div>
            <p className="text-sm text-blue-900 dark:text-blue-100 font-semibold">{name}</p>
            <p className="text-xs text-blue-700 dark:text-blue-200">{position}</p>
          </div>
          {photoUrl && (
            <img src={photoUrl} alt="Profile" className="ml-auto h-12 w-12 rounded object-cover border border-blue-200" />
          )}
        </div>
        <div className="mt-2 text-xs text-blue-700 dark:text-blue-200">
          {committeeTitle} • {year}
        </div>
        {memberNumber && (
          <p className="text-xs text-blue-700 dark:text-blue-200">Member No: {memberNumber}</p>
        )}

        {(trainerSignature?.signatureImageUrl || coordinatorSignature?.signatureImageUrl) && (
          <div className="mt-3 flex gap-4 text-[10px] text-blue-700 dark:text-blue-200">
            {trainerSignature?.signatureImageUrl && (
              <div>
                <img
                  src={trainerSignature.signatureImageUrl}
                  alt="Trainer signature"
                  className="h-6 object-contain"
                />
                <p>{trainerSignature.name}</p>
              </div>
            )}
            {coordinatorSignature?.signatureImageUrl && (
              <div>
                <img
                  src={coordinatorSignature.signatureImageUrl}
                  alt="Coordinator signature"
                  className="h-6 object-contain"
                />
                <p>{coordinatorSignature.name}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
