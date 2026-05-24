#!/usr/bin/env tsx
/**
 * Generates assets-index.json — a single flat file with metadata for every
 * skill / agent / command / mode in the repo.
 *
 * Committed to the repo so `npx github:anubhavg-icpl/vibe` starts instantly
 * (one JSON read vs 5000+ individual file reads).
 *
 * Run:  pnpm run build:index
 */

import { readdir, readFile, stat, writeFile } from "fs/promises";
import { join, basename, relative, sep, posix } from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const ROOT = join(fileURLToPath(import.meta.url), "../..");

const SKIP = new Set([
  "node_modules", ".git", "dist", "build", "__pycache__",
  ".cache", ".turbo", ".next",
]);

interface Entry {
  kind: "skill" | "agent" | "command" | "mode";
  name: string;
  description: string;
  category: string;
  /** Relative to repo root, forward-slash separated */
  path: string;
  tags?: string[];
  /** Modes only — the source .md file (relative to root) */
  modeFile?: string;
}

// ── helpers ─────────────────────────────────────────────────────────────────

const fwdRel = (abs: string) =>
  relative(ROOT, abs).split(sep).join(posix.sep);

function firstSentence(text: string): string {
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.length > 20 && t.length < 240 && !t.startsWith("#") && !t.startsWith("---"))
      return t;
  }
  return "";
}

function extractCategory(relPath: string, anchor: string): string {
  const parts = relPath.split(posix.sep);
  const idx = parts.indexOf(anchor);
  if (idx !== -1 && parts.length > idx + 1) return parts[idx + 1];
  return "general";
}

async function readFm(filePath: string) {
  try {
    const raw = await readFile(filePath, "utf-8");
    return matter(raw);
  } catch {
    return null;
  }
}

async function walk(dir: string, depth = 0, max = 5): Promise<string[]> {
  if (depth > max) return [];
  const out: string[] = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p, depth + 1, max)));
    else if (e.isFile() && e.name.endsWith(".md")) out.push(p);
  }
  return out;
}

// ── per-kind scanners ────────────────────────────────────────────────────────

async function scanSkills(): Promise<Entry[]> {
  const out: Entry[] = [];
  const dir = join(ROOT, "skills");
  let entries: string[];
  try { entries = await readdir(dir); } catch { return out; }
  await Promise.all(entries.map(async (name) => {
    if (SKIP.has(name)) return;
    const skillDir = join(dir, name);
    let s; try { s = await stat(skillDir); } catch { return; }
    if (!s.isDirectory()) return;
    const fm = await readFm(join(skillDir, "SKILL.md"));
    if (!fm) return;
    const tags = Array.isArray(fm.data.tags) ? (fm.data.tags as string[]) : [];
    const entry: Entry = {
      kind: "skill",
      name: (fm.data.name as string) || name,
      description: (fm.data.description as string) || firstSentence(fm.content),
      category: (fm.data.category as string) || "skill",
      path: fwdRel(skillDir),
      ...(tags.length ? { tags } : {}),
    };
    out.push(entry);
  }));
  return out;
}

async function scanFlat(anchor: "agents" | "commands", kind: "agent" | "command"): Promise<Entry[]> {
  const out: Entry[] = [];
  const dir = join(ROOT, anchor);
  const files = await walk(dir);
  const seen = new Set<string>();
  for (const file of files) {
    const base = basename(file).replace(/\.md$/, "");
    if (base.toUpperCase() === "README") continue;
    const fm = await readFm(file);
    if (!fm) continue;
    const name = (fm.data.name as string) || base;
    if (seen.has(name)) continue;
    seen.add(name);
    const relFile = fwdRel(file);
    out.push({
      kind,
      name,
      description: (fm.data.description as string) || firstSentence(fm.content),
      category: extractCategory(relFile, anchor),
      path: relFile,
    });
  }
  return out;
}

async function scanModes(): Promise<Entry[]> {
  const out: Entry[] = [];
  const dir = join(ROOT, "modes");
  const files = await walk(dir);
  const seen = new Set<string>();
  for (const file of files) {
    const base = basename(file).replace(/\.md$/, "");
    if (base.toUpperCase() === "README") continue;
    const fm = await readFm(file);
    if (!fm) continue;
    const name = (fm.data.name as string) || base;
    if (seen.has(name)) continue;
    seen.add(name);
    const relFile = fwdRel(file);
    const tags = Array.isArray(fm.data.tags) ? (fm.data.tags as string[]) : [];
    out.push({
      kind: "mode",
      name,
      description: (fm.data.description as string) || firstSentence(fm.content),
      category: (fm.data.category as string) || extractCategory(relFile, "modes"),
      path: fwdRel(join(ROOT, "modes")),
      modeFile: relFile,
      ...(tags.length ? { tags } : {}),
    });
  }
  return out;
}

// ── main ─────────────────────────────────────────────────────────────────────

const t0 = Date.now();
console.log("Building assets index…");

const [skills, agents, commands, modes] = await Promise.all([
  scanSkills(),
  scanFlat("agents", "agent"),
  scanFlat("commands", "command"),
  scanModes(),
]);

const assets: Entry[] = [...skills, ...agents, ...commands, ...modes];
const counts = {
  skill: skills.length,
  agent: agents.length,
  command: commands.length,
  mode: modes.length,
  total: assets.length,
};

const index = {
  version: "2.0.0",
  generated: new Date().toISOString(),
  counts,
  assets,
};

const outPath = join(ROOT, "assets-index.json");
await writeFile(outPath, JSON.stringify(index, null, 2), "utf-8");

console.log(`✓  assets-index.json written in ${Date.now() - t0}ms`);
console.log(`   skills: ${counts.skill}  agents: ${counts.agent}  commands: ${counts.command}  modes: ${counts.mode}  total: ${counts.total}`);
