import type { Mode, AgentType } from "./types.js";
import type { ParallelInstallResult } from "./installer.js";

export interface ModeJson {
  name: string;
  description: string;
  category: string;
  path: string;
  metadata?: Record<string, unknown>;
}

export interface ListOutputJson {
  version: string;
  totalModes: number;
  categories: Array<{ name: string; count: number }>;
  modes: ModeJson[];
}

export interface InstallOutputJson {
  version: string;
  success: boolean;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  results: Array<{
    mode: string;
    agent: string;
    success: boolean;
    path: string;
    error?: string;
  }>;
}

export interface PreviewOutputJson {
  version: string;
  mode: ModeJson;
  agents: Array<{
    type: AgentType;
    displayName: string;
    projectPath: string;
    globalPath: string;
  }>;
}

export function formatModesAsJson(modes: Mode[], version: string): string {
  const categories = new Map<string, number>();
  for (const mode of modes) {
    const count = categories.get(mode.category) || 0;
    categories.set(mode.category, count + 1);
  }

  const output: ListOutputJson = {
    version,
    totalModes: modes.length,
    categories: Array.from(categories.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    modes: modes.map((m) => ({
      name: m.name,
      description: m.description,
      category: m.category,
      path: m.path,
      metadata: m.metadata,
    })),
  };

  return JSON.stringify(output, null, 2);
}

export function formatInstallResultsAsJson(
  results: ParallelInstallResult[],
  version: string,
): string {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const output: InstallOutputJson = {
    version,
    success: failed.length === 0,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
    },
    results: results.map((r) => ({
      mode: r.mode,
      agent: r.agent,
      success: r.success,
      path: r.path,
      error: r.error,
    })),
  };

  return JSON.stringify(output, null, 2);
}

export function formatModePreviewAsJson(
  mode: Mode,
  agents: Record<AgentType, { displayName: string; skillsDir: string; globalSkillsDir: string }>,
  version: string,
): string {
  const output: PreviewOutputJson = {
    version,
    mode: {
      name: mode.name,
      description: mode.description,
      category: mode.category,
      path: mode.path,
      metadata: mode.metadata,
    },
    agents: (Object.entries(agents) as Array<[AgentType, { displayName: string; skillsDir: string; globalSkillsDir: string }]>).map(
      ([type, config]) => ({
        type,
        displayName: config.displayName,
        projectPath: `${config.skillsDir}/${mode.name}`,
        globalPath: `${config.globalSkillsDir}/${mode.name}`,
      }),
    ),
  };

  return JSON.stringify(output, null, 2);
}

export function formatError(error: Error | string, version: string): string {
  return JSON.stringify(
    {
      version,
      success: false,
      error: error instanceof Error ? error.message : error,
    },
    null,
    2,
  );
}

export function formatCategories(modes: Mode[]): string {
  const categories = new Map<string, number>();
  for (const mode of modes) {
    const count = categories.get(mode.category) || 0;
    categories.set(mode.category, count + 1);
  }

  return JSON.stringify(
    {
      categories: Array.from(categories.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    },
    null,
    2,
  );
}

export default {
  formatModesAsJson,
  formatInstallResultsAsJson,
  formatModePreviewAsJson,
  formatError,
  formatCategories,
};
