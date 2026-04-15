import { PDFDocument } from 'pdf-lib';

export async function rasterizePdfToBlobUrl(pdfUrl: string): Promise<string> {
  // Dynamically import pdfjs-dist only on the client
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  // Fetch the flattened PDF
  const res = await fetch(pdfUrl);
  if (!res.ok) throw new Error('Failed to fetch certificate PDF');
  const arrayBuffer = await res.arrayBuffer();

  // Load inside PDF.js
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  // Create a new non-editable image-only PDF
  const newPdfDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    
    // Use higher scale for better resolution
    const scale = 2.5; 
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;

    // Extract image
    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Embed back into PDF
    const embedImg = await newPdfDoc.embedJpg(imgDataUrl);
    
    const newPage = newPdfDoc.addPage([viewport.width / scale, viewport.height / scale]);
    newPage.drawImage(embedImg, {
      x: 0,
      y: 0,
      width: viewport.width / scale,
      height: viewport.height / scale
    });
  }

  const newPdfBytes = await newPdfDoc.save();
  const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

export async function rasterizeAndDownloadPdf(pdfUrl: string, fileName: string) {
  try {
    const downloadUrl = await rasterizePdfToBlobUrl(pdfUrl);
    
    // Trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName || 'certificate.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error('Failed to rasterize certificate:', err);
    throw err;
  }
}
