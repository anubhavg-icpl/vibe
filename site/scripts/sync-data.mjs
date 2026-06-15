// Sync build inputs from the repo root into the Astro site.
//   - assets-index.json (+ system-prompts/index.json merged in) -> public/ (runtime
//     fetch for search) + src/data/ (build-time stats)
//   - assets/*           -> public/assets/ (logos, WebP/WebM showcases)
// Runs automatically via predev / prebuild, and in CI before `astro build`.
import { existsSync, mkdirSync, cpSync, copyFileSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(here, '..');
const rootDir = resolve(siteDir, '..');

const indexSrc = resolve(rootDir, 'assets-index.json');
const sysPromptsSrc = resolve(rootDir, 'system-prompts', 'index.json');
const assetsSrc = resolve(rootDir, 'assets');

const publicDir = resolve(siteDir, 'public');
const dataDir = resolve(siteDir, 'src', 'data');

function ensure(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Fold the system-prompts manifest into the assets index so the website's
 * browse/search/category surfaces treat system prompts like any other asset.
 */
function mergeSystemPrompts(index) {
  if (!existsSync(sysPromptsSrc)) {
    console.warn(`[sync] WARNING: ${sysPromptsSrc} not found — site will omit system prompts.`);
    return index;
  }
  const manifest = JSON.parse(readFileSync(sysPromptsSrc, 'utf-8'));
  const entries = (manifest.prompts ?? []).map((p) => ({
    kind: 'system-prompt',
    name: p.name,
    description: p.description || 'Reference system prompt.',
    category: p.category,
    path: p.path,
  }));
  const assets = [...(index.assets ?? []), ...entries];
  const counts = { ...(index.counts ?? {}) };
  counts['system-prompt'] = entries.length;
  counts.total = (counts.total ?? (index.assets?.length ?? 0)) + entries.length;
  console.log(`[sync] merged ${entries.length} system prompts into the site index`);
  return { ...index, counts, assets };
}

let ok = true;

// 1) assets-index.json (+ system prompts merged)
if (existsSync(indexSrc)) {
  ensure(publicDir);
  ensure(dataDir);
  const merged = mergeSystemPrompts(JSON.parse(readFileSync(indexSrc, 'utf-8')));
  const json = JSON.stringify(merged);
  writeFileSync(resolve(publicDir, 'assets-index.json'), json);
  writeFileSync(resolve(dataDir, 'assets-index.json'), json);
  const kb = (json.length / 1024).toFixed(0);
  console.log(`[sync] assets-index.json (${kb} KB, ${merged.counts.total} assets) -> public/ + src/data/`);
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
