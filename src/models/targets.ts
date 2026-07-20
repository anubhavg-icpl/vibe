import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { delimiter, extname, join } from "path";
import { parse as parseToml } from "smol-toml";
import type { ModelCandidate, ModelProfile, ModelTarget, ModelTargetStatus } from "./types.js";

const TARGET_META: Record<ModelTarget, { displayName: string; command: string }> = {
  codex: { displayName: "OpenAI Codex", command: "codex" },
  claude: { displayName: "Claude Code", command: "claude" },
  gemini: { displayName: "Gemini CLI", command: "gemini" },
};

const BUILT_INS: Record<ModelTarget, string[]> = {
  codex: ["default"],
  claude: ["default", "best", "sonnet", "opus", "haiku", "sonnet[1m]", "opus[1m]", "opusplan"],
  gemini: ["auto"],
};

function executableNames(command: string): string[] {
  if (process.platform !== "win32") return [command];
  return [".exe", ".com", ".ps1", ".cmd", ".bat"].map((ext) => `${command}${ext}`);
}

export function findExecutable(command: string): string | null {
  if (command.includes("/") || command.includes("\\")) {
    return existsSync(command) ? command : null;
  }
  const pathEntries = (process.env.PATH ?? "").split(delimiter).filter(Boolean);
  for (const dir of pathEntries) {
    for (const name of executableNames(command)) {
      const candidate = join(dir.replace(/^"|"$/g, ""), name);
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function addModel(
  models: Map<string, ModelCandidate>,
  id: unknown,
  source: ModelCandidate["source"],
  detail?: string,
): void {
  if (typeof id !== "string" || !id.trim()) return;
  const key = id.trim();
  if (!models.has(key)) models.set(key, { id: key, source, detail });
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  if (!existsSync(path)) return {};
  return objectValue(JSON.parse(await readFile(path, "utf8")));
}

async function codexStatus(models: Map<string, ModelCandidate>, paths: string[]) {
  const configs = await Promise.all(
    paths.filter(existsSync).map(async (path) => objectValue(parseToml(await readFile(path, "utf8")))),
  );
  let activeModel: string | undefined;
  let provider: string | undefined;
  for (const [index, config] of configs.entries()) {
    if (typeof config.model === "string") activeModel = config.model;
    if (index === 0 && typeof config.model_provider === "string") {
      provider = config.model_provider;
    }
    addModel(models, config.model, "config", "configured");
    const profiles = objectValue(config.profiles);
    for (const [name, value] of Object.entries(profiles)) {
      addModel(models, objectValue(value).model, "config", `Codex profile: ${name}`);
    }
  }
  return { activeModel, provider };
}

async function claudeStatus(models: Map<string, ModelCandidate>, paths: string[]) {
  const configs = await Promise.all(paths.filter(existsSync).map(readJson));
  let activeModel: string | undefined;
  for (const config of configs) {
    if (typeof config.model === "string") activeModel = config.model;
    addModel(models, config.model, "config", "configured");
    if (Array.isArray(config.availableModels)) {
      for (const model of config.availableModels) addModel(models, model, "config", "availableModels");
    }
    for (const model of Object.keys(objectValue(config.modelOverrides))) {
      addModel(models, model, "config", "modelOverrides");
    }
  }
  return { activeModel };
}

async function geminiStatus(models: Map<string, ModelCandidate>, paths: string[]) {
  const configs = await Promise.all(paths.filter(existsSync).map(readJson));
  let activeModel: string | undefined;
  for (const config of configs) {
    const model = objectValue(config.model);
    const modelConfigs = objectValue(config.modelConfigs);
    if (typeof model.name === "string") activeModel = model.name;
    addModel(models, model.name, "config", "configured");
    for (const alias of Object.keys(objectValue(modelConfigs.customAliases))) {
      addModel(models, alias, "config", "custom alias");
    }
    for (const id of Object.keys(objectValue(modelConfigs.modelDefinitions))) {
      addModel(models, id, "config", "model definition");
    }
  }
  return { activeModel };
}

export async function getModelTargetStatus(
  target: ModelTarget,
  profiles: Record<string, ModelProfile> = {},
  cwd = process.cwd(),
): Promise<ModelTargetStatus> {
  const home = homedir();
  const configPaths: Record<ModelTarget, string[]> = {
    codex: [join(home, ".codex", "config.toml"), join(cwd, ".codex", "config.toml")],
    claude: [
      join(home, ".claude", "settings.json"),
      join(cwd, ".claude", "settings.json"),
      join(cwd, ".claude", "settings.local.json"),
    ],
    gemini: [join(home, ".gemini", "settings.json"), join(cwd, ".gemini", "settings.json")],
  };
  const models = new Map<string, ModelCandidate>();
  for (const id of BUILT_INS[target]) addModel(models, id, "built-in");
  for (const [name, profile] of Object.entries(profiles)) {
    if (profile.target === target) addModel(models, profile.model, "profile", name);
  }
  const details =
    target === "codex"
      ? await codexStatus(models, configPaths[target])
      : target === "claude"
        ? await claudeStatus(models, configPaths[target])
        : await geminiStatus(models, configPaths[target]);
  const meta = TARGET_META[target];
  const executable = findExecutable(meta.command);
  return {
    target,
    ...meta,
    executable,
    installed: executable !== null,
    configPaths: configPaths[target].filter(existsSync),
    ...details,
    models: [...models.values()],
  };
}

export function executableExtension(path: string): string {
  return extname(path).toLowerCase();
}
