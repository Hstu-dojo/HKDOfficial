import { PDFDocument } from 'pdf-lib';
import { readFileSync } from 'fs';

const bytes = readFileSync('public/certs/fillable - program cert.pdf');

async function main() {
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  const fields = form.getFields();

  console.log('Total fields:', fields.length);
  console.log('');
  console.log('Type             | Field Name           | x    | y    | w    | h');
  console.log('-----------------|----------------------|------|------|------|----');

  for (const f of fields) {
    const widgets = (f as any).acroField.getWidgets();
    for (const w of widgets) {
      const r = w.getRectangle();
      console.log(
        `${f.constructor.name.padEnd(16)} | ${f.getName().padEnd(20)} | ${Math.round(r.x).toString().padStart(4)} | ${Math.round(r.y).toString().padStart(4)} | ${Math.round(r.width).toString().padStart(4)} | ${Math.round(r.height).toString().padStart(3)}`
      );
    }
  }

  // Also log page dimensions
  const page = doc.getPages()[0];
  console.log('');
  console.log(`Page size: ${page.getWidth()} x ${page.getHeight()}`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
