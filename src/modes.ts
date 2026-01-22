import { readdir, readFile, stat } from "fs/promises";
import { join, basename, dirname } from "path";
import matter from "gray-matter";
import type { Mode } from "./types.js";

const SKIP_DIRS = ["node_modules", ".git", "dist", "build", "__pycache__"];

async function parseModeMd(modeMdPath: string): Promise<Mode | null> {
  try {
    const content = await readFile(modeMdPath, "utf-8");
    const { data, content: bodyContent } = matter(content);

    // Extract name from filename (e.g., "tony-stark-mode.md" -> "tony-stark-mode")
    const fileName = basename(modeMdPath);
    const nameFromFile = fileName.replace(/\.md$/, "");
    const name = data.name || nameFromFile;
    const description = data.description || extractDescription(bodyContent);
    const category = data.category || extractCategory(modeMdPath);

    return {
      name,
      description,
      path: dirname(modeMdPath),
      category,
      metadata: data,
    };
  } catch {
    return null;
  }
}

function extractDescription(content: string): string {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 20 && trimmed.length < 200 && !trimmed.startsWith("#")) {
      return trimmed;
    }
  }
  return "No description available";
}

function extractCategory(path: string): string {
  const parts = path.split("/");
  const modesIndex = parts.indexOf("modes");
  if (modesIndex !== -1 && parts.length > modesIndex + 1) {
    return parts[modesIndex + 1];
  }
  return "general";
}

async function findModeFiles(dir: string, depth = 0, maxDepth = 4): Promise<string[]> {
  const modeFiles: string[] = [];

  if (depth > maxDepth) return modeFiles;

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith("-mode.md")) {
        modeFiles.push(join(dir, entry.name));
      } else if (entry.isDirectory() && !SKIP_DIRS.includes(entry.name)) {
        const subFiles = await findModeFiles(join(dir, entry.name), depth + 1, maxDepth);
        modeFiles.push(...subFiles);
      } else if (entry.isDirectory() && !SKIP_DIRS.includes(entry.name)) {
        const subPath = join(dir, entry.name);
        try {
          const skMdPath = join(subPath, "SKILL.md");
          await stat(skMdPath);
          modeFiles.push(skMdPath);
        } catch {
          const subFiles = await findModeFiles(subPath, depth + 1, maxDepth);
          modeFiles.push(...subFiles);
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return modeFiles;
}

export async function discoverModes(basePath: string): Promise<Mode[]> {
  const modes: Mode[] = [];
  const seenNames = new Set<string>();

  const modeFiles = await findModeFiles(basePath);

  for (const modeFile of modeFiles) {
    const mode = await parseModeMd(modeFile);
    if (mode && !seenNames.has(mode.name)) {
      modes.push(mode);
      seenNames.add(mode.name);
    }
  }

  return modes;
}

export async function discoverModesByCategory(basePath: string, category?: string): Promise<Mode[]> {
  const allModes = await discoverModes(basePath);

  if (!category) {
    return allModes;
  }

  return allModes.filter((m) => m.category === category);
}

export function getModeDisplayName(mode: Mode): string {
  return mode.name || basename(mode.path);
}
