const fs = require('fs');
const path = require('path');
const dirs = [process.cwd(), __dirname];
const candidates = [];
for (const d of dirs) {
  let cur = d;
  for (let i = 0; i < 5; i++) {
    candidates.push(path.join(cur, 'public/certs'));
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
}
console.log('Candidates:', candidates);
for (const c of candidates) {
  try {
    const s = fs.statSync(c);
    console.log(c, 'exists:', s.isDirectory());
  } catch (e) {
    console.log(c, 'error:', e.code);
  }
}
