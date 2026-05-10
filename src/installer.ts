import { mkdir, cp, access, readFile, writeFile, readdir, rm } from "fs/promises";
import { existsSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import type { Asset, AssetKind, AgentType, Mode } from "./types.js";
import { agents, getKindDir } from "./agents.js";

export interface InstallResult {
  success: boolean;
  path: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

export interface InstallOptions {
  global?: boolean;
  cwd?: string;
}

/**
 * Install one asset into one target CLI's on-disk layout.
 *
 * - Skill: copy the SKILL.md folder verbatim (already in correct format).
 * - Agent / Command: copy the .md file directly.
 * - Mode: convert the legacy *-mode.md prompt into a SKILL.md skill folder.
 */
export async function installAsset(
  asset: Asset,
  agentType: AgentType,
  options: InstallOptions = {},
): Promise<InstallResult> {
  const destBase = getKindDir(agentType, asset.kind, options);
  if (!destBase) {
    return {
      success: true,
      skipped: true,
      reason: `${agents[agentType].displayName} does not natively support ${asset.kind}s`,
      path: "",
    };
  }

  try {
    if (asset.kind === "skill") {
      const dest = join(destBase, asset.name);
      // Clean up stale/partial previous install before copying
      if (existsSync(dest)) {
        await rm(dest, { recursive: true, force: true });
      }
      await mkdir(dest, { recursive: true });
      await cp(asset.path, dest, { recursive: true });
      return { success: true, path: dest };
    }

    if (asset.kind === "agent" || asset.kind === "command") {
      await mkdir(destBase, { recursive: true });
      const ext = agentType === "copilot-cli" && asset.kind === "agent"
        ? ".agent.md"
        : ".md";
      const dest = join(destBase, `${asset.name}${ext}`);
      // Clean up stale previous install
      if (existsSync(dest)) {
        await rm(dest, { force: true });
      }
      await cp(asset.path, dest);
      return { success: true, path: dest };
    }

    if (asset.kind === "mode") {
      const dest = join(destBase, asset.name);
      // Clean up stale/partial previous install before converting
      if (existsSync(dest)) {
        await rm(dest, { recursive: true, force: true });
      }
      await mkdir(dest, { recursive: true });
      const modeFile =
        ((asset.metadata as Record<string, unknown> | undefined)?.modeFile as
          | string
          | undefined) || asset.path;
      await convertModeToSkill(modeFile, dest, asset);
      await copyExtras(modeFile, dest);
      return { success: true, path: dest };
    }

    return {
      success: false,
      path: "",
      error: `Unknown asset kind: ${(asset as { kind: string }).kind}`,
    };
  } catch (error) {
    return {
      success: false,
      path: destBase,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function convertModeToSkill(
  modeFile: string,
  destDir: string,
  asset: Asset,
): Promise<void> {
  const raw = await readFile(modeFile, "utf-8");
  const { data, content } = matter(raw);
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const skillName = (data.name as string) || asset.name;
  const skillDescription = (data.description as string) || asset.description;
  const fm: string[] = ["---"];
  fm.push(`name: ${skillName}`);
  fm.push(`description: ${escapeYaml(skillDescription)}`);
  if (data.category) fm.push(`category: ${escapeYaml(String(data.category))}`);
  if (data.author) fm.push(`author: ${escapeYaml(String(data.author))}`);
  if (tags.length > 0) {
    fm.push("tags:");
    for (const t of tags) fm.push(`  - ${escapeYaml(String(t))}`);
  }
  fm.push("---");
  const body = `${fm.join("\n")}\n\n# ${data.displayName || skillName}\n\n${content}`;
  await writeFile(join(destDir, "SKILL.md"), body, "utf-8");
}

function escapeYaml(s: string): string {
  if (/[:#"'\n]/.test(s)) return JSON.stringify(s);
  return s;
}

async function copyExtras(modeFile: string, destDir: string): Promise<void> {
  const sourceDir = modeFile.endsWith("-mode.md") || modeFile.endsWith(".md")
    ? sourceDirOf(modeFile)
    : modeFile;
  if (sourceDir === modeFile) return;
  let entries;
  try {
    entries = await readdir(sourceDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const src = join(sourceDir, entry.name);
    if (src === modeFile) continue;
    const dest = join(destDir, entry.name);
    try {
      if (entry.isDirectory()) {
        await cp(src, dest, { recursive: true });
      } else if (entry.isFile() && !entry.name.endsWith("-mode.md")) {
        await cp(src, dest);
      }
    } catch {
      // Ignore copy errors on individual extras.
    }
  }
}

function sourceDirOf(filePath: string): string {
  const idx = filePath.lastIndexOf("/");
  const win = filePath.lastIndexOf("\\");
  const cut = Math.max(idx, win);
  return cut === -1 ? filePath : filePath.slice(0, cut);
}

export async function isAssetInstalled(
  asset: Asset,
  agentType: AgentType,
  options: InstallOptions = {},
): Promise<boolean> {
  const destBase = getKindDir(agentType, asset.kind, options);
  if (!destBase) return false;
  const target =
    asset.kind === "skill" || asset.kind === "mode"
      ? join(destBase, asset.name)
      : join(
          destBase,
          asset.name +
            (agentType === "copilot-cli" && asset.kind === "agent"
              ? ".agent.md"
              : ".md"),
        );
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export function getInstallTarget(
  asset: Asset,
  agentType: AgentType,
  options: InstallOptions = {},
): string | null {
  const destBase = getKindDir(agentType, asset.kind, options);
  if (!destBase) return null;
  if (asset.kind === "skill" || asset.kind === "mode")
    return join(destBase, asset.name);
  const ext =
    agentType === "copilot-cli" && asset.kind === "agent" ? ".agent.md" : ".md";
  return join(destBase, asset.name + ext);
}

export interface InstallTask {
  asset: Asset;
  agent: AgentType;
}

export interface ParallelInstallResult {
  asset: string;
  kind: AssetKind;
  agent: string;
  success: boolean;
  skipped: boolean;
  reason?: string;
  path: string;
  error?: string;
}

export interface ParallelProgress {
  completed: number;
  total: number;
  current: InstallTask | null;
  results: ParallelInstallResult[];
}

export async function installParallel(
  tasks: InstallTask[],
  options: InstallOptions & { concurrency?: number } = {},
  onProgress?: (p: ParallelProgress) => void,
): Promise<ParallelInstallResult[]> {
  const concurrency = options.concurrency ?? 4;
  const results: ParallelInstallResult[] = [];
  const queue = [...tasks];
  let completed = 0;

  const runOne = async (task: InstallTask): Promise<ParallelInstallResult> => {
    const r = await installAsset(task.asset, task.agent, options);
    return {
      asset: task.asset.name,
      kind: task.asset.kind,
      agent: agents[task.agent].displayName,
      success: r.success,
      skipped: !!r.skipped,
      reason: r.reason,
      path: r.path,
      error: r.error,
    };
  };

  const workers = Array(Math.min(concurrency, queue.length))
    .fill(null)
    .map(async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        if (!task) break;
        onProgress?.({
          completed,
          total: tasks.length,
          current: task,
          results: [...results],
        });
        const r = await runOne(task);
        results.push(r);
        completed++;
        onProgress?.({
          completed,
          total: tasks.length,
          current: null,
          results: [...results],
        });
      }
    });
  await Promise.all(workers);
  return results;
}

export function buildTasks(
  assets: Asset[],
  agentTypes: AgentType[],
): InstallTask[] {
  const out: InstallTask[] = [];
  for (const asset of assets)
    for (const agent of agentTypes) out.push({ asset, agent });
  return out;
}

/**
 * Roll back successfully installed paths after a partial failure.
 * Removes each path that was successfully installed so the user's environment
 * is left clean — they can re-run the full install later.
 */
export async function rollbackInstalledPaths(
  results: ParallelInstallResult[],
): Promise<{ removed: string[]; failed: string[] }> {
  const removed: string[] = [];
  const failed: string[] = [];
  const successPaths = results
    .filter((r) => r.success && !r.skipped && r.path)
    .map((r) => r.path);

  for (const path of successPaths) {
    try {
      if (existsSync(path)) {
        await rm(path, { recursive: true, force: true });
        removed.push(path);
      }
    } catch {
      failed.push(path);
    }
  }
  return { removed, failed };
}

/* ───────────────────────── Legacy mode-only API (retained) ─────────────── */

export async function installModeForAgent(
  mode: Mode,
  agentType: AgentType,
  options: InstallOptions = {},
): Promise<InstallResult> {
  const asset: Asset = {
    kind: "mode",
    name: mode.name,
    description: mode.description,
    path: mode.path,
    category: mode.category,
    metadata: { ...(mode.metadata ?? {}) },
  };
  const modeFile = await findModeFile(mode.path);
  if (modeFile) (asset.metadata as Record<string, unknown>).modeFile = modeFile;
  return installAsset(asset, agentType, options);
}

async function findModeFile(modeDir: string): Promise<string | null> {
  try {
    const entries = await readdir(modeDir);
    for (const entry of entries) {
      if (entry.endsWith("-mode.md")) return join(modeDir, entry);
    }
  } catch {
    // ignore
  }
  const skillMd = join(modeDir, "SKILL.md");
  try {
    await access(skillMd);
    return skillMd;
  } catch {
    return null;
  }
}

export async function isModeInstalled(
  modeName: string,
  agentType: AgentType,
  options: InstallOptions = {},
): Promise<boolean> {
  const dest = getKindDir(agentType, "mode", options);
  if (!dest) return false;
  const target = join(dest, modeName);
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export function getInstallPath(
  modeName: string,
  agentType: AgentType,
  options: InstallOptions = {},
): string {
  const dest = getKindDir(agentType, "mode", options);
  if (!dest) {
    return `(unsupported on ${agents[agentType].displayName})`;
  }
  return join(dest, modeName);
}

export interface ParallelInstallTask {
  mode: Mode;
  agent: AgentType;
}

export async function installModesParallel(
  tasks: ParallelInstallTask[],
  options: InstallOptions & { concurrency?: number } = {},
  onProgress?: (p: {
    completed: number;
    total: number;
    current: ParallelInstallTask | null;
    results: ParallelInstallResult[];
  }) => void,
): Promise<ParallelInstallResult[]> {
  const wrapped: InstallTask[] = await Promise.all(
    tasks.map(async (t) => {
      const modeFile = await findModeFile(t.mode.path);
      return {
        agent: t.agent,
        asset: {
          kind: "mode" as const,
          name: t.mode.name,
          description: t.mode.description,
          path: t.mode.path,
          category: t.mode.category,
          metadata: { ...(t.mode.metadata ?? {}), ...(modeFile ? { modeFile } : {}) },
        },
      };
    }),
  );
  return installParallel(
    wrapped,
    options,
    onProgress
      ? (p) =>
          onProgress({
            completed: p.completed,
            total: p.total,
            current: p.current
              ? {
                  mode: tasks.find((t) => t.mode.name === p.current!.asset.name)!.mode,
                  agent: p.current!.agent,
                }
              : null,
            results: p.results,
          })
      : undefined,
  );
}

export function createInstallTasks(
  modes: Mode[],
  agentTypes: AgentType[],
): ParallelInstallTask[] {
  const tasks: ParallelInstallTask[] = [];
  for (const mode of modes)
    for (const agent of agentTypes) tasks.push({ mode, agent });
  return tasks;
}
