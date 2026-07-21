import { readFile, writeFile, access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import YAML from "yaml";
import type { AgentType } from "./types.js";
import type { ModelProfile } from "./models/types.js";
import { validateModelProfilesConfig } from "./models/validation.js";

export interface VibeConfig {
  version?: string;
  defaults?: {
    agents?: AgentType[];
    global?: boolean;
    source?: string;
  };
  favorites?: string[];
  theme?: "dark" | "light" | "auto";
  parallelInstalls?: number;
  modelProfiles?: {
    default?: string;
    profiles?: Record<string, ModelProfile>;
  };
}

const CONFIG_FILENAME = ".vibeconfig.yaml";
const CONFIG_FILENAME_ALT = ".vibeconfig.yml";

const DEFAULT_CONFIG: VibeConfig = {
  version: "1.0.0",
  defaults: {
    agents: [],
    global: false,
  },
  favorites: [],
  theme: "dark",
  parallelInstalls: 4,
  modelProfiles: {
    profiles: {},
  },
};

function defaultConfig(): VibeConfig {
  return {
    ...DEFAULT_CONFIG,
    defaults: { ...DEFAULT_CONFIG.defaults },
    favorites: [...(DEFAULT_CONFIG.favorites ?? [])],
    modelProfiles: {
      ...DEFAULT_CONFIG.modelProfiles,
      profiles: { ...DEFAULT_CONFIG.modelProfiles?.profiles },
    },
  };
}

export async function findConfigFile(cwd?: string): Promise<string | null> {
  const searchPaths = [
    cwd ? join(cwd, CONFIG_FILENAME) : join(process.cwd(), CONFIG_FILENAME),
    cwd ? join(cwd, CONFIG_FILENAME_ALT) : join(process.cwd(), CONFIG_FILENAME_ALT),
    join(homedir(), CONFIG_FILENAME),
    join(homedir(), CONFIG_FILENAME_ALT),
  ];

  for (const configPath of searchPaths) {
    try {
      await access(configPath);
      return configPath;
    } catch {
      // Continue to next path
    }
  }

  return null;
}

export async function loadConfig(cwd?: string): Promise<VibeConfig> {
  const configPath = await findConfigFile(cwd);

  if (!configPath) {
    return defaultConfig();
  }

  try {
    const content = await readFile(configPath, "utf-8");
    const parsedValue = YAML.parse(content) as unknown;
    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      throw new Error("The configuration root must be a YAML object.");
    }
    const parsed = parsedValue as Partial<VibeConfig>;
    const profileErrors = validateModelProfilesConfig(parsed.modelProfiles);
    if (profileErrors.length > 0) {
      throw new Error(`Invalid model profiles:\n- ${profileErrors.join("\n- ")}`);
    }

    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      defaults: {
        ...DEFAULT_CONFIG.defaults,
        ...parsed.defaults,
      },
      modelProfiles: {
        ...DEFAULT_CONFIG.modelProfiles,
        ...parsed.modelProfiles,
        profiles: {
          ...DEFAULT_CONFIG.modelProfiles?.profiles,
          ...parsed.modelProfiles?.profiles,
        },
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(
      `[vibe] Warning: Failed to parse config at ${configPath}: ${msg}. Using defaults.`,
    );
    return defaultConfig();
  }
}

export async function saveConfig(config: VibeConfig, path?: string): Promise<void> {
  const targetPath = path || join(process.cwd(), CONFIG_FILENAME);
  const content = YAML.stringify(config, { indent: 2 });
  await writeFile(targetPath, content, "utf-8");
}

export async function initConfig(cwd?: string): Promise<string> {
  const targetPath = join(cwd || process.cwd(), CONFIG_FILENAME);

  try {
    await access(targetPath);
    throw new Error(`Config file already exists at ${targetPath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const exampleConfig: VibeConfig = {
    version: "1.0.0",
    defaults: {
      agents: ["claude-code"],
      global: false,
    },
    favorites: [
      "tony-stark-mode",
      "software-engineer-agent-mode",
    ],
    theme: "dark",
    parallelInstalls: 4,
    modelProfiles: {
      profiles: {},
    },
  };

  await saveConfig(exampleConfig, targetPath);
  return targetPath;
}

export interface MergedOptions {
  global?: boolean;
  agent?: string[];
  yes?: boolean;
  mode?: string[];
  category?: string;
  list?: boolean;
  json?: boolean;
  preview?: string;
  source?: string;
}

export function mergeConfigWithOptions(
  config: VibeConfig,
  options: MergedOptions,
): MergedOptions {
  const merged: MergedOptions = { ...options };

  // Only apply config defaults if option not explicitly provided
  if (config.defaults) {
    if (config.defaults.agents && config.defaults.agents.length > 0 && !options.agent) {
      merged.agent = config.defaults.agents;
    }
    if (config.defaults.global !== undefined && options.global === undefined) {
      merged.global = config.defaults.global;
    }
    if (config.defaults.source && !options.source) {
      merged.source = config.defaults.source;
    }
  }

  return merged;
}

export function getConfigParallelism(config: VibeConfig): number {
  return config.parallelInstalls ?? 4;
}

export function getFavorites(config: VibeConfig): string[] {
  return config.favorites ?? [];
}

export function getTheme(config: VibeConfig): "dark" | "light" | "auto" {
  return config.theme ?? "dark";
}

export default {
  findConfigFile,
  loadConfig,
  saveConfig,
  initConfig,
  mergeConfigWithOptions,
  getConfigParallelism,
  getFavorites,
  getTheme,
};
