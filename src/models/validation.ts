import type { ModelProfile, ModelTarget } from "./types.js";

const PROFILE_NAME = /^[a-z0-9][a-z0-9._-]*$/i;

const EFFORTS: Partial<Record<ModelTarget, Set<string>>> = {
  codex: new Set(["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]),
  claude: new Set(["auto", "low", "medium", "high", "xhigh", "max"]),
};

const APPROVAL_MODES: Record<ModelTarget, Set<string>> = {
  codex: new Set(["untrusted", "on-request", "never"]),
  claude: new Set(["default", "acceptEdits", "plan", "dontAsk", "bypassPermissions", "delegate"]),
  gemini: new Set(["default", "auto_edit", "yolo", "plan"]),
};

const SANDBOX_MODES: Partial<Record<ModelTarget, Set<string>>> = {
  codex: new Set(["read-only", "workspace-write", "danger-full-access"]),
  gemini: new Set(["on", "off"]),
};

export function validateProfileName(name: string): string[] {
  if (PROFILE_NAME.test(name)) return [];
  return [`Invalid profile name "${name}". Use letters, numbers, dots, underscores, and hyphens.`];
}

export function validateModelProfile(profile: ModelProfile): string[] {
  const errors: string[] = [];
  const efforts = EFFORTS[profile.target];
  const approvals = APPROVAL_MODES[profile.target];
  const sandboxes = SANDBOX_MODES[profile.target];

  if (profile.effort && !efforts?.has(profile.effort)) {
    errors.push(`${profile.target} does not support effort "${profile.effort}".`);
  }
  if (profile.approvalMode && !approvals.has(profile.approvalMode)) {
    errors.push(`${profile.target} does not support approval mode "${profile.approvalMode}".`);
  }
  if (profile.sandbox && !sandboxes?.has(profile.sandbox)) {
    errors.push(`${profile.target} does not support sandbox mode "${profile.sandbox}".`);
  }
  if (profile.nativeProfile && profile.target !== "codex") {
    errors.push("nativeProfile is only supported by Codex.");
  }
  if (profile.extraArgs?.some((arg) => arg.includes("\0"))) {
    errors.push("Extra arguments cannot contain null bytes.");
  }

  return errors;
}

export function validateProfiles(profiles: Record<string, ModelProfile>, defaultProfile?: string): string[] {
  const errors = Object.entries(profiles).flatMap(([name, profile]) => [
    ...validateProfileName(name),
    ...validateModelProfile(profile).map((error) => `${name}: ${error}`),
  ]);
  if (defaultProfile && !profiles[defaultProfile]) {
    errors.push(`Default model profile "${defaultProfile}" does not exist.`);
  }
  return errors;
}
