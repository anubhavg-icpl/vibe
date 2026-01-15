import { mkdir, cp, access, readFile, writeFile } from "fs/promises";
import { join, basename } from "path";
import matter from "gray-matter";
import type { Mode, AgentType } from "./types.js";
import { agents } from "./agents.js";

interface InstallResult {
  success: boolean;
  path: string;
  error?: string;
}

export async function installModeForAgent(
  mode: Mode,
  agentType: AgentType,
  options: { global?: boolean; cwd?: string } = {},
): Promise<InstallResult> {
  const agent = agents[agentType];
  const modeName = mode.name || basename(mode.path);

  const targetBase = options.global ? agent.globalSkillsDir : join(options.cwd || process.cwd(), agent.skillsDir);

  const targetDir = join(targetBase, modeName);

  try {
    await mkdir(targetDir, { recursive: true });

    const modeFile = await findModeFile(mode.path);
    if (!modeFile) {
      throw new Error("No mode file found");
    }

    await convertModeToSkill(modeFile, targetDir);
    await copyAdditionalFiles(mode.path, targetDir, modeFile);

    return { success: true, path: targetDir };
  } catch (error) {
    return {
      success: false,
      path: targetDir,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function findModeFile(modeDir: string): Promise<string | null> {
  try {
    const entries = await readdir(modeDir);
    for (const entry of entries) {
      if (entry.endsWith("-mode.md")) {
        return join(modeDir, entry);
      }
    }
  } catch {
    // Ignore errors
  }

  const skillMd = join(modeDir, "SKILL.md");
  try {
    await access(skillMd);
    return skillMd;
  } catch {
    return null;
  }
}

async function convertModeToSkill(modeFile: string, targetDir: string): Promise<void> {
  const content = await readFile(modeFile, "utf-8");
  const { data, content: bodyContent } = matter(content);

  const skillName = data.name || extractName(modeFile);
  const skillDescription = data.description || extractDescription(bodyContent);

  const skillContent = `---
name: ${skillName}
description: ${skillDescription}
${data.tags ? `tags:\n${data.tags.map((t: string) => `  - ${t}`).join("\n")}` : ""}
${data.category ? `category: ${data.category}` : ""}
${data.author ? `author: ${data.author}` : ""}
---

# ${data.displayName || skillName}

${bodyContent}`;

  await writeFile(join(targetDir, "SKILL.md"), skillContent, "utf-8");
}

function extractName(path: string): string {
  const basenameParts = path.split("/").pop();
  if (!basenameParts) return "unknown";
  return basenameParts.replace(/-mode\.md$/, "").replace(/\.md$/, "");
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

async function copyAdditionalFiles(sourceDir: string, targetDir: string, excludeFile: string): Promise<void> {
  try {
    const entries = await readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = join(sourceDir, entry.name);
      const destPath = join(targetDir, entry.name);

      if (srcPath === excludeFile) {
        continue;
      }

      if (entry.isDirectory()) {
        await cp(srcPath, destPath, { recursive: true });
      } else if (entry.isFile() && !entry.name.endsWith("-mode.md")) {
        await cp(srcPath, destPath);
      }
    }
  } catch {
    // Ignore errors
  }
}

export async function isModeInstalled(
  modeName: string,
  agentType: AgentType,
  options: { global?: boolean; cwd?: string } = {},
): Promise<boolean> {
  const agent = agents[agentType];

  const targetBase = options.global ? agent.globalSkillsDir : join(options.cwd || process.cwd(), agent.skillsDir);

  const modeDir = join(targetBase, modeName);

  try {
    await access(modeDir);
    return true;
  } catch {
    return false;
  }
}

export function getInstallPath(
  modeName: string,
  agentType: AgentType,
  options: { global?: boolean; cwd?: string } = {},
): string {
  const agent = agents[agentType];

  const targetBase = options.global ? agent.globalSkillsDir : join(options.cwd || process.cwd(), agent.skillsDir);

  return join(targetBase, modeName);
}
