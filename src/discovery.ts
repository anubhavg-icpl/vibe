import { readdir, readFile, stat } from "fs/promises";
import { join, basename, dirname, sep, posix } from "path";
import matter from "gray-matter";
import type { Asset, AssetKind, Mode } from "./types.js";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  ".cache",
  ".turbo",
  ".next",
]);

/** Normalise a path to forward slashes for category extraction. */
const fwd = (p: string): string => p.split(sep).join(posix.sep);

function extractDescription(content: string): string {
  for (const raw of content.split("\n")) {
    const trimmed = raw.trim();
    if (
      trimmed.length > 20 &&
      trimmed.length < 240 &&
      !trimmed.startsWith("#") &&
      !trimmed.startsWith("---")
    ) {
      return trimmed;
    }
  }
  return "No description available";
}

function extractCategory(filePath: string, anchor: string): string {
  const parts = fwd(filePath).split(posix.sep);
  const idx = parts.lastIndexOf(anchor);
  if (idx !== -1 && parts.length > idx + 1) return parts[idx + 1];
  return "general";
}

async function readMd(path: string) {
  try {
    const raw = await readFile(path, "utf-8");
    return matter(raw);
  } catch {
    return null;
  }
}

async function discoverSkills(root: string): Promise<Asset[]> {
  const out: Asset[] = [];
  const skillsDir = join(root, "skills");
  let entries: string[];
  try {
    entries = await readdir(skillsDir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const dir = join(skillsDir, name);
    let s;
    try {
      s = await stat(dir);
    } catch {
      continue;
    }
    if (!s.isDirectory()) continue;
    const skillMd = join(dir, "SKILL.md");
    const fm = await readMd(skillMd);
    if (!fm) continue;
    const title = (fm.data.name as string) || name;
    out.push({
      kind: "skill",
      name,
      description:
        (fm.data.description as string) || extractDescription(fm.content),
      path: dir,
      category: (fm.data.category as string) || "skill",
      metadata: { ...fm.data, title },
    });
  }
  return out;
}

async function walkMarkdown(
  dir: string,
  depth = 0,
  maxDepth = 5,
): Promise<string[]> {
  const out: string[] = [];
  if (depth > maxDepth) return out;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await walkMarkdown(p, depth + 1, maxDepth)));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      out.push(p);
    }
  }
  return out;
}

async function discoverFlat(
  root: string,
  anchor: "agents" | "commands",
  kind: AssetKind,
): Promise<Asset[]> {
  const out: Asset[] = [];
  const dir = join(root, anchor);
  let exists = true;
  try {
    await stat(dir);
  } catch {
    exists = false;
  }
  if (!exists) return out;

  const files = await walkMarkdown(dir);
  const seen = new Set<string>();
  for (const file of files) {
    const base = basename(file).replace(/\.md$/, "");
    if (base.toUpperCase() === "README") continue;
    const fm = await readMd(file);
    if (!fm) continue;
    const name = (fm.data.name as string) || base;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({
      kind,
      name,
      description:
        (fm.data.description as string) || extractDescription(fm.content),
      path: file,
      category: extractCategory(file, anchor),
      metadata: fm.data,
    });
  }
  return out;
}

async function discoverModesAsset(root: string): Promise<Asset[]> {
  const out: Asset[] = [];
  const modesDir = join(root, "modes");
  let exists = true;
  try {
    await stat(modesDir);
  } catch {
    exists = false;
  }
  if (!exists) return out;

  const files = await walkMarkdown(modesDir);
  const seen = new Set<string>();
  for (const file of files) {
    const base = basename(file).replace(/\.md$/, "");
    if (base.toUpperCase() === "README") continue;
    const fm = await readMd(file);
    if (!fm) continue;
    const name = (fm.data.name as string) || base;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({
      kind: "mode",
      name,
      description:
        (fm.data.description as string) || extractDescription(fm.content),
      path: dirname(file) === modesDir ? file : dirname(file),
      category: (fm.data.category as string) || extractCategory(file, "modes"),
      metadata: { ...fm.data, modeFile: file },
    });
  }
  return out;
}

export interface DiscoveryOptions {
  kinds?: AssetKind[];
  onKindFound?: (kind: AssetKind, count: number) => void;
}

export async function discoverAssets(
  root: string,
  options: DiscoveryOptions = {},
): Promise<Asset[]> {
  const wanted = new Set<AssetKind>(
    options.kinds && options.kinds.length > 0
      ? options.kinds
      : (["skill", "agent", "command", "mode"] as AssetKind[]),
  );
  const kindOrder: AssetKind[] = ["skill", "agent", "command", "mode"];
  const tasks: Promise<Asset[]>[] = [];
  const taskKinds: AssetKind[] = [];
  if (wanted.has("skill")) { tasks.push(discoverSkills(root)); taskKinds.push("skill"); }
  if (wanted.has("agent")) { tasks.push(discoverFlat(root, "agents", "agent")); taskKinds.push("agent"); }
  if (wanted.has("command")) { tasks.push(discoverFlat(root, "commands", "command")); taskKinds.push("command"); }
  if (wanted.has("mode")) { tasks.push(discoverModesAsset(root)); taskKinds.push("mode"); }

  // Resolve sequentially so we can report per-kind counts to the spinner
  const buckets: Asset[][] = [];
  for (let i = 0; i < tasks.length; i++) {
    const result = await tasks[i];
    buckets.push(result);
    options.onKindFound?.(taskKinds[i], result.length);
  }
  return buckets.flat();
}

/** Bridge for the legacy modes-only path used by the existing CLI flow. */
export async function discoverModes(root: string): Promise<Mode[]> {
  const assets = await discoverAssets(root, { kinds: ["mode"] });
  return assets.map((a) => ({
    name: a.name,
    description: a.description,
    path: a.path,
    category: a.category,
    metadata: (a.metadata ?? {}) as Record<string, string>,
  }));
}

export function summariseCounts(assets: Asset[]): Record<AssetKind, number> {
  const c: Record<AssetKind, number> = {
    skill: 0,
    agent: 0,
    command: 0,
    mode: 0,
  };
  for (const a of assets) c[a.kind]++;
  return c;
}
