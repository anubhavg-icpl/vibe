/**
 * The AI coding-agent CLIs Vibe can install assets into.
 *
 * Vibe v2 supports 7 targets (the original 4 plus Gemini CLI, GitHub Copilot
 * CLI, and Factory Droid). When an asset kind is not natively supported by
 * a given target, the corresponding entry in `AgentConfig.kindPaths` is null.
 */
export type AgentType =
  | "opencode"
  | "claude-code"
  | "codex"
  | "cursor"
  | "gemini-cli"
  | "copilot-cli"
  | "factory-droid";

/**
 * Vibe's bundled asset taxonomy. A single asset is one self-contained item
 * the user can install — a skill folder, an agent .md, a mode prompt, etc.
 */
export type AssetKind = "skill" | "agent" | "command" | "mode" | "system-prompt";

export interface Asset {
  kind: AssetKind;
  name: string;
  description: string;
  /** Absolute path. For skills this is the folder. For agents/commands/modes it is the file. */
  path: string;
  category: string;
  metadata?: Record<string, unknown>;
}

/** Legacy alias kept for backwards-compat with existing modes pipeline. */
export interface Mode {
  name: string;
  description: string;
  path: string;
  category: string;
  metadata?: Record<string, string>;
}

/**
 * Per-CLI install config. `kindPaths` maps each asset kind to a project-level
 * and global-level destination, or null if the target does not support that
 * kind natively (in which case the installer skips it with a warning).
 */
export interface AgentConfig {
  name: AgentType;
  displayName: string;
  /** Single probe used by `vibe doctor` and auto-detection. */
  detectInstalled: () => Promise<boolean>;
  kindPaths: Record<
    AssetKind,
    { project: string | null; global: string | null } | null
  >;
}
