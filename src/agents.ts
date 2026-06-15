import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";
import type { AgentConfig, AgentType, AssetKind } from "./types.js";

const home = homedir();

/**
 * Path matrix for each (target CLI, asset kind) pair.
 *
 * Sources: each CLI's plugin/skills documentation (Claude Code skills under
 * .claude/skills, Codex under .codex/skills, Cursor under .cursor/skills,
 * OpenCode under .opencode/skill, Gemini under .gemini/skills, Copilot under
 * .copilot/skills, Factory Droid under .factory/skills).
 *
 * Where a target does not natively load an asset kind, the entry is null and
 * the installer skips it without erroring.
 */
export const agents: Record<AgentType, AgentConfig> = {
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    detectInstalled: async () =>
      existsSync(join(home, ".config/opencode")) ||
      existsSync(join(home, ".opencode")),
    kindPaths: {
      skill: {
        project: ".opencode/skill",
        global: join(home, ".config/opencode/skill"),
      },
      agent: {
        project: ".opencode/agent",
        global: join(home, ".config/opencode/agent"),
      },
      command: {
        project: ".opencode/command",
        global: join(home, ".config/opencode/command"),
      },
      mode: {
        project: ".opencode/skill",
        global: join(home, ".config/opencode/skill"),
      },
      "system-prompt": {
        project: ".opencode/system-prompts",
        global: join(home, ".config/opencode/system-prompts"),
      },
    },
  },
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    detectInstalled: async () => existsSync(join(home, ".claude")),
    kindPaths: {
      skill: { project: ".claude/skills", global: join(home, ".claude/skills") },
      agent: { project: ".claude/agents", global: join(home, ".claude/agents") },
      command: {
        project: ".claude/commands",
        global: join(home, ".claude/commands"),
      },
      mode: { project: ".claude/skills", global: join(home, ".claude/skills") },
      "system-prompt": {
        project: ".claude/system-prompts",
        global: join(home, ".claude/system-prompts"),
      },
    },
  },
  codex: {
    name: "codex",
    displayName: "OpenAI Codex",
    detectInstalled: async () => existsSync(join(home, ".codex")),
    kindPaths: {
      skill: { project: ".codex/skills", global: join(home, ".codex/skills") },
      agent: { project: ".codex/agents", global: join(home, ".codex/agents") },
      command: {
        project: ".codex/commands",
        global: join(home, ".codex/commands"),
      },
      mode: { project: ".codex/skills", global: join(home, ".codex/skills") },
      "system-prompt": {
        project: ".codex/system-prompts",
        global: join(home, ".codex/system-prompts"),
      },
    },
  },
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    detectInstalled: async () => existsSync(join(home, ".cursor")),
    kindPaths: {
      skill: { project: ".cursor/skills", global: join(home, ".cursor/skills") },
      agent: { project: ".cursor/agents", global: join(home, ".cursor/agents") },
      command: {
        project: ".cursor/commands",
        global: join(home, ".cursor/commands"),
      },
      mode: { project: ".cursor/skills", global: join(home, ".cursor/skills") },
      "system-prompt": {
        project: ".cursor/system-prompts",
        global: join(home, ".cursor/system-prompts"),
      },
    },
  },
  "gemini-cli": {
    name: "gemini-cli",
    displayName: "Gemini CLI",
    detectInstalled: async () =>
      existsSync(join(home, ".gemini")) ||
      existsSync(join(home, ".config/gemini")),
    kindPaths: {
      skill: { project: ".gemini/skills", global: join(home, ".gemini/skills") },
      agent: { project: ".gemini/agents", global: join(home, ".gemini/agents") },
      // Gemini commands are .toml only — copying .md is best-effort and a
      // future conversion script will emit proper .toml. For now we copy as-is
      // so the user has the content; Gemini ignores files it cannot parse.
      command: {
        project: ".gemini/commands",
        global: join(home, ".gemini/commands"),
      },
      mode: { project: ".gemini/skills", global: join(home, ".gemini/skills") },
      "system-prompt": {
        project: ".gemini/system-prompts",
        global: join(home, ".gemini/system-prompts"),
      },
    },
  },
  "copilot-cli": {
    name: "copilot-cli",
    displayName: "GitHub Copilot CLI",
    detectInstalled: async () => existsSync(join(home, ".copilot")),
    kindPaths: {
      skill: {
        project: ".copilot/skills",
        global: join(home, ".copilot/skills"),
      },
      // Copilot CLI expects .agent.md extension. We still drop the file for
      // the user; a future conversion script will rename to .agent.md.
      agent: {
        project: ".copilot/agents",
        global: join(home, ".copilot/agents"),
      },
      command: {
        project: ".copilot/commands",
        global: join(home, ".copilot/commands"),
      },
      mode: {
        project: ".copilot/skills",
        global: join(home, ".copilot/skills"),
      },
      "system-prompt": {
        project: ".copilot/system-prompts",
        global: join(home, ".copilot/system-prompts"),
      },
    },
  },
  "factory-droid": {
    name: "factory-droid",
    displayName: "Factory Droid",
    detectInstalled: async () => existsSync(join(home, ".factory")),
    kindPaths: {
      skill: {
        project: ".factory/skills",
        global: join(home, ".factory/skills"),
      },
      // Droid renames "agents" → "droids" in its on-disk layout.
      agent: {
        project: ".factory/droids",
        global: join(home, ".factory/droids"),
      },
      command: {
        project: ".factory/commands",
        global: join(home, ".factory/commands"),
      },
      mode: {
        project: ".factory/skills",
        global: join(home, ".factory/skills"),
      },
      "system-prompt": {
        project: ".factory/system-prompts",
        global: join(home, ".factory/system-prompts"),
      },
    },
  },
};

export const ALL_AGENT_TYPES: AgentType[] = Object.keys(agents) as AgentType[];

export async function detectInstalledAgents(): Promise<AgentType[]> {
  const installed: AgentType[] = [];
  for (const [type, config] of Object.entries(agents)) {
    if (await config.detectInstalled()) installed.push(type as AgentType);
  }
  return installed;
}

export function getAgentConfig(type: AgentType): AgentConfig {
  return agents[type];
}

/** Returns the destination dir for a given (target, kind, scope). */
export function getKindDir(
  type: AgentType,
  kind: AssetKind,
  options: { global?: boolean; cwd?: string } = {},
): string | null {
  const cfg = agents[type];
  const slot = cfg.kindPaths[kind];
  if (!slot) return null;
  const path = options.global ? slot.global : slot.project;
  if (!path) return null;
  return options.global ? path : join(options.cwd ?? process.cwd(), path);
}
