import indexData from '../data/assets-index.json';

export type Kind = 'skill' | 'agent' | 'command' | 'mode';

export interface AssetEntry {
  kind: Kind;
  name: string;
  description: string;
  category: string;
  path: string;
  modeFile?: string;
}

interface IndexFile {
  version: string;
  generated: string;
  counts: Record<string, number>;
  assets: AssetEntry[];
}

const data = indexData as unknown as IndexFile;

export const assets: AssetEntry[] = data.assets;
export const counts = data.counts;
export const generated = data.generated;
export const version = data.version;

export const REPO = 'https://github.com/anubhavg-icpl/vibe';
const NPM = 'vibe-modes';

/** Acronyms that should stay uppercased in pretty labels. */
const ACRONYMS = new Set([
  'ai', 'ml', 'dl', 'nlp', 'llm', 'llms', 'rag', 'rfc', 'ui', 'ux', 'api',
  'apis', 'cli', 'sdk', 'ebpf', 'css', 'html', 'js', 'ts', 'cicd', 'ddd',
  'devops', 'mlops', 'qa', 'gpu', 'os', '3d', 'tdd', 'gan', 'vlm', 'crm',
]);

export function prettyLabel(slug: string): string {
  return slug
    .replace(/[._]/g, '-')
    .split('-')
    .filter(Boolean)
    .map((w) => {
      const lw = w.toLowerCase();
      if (ACRONYMS.has(lw)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

/** A category is "real" if it isn't just the kind name or a raw filename. */
function isRealCategory(cat: string): boolean {
  if (!cat) return false;
  const c = cat.toLowerCase();
  if (['skill', 'agent', 'command', 'mode'].includes(c)) return false;
  if (c.endsWith('.md')) return false;
  return true;
}

export interface CategoryInfo {
  slug: string;
  label: string;
  count: number;
  kinds: Kind[];
}

const categoryMap = new Map<string, { count: number; kinds: Set<Kind> }>();
for (const a of assets) {
  if (!isRealCategory(a.category)) continue;
  const entry = categoryMap.get(a.category) ?? { count: 0, kinds: new Set<Kind>() };
  entry.count += 1;
  entry.kinds.add(a.kind);
  categoryMap.set(a.category, entry);
}

export const categories: CategoryInfo[] = [...categoryMap.entries()]
  .map(([slug, { count, kinds }]) => ({
    slug,
    label: prettyLabel(slug),
    count,
    kinds: [...kinds],
  }))
  .sort((a, b) => b.count - a.count);

export const categoryCount = categories.length;

/** Build the GitHub source URL for an asset. */
export function sourceUrl(a: AssetEntry): string {
  const p = a.modeFile ?? a.path;
  return `${REPO}/tree/master/${p}`;
}

/** Unique, descriptive, path-based slug for an asset's own page (no extension). */
export function slugFor(a: AssetEntry): string {
  return (a.modeFile ?? a.path).replace(/\.md$/, '');
}

/** Assets grouped by (real) category — for category hub pages. */
export const assetsByCategory: Record<string, AssetEntry[]> = {};
for (const a of assets) {
  if (!isRealCategory(a.category)) continue;
  (assetsByCategory[a.category] ??= []).push(a);
}

/** Author / publisher metadata for structured data + about section. */
export const AUTHOR = {
  name: 'Anubhav Gain',
  jobTitle: 'Security Software Engineer',
  url: 'https://mranv.pages.dev',
  github: 'https://github.com/anubhavg-icpl',
  linkedin: 'https://www.linkedin.com/in/anubhavgain/',
  blurb:
    'Security Software Engineer at Infopercept & CEO at TechAnv Consulting — XDR/OXDR platforms, DevSecOps, Rust & eBPF. VIBE is his open library of AI-agent assets.',
  sameAs: [
    'https://github.com/anubhavg-icpl',
    'https://github.com/mranv',
    'https://www.linkedin.com/in/anubhavgain/',
    'https://mranv.pages.dev',
  ],
};

export const SITE_ORIGIN = 'https://anubhavg-icpl.github.io';
export const SITE_BASE = '/vibe';
export const SITE_URL = `${SITE_ORIGIN}${SITE_BASE}/`;

export const KIND_META: Record<Kind, { label: string; plural: string; blurb: string }> = {
  skill: { label: 'Skill', plural: 'Skills', blurb: 'Reusable bundles for Claude, Codex, Amp & Droid' },
  agent: { label: 'Agent', plural: 'Agents', blurb: 'Specialized sub-agents for orchestration & QA' },
  command: { label: 'Command', plural: 'Commands', blurb: 'Slash commands for everyday workflows' },
  mode: { label: 'Mode', plural: 'Modes', blurb: 'Expert chat modes across 850+ domains' },
};

export const npmInstall = `npx ${NPM}@latest`;
