const path=require('path');
function walkUpDirs(startDir, maxLevels = 12) {
  const dirs = [];
  let current = startDir;
  for (let i = 0; i < maxLevels; i++) {
    dirs.push(current);
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return dirs;
}
function getRuntimeAnchorDirs() {
  const anchors = [];
  anchors.push(process.cwd());
  anchors.push(__dirname);
  return Array.from(new Set(anchors));
}
function getPublicDirCandidates() {
  const anchors = getRuntimeAnchorDirs();
  const candidates = [];
  for (const anchor of anchors) {
    for (const dir of walkUpDirs(anchor)) {
      candidates.push(path.join(dir, 'public'));
    }
  }
  return Array.from(new Set(candidates));
}
console.log(getPublicDirCandidates());
