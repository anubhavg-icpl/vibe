export const MODEL_TARGETS = ["codex", "claude", "gemini"] as const;

export type ModelTarget = (typeof MODEL_TARGETS)[number];

export interface ModelProfile {
  target: ModelTarget;
  description?: string;
  model?: string;
  effort?: string;
  approvalMode?: string;
  sandbox?: string;
  nativeProfile?: string;
  extraArgs?: string[];
}

export interface ModelCandidate {
  id: string;
  source: "built-in" | "config" | "profile";
  detail?: string;
}

export interface ModelTargetStatus {
  target: ModelTarget;
  displayName: string;
  command: string;
  executable: string | null;
  installed: boolean;
  configPaths: string[];
  activeModel?: string;
  provider?: string;
  models: ModelCandidate[];
}

export interface ModelInvocation {
  target: ModelTarget;
  command: string;
  args: string[];
}

export function parseModelTarget(value: string): ModelTarget {
  const normalized = value.trim().toLowerCase();
  if (normalized === "claude-code") return "claude";
  if (normalized === "gemini-cli") return "gemini";
  if (MODEL_TARGETS.includes(normalized as ModelTarget)) {
    return normalized as ModelTarget;
  }
  throw new Error(`Unsupported model target: ${value}. Use codex, claude, or gemini.`);
}
