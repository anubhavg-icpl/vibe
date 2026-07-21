import { MODEL_TARGETS, type ModelProfile, type ModelTarget } from "./types.js";

const PROFILE_NAME = /^[a-z0-9][a-z0-9._-]*$/i;

const EFFORTS: Partial<Record<ModelTarget, Set<string>>> = {
  codex: new Set(["minimal", "low", "medium", "high", "xhigh"]),
  claude: new Set(["low", "medium", "high", "xhigh", "max"]),
};

const SECRET_ARG = /^--?(?:api[-_]?key|access[-_]?token|auth[-_]?token|token|password|secret)(?:=|$)/i;

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
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return ["Profile must be an object."];
  }
  if (!MODEL_TARGETS.includes(profile.target)) {
    return [`Unsupported model target: ${String(profile.target)}. Use codex, claude, or gemini.`];
  }

  const efforts = EFFORTS[profile.target];
  const approvals = APPROVAL_MODES[profile.target];
  const sandboxes = SANDBOX_MODES[profile.target];

  for (const field of ["description", "model", "effort", "approvalMode", "sandbox", "nativeProfile"] as const) {
    if (profile[field] !== undefined && typeof profile[field] !== "string") {
      errors.push(`${field} must be a string.`);
    }
  }

  if (typeof profile.effort === "string" && !efforts?.has(profile.effort)) {
    errors.push(`${profile.target} does not support effort "${profile.effort}".`);
  }
  if (typeof profile.approvalMode === "string" && !approvals.has(profile.approvalMode)) {
    errors.push(`${profile.target} does not support approval mode "${profile.approvalMode}".`);
  }
  if (typeof profile.sandbox === "string" && !sandboxes?.has(profile.sandbox)) {
    errors.push(`${profile.target} does not support sandbox mode "${profile.sandbox}".`);
  }
  if (profile.nativeProfile && profile.target !== "codex") {
    errors.push("nativeProfile is only supported by Codex.");
  }
  if (profile.extraArgs !== undefined && !Array.isArray(profile.extraArgs)) {
    errors.push("extraArgs must be an array of strings.");
  } else if (profile.extraArgs) {
    if (profile.extraArgs.some((arg) => typeof arg !== "string")) {
      errors.push("extraArgs must be an array of strings.");
    } else {
      if (profile.extraArgs.some((arg) => arg.includes("\0"))) {
        errors.push("Extra arguments cannot contain null bytes.");
      }
      if (profile.extraArgs.some((arg) => SECRET_ARG.test(arg))) {
        errors.push("Extra arguments cannot contain secret-bearing flags; authenticate with the native CLI instead.");
      }
    }
  }

  return errors;
}

export function validateModelProfilesConfig(value: unknown): string[] {
  if (value === undefined) return [];
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["modelProfiles must be an object."];
  }

  const modelProfiles = value as Record<string, unknown>;
  const errors: string[] = [];
  if (modelProfiles.default !== undefined && typeof modelProfiles.default !== "string") {
    errors.push("modelProfiles.default must be a string.");
  }
  if (
    modelProfiles.profiles !== undefined &&
    (!modelProfiles.profiles || typeof modelProfiles.profiles !== "object" || Array.isArray(modelProfiles.profiles))
  ) {
    errors.push("modelProfiles.profiles must be an object.");
    return errors;
  }

  return [
    ...errors,
    ...validateProfiles(
      (modelProfiles.profiles ?? {}) as Record<string, ModelProfile>,
      typeof modelProfiles.default === "string" ? modelProfiles.default : undefined,
    ),
  ];
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
