import { resolve } from "path";
import { readFile } from "fs/promises";
import YAML from "yaml";
import { findConfigFile, loadConfig, saveConfig, type VibeConfig } from "../config.js";
import type { ModelProfile } from "./types.js";
import {
  validateModelProfile,
  validateModelProfilesConfig,
  validateProfileName,
  validateProfiles,
} from "./validation.js";

export interface ModelProfileState {
  config: VibeConfig;
  configPath: string;
  defaultProfile?: string;
  profiles: Record<string, ModelProfile>;
}

export async function loadModelProfileState(cwd = process.cwd()): Promise<ModelProfileState> {
  const config = await loadConfig(cwd);
  const configPath = (await findConfigFile(cwd)) ?? resolve(cwd, ".vibeconfig.yaml");
  return {
    config,
    configPath,
    defaultProfile: config.modelProfiles?.default,
    profiles: config.modelProfiles?.profiles ?? {},
  };
}

async function saveState(state: ModelProfileState): Promise<void> {
  state.config.modelProfiles = {
    default: state.defaultProfile,
    profiles: state.profiles,
  };
  await saveConfig(state.config, state.configPath);
}

export async function saveModelProfile(
  name: string,
  profile: ModelProfile,
  cwd = process.cwd(),
): Promise<ModelProfileState> {
  const errors = [...validateProfileName(name), ...validateModelProfile(profile)];
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const state = await loadModelProfileState(cwd);
  state.profiles[name] = profile;
  await saveState(state);
  return state;
}

export async function removeModelProfile(name: string, cwd = process.cwd()): Promise<ModelProfileState> {
  const state = await loadModelProfileState(cwd);
  if (!state.profiles[name]) throw new Error(`Model profile not found: ${name}`);
  delete state.profiles[name];
  if (state.defaultProfile === name) state.defaultProfile = undefined;
  await saveState(state);
  return state;
}

export async function setDefaultModelProfile(name: string, cwd = process.cwd()): Promise<ModelProfileState> {
  const state = await loadModelProfileState(cwd);
  if (!state.profiles[name]) throw new Error(`Model profile not found: ${name}`);
  state.defaultProfile = name;
  await saveState(state);
  return state;
}

export async function validateModelProfileState(cwd = process.cwd()): Promise<{ path: string; errors: string[] }> {
  const sourcePath = await findConfigFile(cwd);
  if (sourcePath) {
    try {
      const parsed = YAML.parse(await readFile(sourcePath, "utf8"));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("The configuration root must be a YAML object.");
      }
      const errors = validateModelProfilesConfig(parsed.modelProfiles);
      if (errors.length > 0) return { path: sourcePath, errors };
    } catch (error) {
      return {
        path: sourcePath,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
  const state = await loadModelProfileState(cwd);
  return {
    path: state.configPath,
    errors: validateProfiles(state.profiles, state.defaultProfile),
  };
}
