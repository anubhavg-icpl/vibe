// Sync build inputs from the repo root into the Astro site.
//   - assets-index.json  -> public/ (runtime fetch for search) + src/data/ (build-time stats)
//   - assets/*           -> public/assets/ (logos, WebP/WebM showcases)
// Runs automatically via predev / prebuild, and in CI before `astro build`.
import { existsSync, mkdirSync, cpSync, copyFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(here, '..');
const rootDir = resolve(siteDir, '..');

const indexSrc = resolve(rootDir, 'assets-index.json');
const assetsSrc = resolve(rootDir, 'assets');

const publicDir = resolve(siteDir, 'public');
const dataDir = resolve(siteDir, 'src', 'data');

function ensure(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

let ok = true;

// 1) assets-index.json
if (existsSync(indexSrc)) {
  ensure(publicDir);
  ensure(dataDir);
  copyFileSync(indexSrc, resolve(publicDir, 'assets-index.json'));
  copyFileSync(indexSrc, resolve(dataDir, 'assets-index.json'));
  const kb = (statSync(indexSrc).size / 1024).toFixed(0);
  console.log(`[sync] assets-index.json (${kb} KB) -> public/ + src/data/`);
} else {
  console.warn(`[sync] WARNING: ${indexSrc} not found.`);
  ok = false;
}

// 2) media assets
if (existsSync(assetsSrc)) {
  cpSync(assetsSrc, resolve(publicDir, 'assets'), { recursive: true });
  console.log('[sync] assets/* -> public/assets/');
} else {
  console.warn(`[sync] WARNING: ${assetsSrc} not found.`);
  ok = false;
}

if (!ok) {
  console.warn('[sync] Completed with warnings. Site may be missing data/media.');
}
