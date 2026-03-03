/**
 * Extract all AcroForm fields from the program certificate PDF template.
 * Usage: npx tsx scripts/extract-cert-fields.ts
 */
import { readFileSync } from 'fs';
import { PDFDocument } from 'pdf-lib';

async function main() {
  const pdfPath = './public/certs/fillable - program cert.pdf';
  const pdfBytes = readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const form = pdfDoc.getForm();
  const fields = form.getFields();

  console.log(`\n📄 PDF: ${pdfPath}`);
  console.log(`📋 Total fields: ${fields.length}\n`);

  const pages = pdfDoc.getPages();
  console.log(`📑 Pages: ${pages.length}`);
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    console.log(`   Page ${i}: ${width} x ${height}`);
  }
  console.log('');

  for (const field of fields) {
    const type = field.constructor.name;
    const name = field.getName();

    // Try to get widget annotations for position info
    const widgets = field.acroField.getWidgets();
    const positions: string[] = [];
    for (const widget of widgets) {
      const rect = widget.getRectangle();
      positions.push(
        `  📍 x=${rect.x.toFixed(1)}, y=${rect.y.toFixed(1)}, w=${rect.width.toFixed(1)}, h=${rect.height.toFixed(1)}`
      );
    }

    // Try to get current value
    let value = '';
    try {
      if (type === 'PDFTextField') {
        value = (field as any).getText() || '';
      } else if (type === 'PDFCheckBox') {
        value = (field as any).isChecked() ? 'checked' : 'unchecked';
      } else if (type === 'PDFDropdown') {
        value = (field as any).getSelected()?.join(', ') || '';
      }
    } catch { /* ignore */ }

    console.log(`🔹 Field: "${name}"`);
    console.log(`   Type: ${type}`);
    if (value) console.log(`   Value: "${value}"`);
    for (const pos of positions) {
      console.log(pos);
    }
    console.log('');
  }
}

main().catch(console.error);
