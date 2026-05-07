import type {
  Mode,
  AgentType,
  Asset,
  AssetKind,
  AgentConfig,
} from "./types.js";
import type { ParallelInstallResult } from "./installer.js";
import { agents, getKindDir } from "./agents.js";

export interface AssetJson {
  kind?: AssetKind;
  name: string;
  description: string;
  category: string;
  path: string;
  metadata?: Record<string, unknown>;
}

export interface ListOutputJson {
  version: string;
  total: number;
  byKind: Partial<Record<AssetKind, number>>;
  categories: Array<{ name: string; count: number }>;
  items: AssetJson[];
}

export interface InstallOutputJson {
  version: string;
  success: boolean;
  summary: { total: number; successful: number; skipped: number; failed: number };
  results: Array<{
    asset: string;
    kind: AssetKind;
    agent: string;
    success: boolean;
    skipped?: boolean;
    reason?: string;
    path: string;
    error?: string;
  }>;
}

export interface PreviewOutputJson {
  version: string;
  asset: AssetJson;
  agents: Array<{
    type: AgentType;
    displayName: string;
    projectPath: string | null;
    globalPath: string | null;
  }>;
}

export function formatAssetsAsJson(items: Asset[], version: string): string {
  const categories = new Map<string, number>();
  const byKind: Partial<Record<AssetKind, number>> = {};
  for (const a of items) {
    categories.set(a.category, (categories.get(a.category) ?? 0) + 1);
    byKind[a.kind] = (byKind[a.kind] ?? 0) + 1;
  }
  const out: ListOutputJson = {
    version,
    total: items.length,
    byKind,
    categories: Array.from(categories.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    items: items.map((a) => ({
      kind: a.kind,
      name: a.name,
      description: a.description,
      category: a.category,
      path: a.path,
      metadata: a.metadata as Record<string, unknown> | undefined,
    })),
  };
  return JSON.stringify(out, null, 2);
}

/** Backwards-compat: prior CLI exposed mode-only listings. */
export function formatModesAsJson(modes: Mode[], version: string): string {
  const items: Asset[] = modes.map((m) => ({
    kind: "mode",
    name: m.name,
    description: m.description,
    category: m.category,
    path: m.path,
    metadata: m.metadata as Record<string, unknown> | undefined,
  }));
  return formatAssetsAsJson(items, version);
}

export function formatInstallResultsAsJson(
  results: ParallelInstallResult[],
  version: string,
): string {
  const successful = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const failed = results.filter((r) => !r.success);
  const out: InstallOutputJson = {
    version,
    success: failed.length === 0,
    summary: {
      total: results.length,
      successful: successful.length,
      skipped: skipped.length,
      failed: failed.length,
    },
    results: results.map((r) => ({
      asset: r.asset,
      kind: r.kind,
      agent: r.agent,
      success: r.success,
      skipped: r.skipped,
      reason: r.reason,
      path: r.path,
      error: r.error,
    })),
  };
  return JSON.stringify(out, null, 2);
}

export function formatAssetPreviewAsJson(asset: Asset, version: string): string {
  const out: PreviewOutputJson = {
    version,
    asset: {
      kind: asset.kind,
      name: asset.name,
      description: asset.description,
      category: asset.category,
      path: asset.path,
      metadata: asset.metadata as Record<string, unknown> | undefined,
    },
    agents: (Object.entries(agents) as [AgentType, AgentConfig][]).map(
      ([type, cfg]) => ({
        type,
        displayName: cfg.displayName,
        projectPath: getKindDir(type, asset.kind, { global: false }),
        globalPath: getKindDir(type, asset.kind, { global: true }),
      }),
    ),
  };
  return JSON.stringify(out, null, 2);
}

/** Backwards-compat alias for older flow. */
export function formatModePreviewAsJson(
  mode: Mode,
  _legacyAgents: unknown,
  version: string,
): string {
  return formatAssetPreviewAsJson(
    {
      kind: "mode",
      name: mode.name,
      description: mode.description,
      category: mode.category,
      path: mode.path,
      metadata: mode.metadata as Record<string, unknown> | undefined,
    },
    version,
  );
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

export default {
  formatAssetsAsJson,
  formatModesAsJson,
  formatInstallResultsAsJson,
  formatAssetPreviewAsJson,
  formatModePreviewAsJson,
  formatError,
};
