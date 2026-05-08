#!/usr/bin/env node
/**
 * vibe — single-command installer for AI coding-agent assets.
 *
 * Designed to be runnable via:
 *   npx github:anubhavg-icpl/vibe                  # interactive
 *   npx github:anubhavg-icpl/vibe add <names...>   # non-interactive
 *   npx github:anubhavg-icpl/vibe doctor           # detect targets
 *
 * When run that way, the bundled modes/skills/agents/commands/ live next to
 * the dist/ output (one level up). We resolve the default source path
 * accordingly so the user does not need to clone the repo separately.
 */

import { program } from "commander";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

import { discoverAssets, summariseCounts } from "./discovery.js";
import {
  installParallel,
  buildTasks,
  isAssetInstalled,
  getInstallTarget,
} from "./installer.js";
import {
  agents,
  detectInstalledAgents,
  ALL_AGENT_TYPES,
  getKindDir,
} from "./agents.js";
import {
  loadConfig,
  initConfig,
  getConfigParallelism,
  mergeConfigWithOptions,
} from "./config.js";
import {
  getCompletionScript,
  getInstallInstructions,
  detectShell,
  type ShellType,
} from "./completions.js";
import {
  formatAssetsAsJson,
  formatInstallResultsAsJson,
  formatAssetPreviewAsJson,
  formatError,
} from "./output.js";
import {
  renderHeader,
  animateHeader,
  colors,
  symbols,
  ModeSearch,
  renderInstallResultCard,
  renderProgressBar,
  startAnimation,
  type AnimController,
} from "./ui/index.js";
import type { Asset, AssetKind, AgentType } from "./types.js";

const VERSION = "2.0.0";

/**
 * Default source resolution — prefer the repo bundled with the CLI when
 * present (so `npx github:user/vibe` Just Works), then $PWD/modes (legacy),
 * finally cwd.
 */
function defaultSource(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "..");
  if (
    existsSync(resolve(repoRoot, "skills")) ||
    existsSync(resolve(repoRoot, "modes"))
  ) {
    return repoRoot;
  }
  return process.cwd();
}

interface CliOptions {
  global?: boolean;
  agent?: string[];
  asset?: string[];
  kind?: string[];
  category?: string;
  list?: boolean;
  yes?: boolean;
  json?: boolean;
  preview?: string;
  source?: string;
}

program
  .name("vibe")
  .description(
    "Install Vibe AI-agent assets (skills/agents/commands/modes) onto coding-agent CLIs.",
  )
  .version(VERSION)
  .argument("[source]", "Path to Vibe repo root (default: bundled or ./)", "")
  .option(
    "-g, --global",
    "Install globally (user-level) instead of per-project",
  )
  .option(
    "-a, --agent <agents...>",
    "Target CLIs: opencode | claude-code | codex | cursor | gemini-cli | copilot-cli | factory-droid",
  )
  .option(
    "-s, --asset <names...>",
    "Specific asset names to install (skips picker)",
  )
  .option(
    "-k, --kind <kinds...>",
    "Filter by kind: skill | agent | command | mode",
  )
  .option("-c, --category <category>", "Filter by category")
  .option("-l, --list", "List available assets without installing")
  .option("-y, --yes", "Skip confirmation prompts (auto-accept)")
  .option("--json", "JSON output for scripting/CI")
  .option("--preview <name>", "Preview a single asset and exit")
  .action(async (source: string, options: CliOptions) => {
    await main(source || defaultSource(), options);
  });

program
  .command("add <names...>")
  .description("Install one or more named assets")
  .option("-g, --global", "Install globally")
  .option("-a, --agent <agents...>", "Target CLIs")
  .option("-y, --yes", "Auto-confirm")
  .option("--json", "JSON output")
  .action(async (names: string[], opts: CliOptions) => {
    await main(defaultSource(), { ...opts, asset: names, yes: true });
  });

program
  .command("list")
  .description("List bundled assets")
  .option("-k, --kind <kinds...>", "Filter by kind")
  .option("-c, --category <category>", "Filter by category")
  .option("--json", "JSON output")
  .action(async (opts: CliOptions) => {
    await main(defaultSource(), { ...opts, list: true });
  });

program
  .command("info <name>")
  .description("Show a rich preview of one asset")
  .option("--json", "JSON output")
  .action(async (name: string, opts: { json?: boolean }) => {
    opts.json = opts.json ?? program.opts().json;
    const root = defaultSource();
    const items = await discoverAssets(root);
    const search = new ModeSearch<Asset>(items);
    const direct = items.find(
      (a) => a.name.toLowerCase() === name.toLowerCase(),
    );
    let asset: Asset | undefined = direct;
    if (!asset) {
      const results = search.search(name);
      asset = results[0]?.item as Asset | undefined;
    }
    if (!asset) {
      const msg = `Asset not found: ${name}`;
      if (opts.json) console.log(formatError(msg, VERSION));
      else console.error(colors.error(msg));
      process.exit(1);
    }
    if (opts.json) {
      console.log(formatAssetPreviewAsJson(asset, VERSION));
      return;
    }
    printAssetPreview(asset);
  });

program
  .command("doctor")
  .description("Detect target CLIs and verify the local environment")
  .option("--json", "JSON output")
  .action(async (opts: { json?: boolean }) => {
    opts.json = opts.json ?? program.opts().json;
    await runDoctor(opts);
  });

program
  .command("search <query>")
  .description("Fuzzy-search the asset library")
  .option("-k, --kind <kinds...>", "Filter by kind")
  .option("-n, --limit <n>", "Max results (default 20)", "20")
  .option("--json", "JSON output")
  .action(
    async (
      query: string,
      opts: { kind?: string[]; limit?: string; json?: boolean },
    ) => {
      opts.json = opts.json ?? program.opts().json;
      const root = defaultSource();
      const items = await discoverAssets(root, {
        kinds: parseKinds(opts.kind),
      });
      const search = new ModeSearch<Asset>(items);
      const limit = Math.max(1, Math.min(200, Number(opts.limit) || 20));
      const results = search.search(query).slice(0, limit) as Array<{
        item: Asset;
      }>;
      if (opts.json) {
        console.log(formatAssetsAsJson(results.map((r) => r.item), VERSION));
        return;
      }
      console.log();
      console.log(colors.primaryBold(`Search: ${chalk.italic(query)}`));
      console.log();
      for (const r of results) {
        const a = r.item;
        console.log(
          `${colors.muted(`[${a.kind}]`)} ${colors.secondaryBold(a.name)} ${colors.dim("·")} ${colors.muted(a.category)}`,
        );
        console.log(
          `  ${colors.dim(a.description.length > 100 ? a.description.slice(0, 100) + "..." : a.description)}`,
        );
      }
      if (results.length === 0) console.log(colors.muted("No matches."));
      console.log();
    },
  );

program
  .command("targets")
  .description("List the 7 supported target CLIs and their detection status")
  .option("--json", "JSON output")
  .action(async (opts: { json?: boolean }) => {
    opts.json = opts.json ?? program.opts().json;
    const detected = await detectInstalledAgents();
    const detectedSet = new Set(detected);
    const rows = ALL_AGENT_TYPES.map((t) => ({
      type: t,
      displayName: agents[t].displayName,
      detected: detectedSet.has(t),
      projectPath: getKindDir(t, "skill", { global: false }),
      globalPath: getKindDir(t, "skill", { global: true }),
    }));
    if (opts.json) {
      console.log(JSON.stringify({ version: VERSION, targets: rows }, null, 2));
      return;
    }
    console.log();
    console.log(colors.primaryBold("Supported targets"));
    console.log();
    for (const r of rows) {
      const mark = r.detected ? colors.success(symbols.check) : colors.dim(symbols.dot);
      console.log(
        `  ${mark} ${colors.secondaryBold(r.displayName.padEnd(22))} ${colors.muted(r.globalPath ?? "")}`,
      );
    }
    console.log();
  });

program
  .command("completions [shell]")
  .description("Generate shell completion scripts")
  .action((shell?: string) => {
    const target = (shell as ShellType) || detectShell();
    if (!target) {
      console.error(
        colors.error("Could not detect shell. Specify: bash, zsh, or fish"),
      );
      process.exit(1);
    }
    if (!["bash", "zsh", "fish"].includes(target)) {
      console.error(
        colors.error(`Unsupported shell: ${target}. Supported: bash zsh fish`),
      );
      process.exit(1);
    }
    console.log(getCompletionScript(target));
    console.error("");
    console.error(colors.dim("# Installation instructions:"));
    console.error(colors.dim(getInstallInstructions(target)));
  });

program
  .command("init")
  .description("Create a .vibeconfig.yaml")
  .action(async () => {
    try {
      const path = await initConfig();
      console.log(colors.success(`${symbols.check} Created config: ${path}`));
    } catch (error) {
      console.error(
        colors.error(error instanceof Error ? error.message : "Failed"),
      );
      process.exit(1);
    }
  });

program.parse();

/* ───────────────────────── Main interactive flow ───────────────────────── */

function parseKinds(input?: string[]): AssetKind[] | undefined {
  if (!input || input.length === 0) return undefined;
  const valid: AssetKind[] = ["skill", "agent", "command", "mode"];
  return input.filter((k): k is AssetKind =>
    valid.includes(k as AssetKind),
  ) as AssetKind[];
}

async function main(source: string, options: CliOptions): Promise<void> {
  const config = await loadConfig();
  const merged = mergeConfigWithOptions(config, options as never);
  const json = options.json ?? false;

  // Interactive mode: animated startup runs concurrently with discovery.
  // All other modes (json, list, preview, --yes, --asset): use spinner.
  const isInteractive = !json && !options.list && !options.preview && !options.asset?.length && !options.yes;
  const animCtrl: AnimController | null = isInteractive ? startAnimation(VERSION) : null;

  if (!json && !isInteractive) console.log(renderHeader(VERSION));

  const spinner = (!json && !isInteractive) ? p.spinner() : (json ? null : null);
  spinner?.start("Discovering assets…");

  let assets = await discoverAssets(source, { kinds: parseKinds(options.kind) });

  // Stop animation (waits for minimum time + "Ready" flash then clears)
  if (animCtrl) {
    await animCtrl.stop();
    await animateHeader(VERSION);
  }

  if (options.category) {
    assets = assets.filter((a) => a.category === options.category);
  }
  if (assets.length === 0) {
    spinner?.stop(chalk.red("No assets found"));
    if (json)
      console.log(formatError("No assets found at the given source", VERSION));
    else
      p.outro(chalk.red("No assets found. Pass a path to a vibe checkout, or run from a clone."));
    process.exit(1);
  }
  const counts = summariseCounts(assets);
  const countMsg =
    `Found ${colors.success(String(assets.length))} item${assets.length === 1 ? "" : "s"}` +
    ` ${colors.muted(`(${counts.skill} skills · ${counts.agent} agents · ${counts.command} commands · ${counts.mode} modes)`)}`;
  if (animCtrl) {
    p.log.step(countMsg);
  } else {
    spinner?.stop(countMsg);
  }

  // ── Search step (interactive mode only) ──────────────────────────────────
  if (isInteractive) {
    const searchInput = await p.text({
      message: `${colors.primary("/")} Search assets`,
      placeholder: "name, keyword, or category  (Enter = show all)",
    });
    // ESC cancels the search filter but does NOT exit — continues with all assets
    if (!p.isCancel(searchInput)) {
      const q = String(searchInput ?? "").trim().toLowerCase();
      if (q) {
        const before = assets.length;
        const filtered = assets.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.description.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q)
        );
        if (filtered.length === 0) {
          p.log.warn(colors.warning(`No assets matched "${q}" — showing all ${before}`));
        } else {
          assets = filtered;
          p.log.info(
            `${colors.primary(String(assets.length))} asset${assets.length === 1 ? "" : "s"} matched` +
            ` ${colors.muted(`"${q}"`)}`
          );
        }
      }
    }
  }

  // Preview-only mode
  if (options.preview) {
    const target = assets.find(
      (a) => a.name.toLowerCase() === options.preview!.toLowerCase(),
    );
    if (!target) {
      const msg = `Asset not found: ${options.preview}`;
      if (json) console.log(formatError(msg, VERSION));
      else p.log.error(msg);
      process.exit(1);
    }
    if (json) console.log(formatAssetPreviewAsJson(target, VERSION));
    else printAssetPreview(target);
    process.exit(0);
  }

  // List mode
  if (options.list) {
    if (json) {
      console.log(formatAssetsAsJson(assets, VERSION));
    } else {
      printGroupedList(assets);
    }
    process.exit(0);
  }

  // Selection
  let selected: Asset[];
  if (options.asset && options.asset.length > 0) {
    const search = new ModeSearch<Asset>(assets);
    const matched: Asset[] = [];
    for (const name of options.asset) {
      const exact = assets.find(
        (a) => a.name.toLowerCase() === name.toLowerCase(),
      );
      if (exact) {
        matched.push(exact);
        continue;
      }
      const results = search.search(name);
      if (results.length > 0 && (results[0].score ?? 1) < 0.3) {
        matched.push(results[0].item);
      }
    }
    if (matched.length === 0) {
      const msg = `No matching assets for: ${options.asset.join(", ")}`;
      if (json) console.log(formatError(msg, VERSION));
      else p.log.error(msg);
      process.exit(1);
    }
    selected = matched;
    if (!json) {
      p.log.info(
        `Selected ${matched.length}: ${matched.map((a) => colors.secondary(a.name)).join(", ")}`,
      );
    }
  } else if (options.yes) {
    selected = assets;
    if (!json) p.log.info(`Installing all ${assets.length} items`);
  } else {
    const choices = assets.map((a) => ({
      value: a,
      label: `[${a.kind}] ${a.name}`,
      hint:
        a.description.length > 60
          ? a.description.slice(0, 57) + "…"
          : a.description,
    }));
    const picked = await p.multiselect({
      message: `Pick what to install  ${colors.dim("· type to filter")}`,
      options: choices,
      required: true,
    });
    if (p.isCancel(picked)) {
      p.cancel("Cancelled");
      process.exit(0);
    }
    selected = picked as Asset[];
  }

  // Target selection
  let targets: AgentType[];
  if (merged.agent && merged.agent.length > 0) {
    const valid = ALL_AGENT_TYPES;
    const invalid = merged.agent.filter(
      (a: string) => !valid.includes(a as AgentType),
    );
    if (invalid.length > 0) {
      const msg = `Invalid agents: ${invalid.join(", ")}. Valid: ${valid.join(", ")}`;
      if (json) console.log(formatError(msg, VERSION));
      else p.log.error(msg);
      process.exit(1);
    }
    targets = merged.agent as AgentType[];
  } else {
    spinner?.start("Detecting installed agents…");
    const detected = await detectInstalledAgents();
    spinner?.stop(
      `Detected ${detected.length} agent${detected.length === 1 ? "" : "s"}`,
    );
    if (detected.length === 0 && options.yes) {
      targets = ALL_AGENT_TYPES;
    } else if (detected.length === 0) {
      const allChoices = ALL_AGENT_TYPES.map((t) => ({
        value: t,
        label: agents[t].displayName,
      }));
      const picked = await p.multiselect({
        message: "No agents detected — pick targets",
        options: allChoices,
        required: true,
      });
      if (p.isCancel(picked)) {
        p.cancel("Cancelled");
        process.exit(0);
      }
      targets = picked as AgentType[];
    } else if (options.yes || detected.length === 1) {
      targets = detected;
      if (!json) {
        p.log.info(
          `Targets: ${targets.map((t) => colors.secondary(agents[t].displayName)).join(", ")}`,
        );
      }
    } else {
      const choices = detected.map((t) => ({
        value: t,
        label: agents[t].displayName,
      }));
      const picked = await p.multiselect({
        message: "Pick target CLIs",
        options: choices,
        required: true,
        initialValues: detected,
      });
      if (p.isCancel(picked)) {
        p.cancel("Cancelled");
        process.exit(0);
      }
      targets = picked as AgentType[];
    }
  }

  // Scope
  let installGlobally: boolean = merged.global ?? false;
  if (merged.global === undefined && !options.yes && !json) {
    const scope = await p.select({
      message: "Install scope",
      options: [
        { value: false, label: "Project", hint: "current dir, committed with project" },
        { value: true, label: "Global", hint: "user-level, all projects" },
      ],
    });
    if (p.isCancel(scope)) {
      p.cancel("Cancelled");
      process.exit(0);
    }
    installGlobally = scope as boolean;
  }

  // Plan summary
  if (!json) {
    console.log();
    p.log.step(colors.primaryBold("Installation plan"));
    for (const a of selected) {
      p.log.message(`  ${colors.muted(`[${a.kind}]`)} ${colors.secondary(a.name)}`);
      for (const t of targets) {
        const target = getInstallTarget(a, t, { global: installGlobally });
        if (target === null) {
          p.log.message(
            `    ${colors.dim(symbols.arrow)} ${agents[t].displayName} ${colors.dim("(unsupported — will skip)")}`,
          );
        } else {
          const exists = await isAssetInstalled(a, t, {
            global: installGlobally,
          });
          const tag = exists ? colors.warning(" (overwrite)") : "";
          p.log.message(
            `    ${colors.dim(symbols.arrow)} ${agents[t].displayName}: ${colors.dim(target)}${tag}`,
          );
        }
      }
    }
    console.log();
  }

  if (!options.yes && !json) {
    const ok = await p.confirm({ message: "Proceed?" });
    if (p.isCancel(ok) || !ok) {
      p.cancel("Cancelled");
      process.exit(0);
    }
  }

  const tasks = buildTasks(selected, targets);
  const concurrency = getConfigParallelism(config);

  if (!json) spinner?.start("Installing…");
  let lastDone = 0;
  const start = Date.now();
  const results = await installParallel(
    tasks,
    { global: installGlobally, concurrency },
    json
      ? undefined
      : (progress) => {
          if (progress.completed > lastDone) {
            lastDone = progress.completed;
            const bar = renderProgressBar({
              total: progress.total,
              current: progress.completed,
              width: 25,
            });
            spinner?.message(
              `${bar} ${progress.current ? colors.dim(`${progress.current.asset.kind}/${progress.current.asset.name}`) : ""}`,
            );
          }
        },
  );
  const ms = Date.now() - start;
  if (!json) spinner?.stop("Installation complete");

  const failed = results.filter((r) => !r.success);
  if (json) {
    console.log(formatInstallResultsAsJson(results, VERSION));
  } else {
    console.log();
    console.log(renderInstallResultCard(results));
    console.log();
    console.log(colors.dim(`Completed in ${(ms / 1000).toFixed(1)}s`));
    console.log();
    p.outro(
      failed.length === 0 ? colors.success("Done!") : colors.warning("Completed with errors"),
    );
  }
  process.exit(failed.length > 0 ? 1 : 0);
}

/* ───────────────────────── Helpers ─────────────────────────────────────── */

function printGroupedList(assets: Asset[]): void {
  console.log();
  p.log.step(colors.primaryBold(`Available (${assets.length})`));
  const byKind = new Map<AssetKind, Asset[]>();
  for (const a of assets) {
    const list = byKind.get(a.kind) ?? [];
    list.push(a);
    byKind.set(a.kind, list);
  }
  for (const [kind, items] of byKind) {
    console.log();
    console.log(colors.secondaryBold(`${kind} (${items.length})`));
    for (const a of items.slice(0, 8)) {
      console.log(
        `  ${colors.success(symbols.bullet)} ${colors.textBold(a.name)} ${colors.muted(`· ${a.category}`)}`,
      );
      console.log(
        `    ${colors.dim(a.description.length > 80 ? a.description.slice(0, 80) + "…" : a.description)}`,
      );
    }
    if (items.length > 8)
      console.log(colors.dim(`  …and ${items.length - 8} more`));
  }
  console.log();
  p.outro(
    `Use ${colors.secondary("vibe add <name>")} to install or ${colors.secondary("vibe info <name>")} to preview.`,
  );
}

function printAssetPreview(asset: Asset): void {
  console.log();
  console.log(
    `${colors.muted(`[${asset.kind}]`)} ${colors.primaryBold(asset.name)}`,
  );
  console.log(colors.muted(`category: ${asset.category}`));
  console.log();
  console.log(asset.description);
  console.log();
  console.log(colors.muted("Targets:"));
  for (const t of ALL_AGENT_TYPES) {
    const dest = getInstallTarget(asset, t, { global: true });
    const tag =
      dest === null
        ? colors.dim("(not supported)")
        : colors.dim(dest);
    console.log(`  ${colors.secondary(agents[t].displayName.padEnd(22))} ${tag}`);
  }
  console.log();
  console.log(colors.muted(`source: ${asset.path}`));
  console.log();
}

async function runDoctor(opts: { json?: boolean }): Promise<void> {
  const root = defaultSource();
  const detected = await detectInstalledAgents();
  const detectedSet = new Set(detected);
  const assetCount = (await discoverAssets(root)).length;
  const targets = ALL_AGENT_TYPES.map((t) => ({
    type: t,
    displayName: agents[t].displayName,
    detected: detectedSet.has(t),
    skillsDir: getKindDir(t, "skill", { global: true }),
  }));

  const node = process.versions.node;
  const ok = {
    nodeOk: parseInt(node.split(".")[0], 10) >= 18,
    sourceOk: assetCount > 0,
    anyTarget: detected.length > 0,
  };

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          version: VERSION,
          node,
          source: root,
          assetCount,
          targets,
          ok,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log();
  console.log(colors.primaryBold("vibe doctor"));
  console.log();
  console.log(`  ${colors.muted("vibe version".padEnd(18))} ${VERSION}`);
  console.log(
    `  ${colors.muted("node".padEnd(18))} ${ok.nodeOk ? colors.success(node) : colors.error(node + "  (need ≥18)")}`,
  );
  console.log(
    `  ${colors.muted("source".padEnd(18))} ${ok.sourceOk ? colors.success(root) : colors.error(root + "  (no assets!)")}`,
  );
  console.log(
    `  ${colors.muted("assets".padEnd(18))} ${colors.success(String(assetCount))}`,
  );
  console.log();
  console.log(colors.primaryBold("Targets"));
  for (const t of targets) {
    const mark = t.detected
      ? colors.success(symbols.check)
      : colors.dim(symbols.dot);
    console.log(
      `  ${mark} ${colors.secondary(t.displayName.padEnd(22))} ${colors.muted(t.skillsDir ?? "")}`,
    );
  }
  console.log();
  if (!ok.anyTarget) {
    console.log(
      colors.warning(
        `${symbols.warning} No agent CLIs detected. Vibe will still install if you use ${colors.secondary("--agent <name>")}.`,
      ),
    );
  }
  console.log();
}
