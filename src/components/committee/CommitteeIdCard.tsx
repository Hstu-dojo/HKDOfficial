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
    const card = { x: 12, y: 12, width: 336, height: 196 };
    const rightColumn = { x: 244, width: 92 };
    const photoBox = { x: rightColumn.x, y: 104, width: 92, height: 96 };
    const signatureBox = { x: rightColumn.x, y: 30, width: 92, height: 32 };

    page.drawRectangle({
      x: card.x,
      y: card.y,
      width: card.width,
      height: card.height,
      borderWidth: 2,
      borderColor: rgb(0.18, 0.29, 0.45),
      color: rgb(0.97, 0.98, 1),
    });

    page.drawRectangle({
      x: photoBox.x,
      y: photoBox.y,
      width: photoBox.width,
      height: photoBox.height,
      borderWidth: 1,
      borderColor: rgb(0.82, 0.85, 0.9),
    });

    page.drawRectangle({
      x: signatureBox.x,
      y: signatureBox.y,
      width: signatureBox.width,
      height: signatureBox.height,
      borderWidth: 1,
      borderColor: rgb(0.82, 0.85, 0.9),
    });

    try {
      const logoBytes = await getImageBytes(logoUrl);
      const logoIsPng = logoUrl.includes('image/png') || logoUrl.toLowerCase().endsWith('.png');
      const logoImage = logoIsPng ? await pdfDoc.embedPng(logoBytes) : await pdfDoc.embedJpg(logoBytes);
      page.drawImage(logoImage, {
        x: 24,
        y: 160,
        width: 42,
        height: 42,
      });
    } catch (error) {
      console.warn('Could not embed dojo logo in committee ID card', error);
    }

    page.drawText('HSTU Karate Dojo', {
      x: 72,
      y: 186,
      size: 12,
      font: fontBold,
      color: rgb(0.18, 0.29, 0.45),
    });

    page.drawText('Committee ID Card', {
      x: 72,
      y: 168,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(name, {
      x: 24,
      y: 140,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`Position: ${position}`, {
      x: 24,
      y: 122,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Committee: ${committeeTitle}`, {
      x: 24,
      y: 106,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`Year: ${year}`, {
      x: 24,
      y: 92,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    if (memberNumber) {
      page.drawText(`Member No: ${memberNumber}`, {
        x: 24,
        y: 78,
        size: 9,
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
          x: photoBox.x,
          y: photoBox.y,
          width: photoBox.width,
          height: photoBox.height,
        });
      } catch (error) {
        console.warn('Could not embed profile photo in committee ID card', error);
      }
    }

    if (trainerSignature?.signatureImageUrl) {
      try {
        const sigBytes = await getImageBytes(trainerSignature.signatureImageUrl);
        const sigIsPng = trainerSignature.signatureImageUrl.includes('image/png') || trainerSignature.signatureImageUrl.toLowerCase().endsWith('.png');
        const sigImage = sigIsPng ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);
        page.drawImage(sigImage, {
          x: signatureBox.x + 6,
          y: signatureBox.y + 6,
          width: signatureBox.width - 12,
          height: signatureBox.height - 12,
        });
      } catch (error) {
        console.warn('Could not embed committee signature', error);
      }
    }

    if (trainerSignature?.name) {
      page.drawText(trainerSignature.name, {
        x: signatureBox.x,
        y: signatureBox.y - 8,
        size: 8,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    if (trainerSignature?.title) {
      page.drawText(trainerSignature.title, {
        x: signatureBox.x,
        y: signatureBox.y - 16,
        size: 7,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
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

        {trainerSignature?.signatureImageUrl && (
          <div className="mt-3 flex gap-4 text-[10px] text-blue-700 dark:text-blue-200">
            <div>
              <img
                src={trainerSignature.signatureImageUrl}
                alt="Trainer signature"
                className="h-6 object-contain"
              />
              <p>{trainerSignature.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
