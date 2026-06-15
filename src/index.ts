#!/usr/bin/env node
/**
 * vibe — single-command installer for AI coding-agent assets.
 *
 * Usage examples:
 *   npx github:anubhavg-icpl/vibe                  # interactive (animated)
 *   npx github:anubhavg-icpl/vibe add tony-stark    # install by name
 *   npx github:anubhavg-icpl/vibe add <names...>    # install multiple
 *   npx github:anubhavg-icpl/vibe list              # list bundled assets
 *   npx github:anubhavg-icpl/vibe list --installed  # list installed assets
 *   npx github:anubhavg-icpl/vibe info tony-stark   # preview an asset
 *   npx github:anubhavg-icpl/vibe search "react"    # fuzzy search
 *   npx github:anubhavg-icpl/vibe uninstall <names> # remove installed assets
 *   npx github:anubhavg-icpl/vibe update [names...] # re-install latest versions
 *   npx github:anubhavg-icpl/vibe doctor            # detect targets & health
 *   npx github:anubhavg-icpl/vibe targets           # show supported CLIs
 *   npx github:anubhavg-icpl/vibe add <name> --dry-run  # preview without installing
 *
 * When run via npx, the bundled modes/skills/agents/commands/ live next to
 * the dist/ output (one level up). We resolve the default source path
 * accordingly so the user does not need to clone the repo separately.
 */

import { program } from "commander";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { existsSync, rmSync, statSync } from "fs";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";
import { stat as statAsync } from "fs/promises";
import { emitKeypressEvents } from "readline";

import { discoverAssets, summariseCounts } from "./discovery.js";
import {
  installParallel,
  buildTasks,
  isAssetInstalled,
  getInstallTarget,
  rollbackInstalledPaths,
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
  getTheme,
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

async function readAssetPickerCommand(
  assetCount: number,
  allowBrowse: boolean,
): Promise<AssetPickerCommand> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    const action = await p.select({
      message: "Choose an action",
      options: [
        ...(allowBrowse
          ? [{ value: "browse" as const, label: `Browse ${assetCount} assets` }]
          : []),
        { value: "search" as const, label: "Search assets", hint: "same as pressing /" },
        { value: "all" as const, label: `Install all ${assetCount} assets` },
        { value: "cancel" as const, label: "Cancel" },
      ],
    });
    return p.isCancel(action) ? "cancel" : action;
  }

  return new Promise((resolveCommand) => {
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    emitKeypressEvents(stdin);
    stdin.setRawMode(true);
    stdin.resume();

    const hint = allowBrowse
      ? `Press ${colors.primary("/")} to search, ${colors.secondary("Enter")} to browse ${assetCount}, ${colors.secondary("a")} to install all, ${colors.secondary("q")} to cancel`
      : `Press ${colors.primary("/")} to search, ${colors.secondary("a")} to install all, ${colors.secondary("q")} to cancel`;

    process.stdout.write(`${colors.muted("│")}\n${colors.muted("◇")}  ${hint}\n${colors.muted("│")}  `);

    const done = (command: AssetPickerCommand) => {
      stdin.off("keypress", onKeypress);
      stdin.setRawMode(wasRaw);
      process.stdout.write("\n");
      resolveCommand(command);
    };

    const onKeypress = (input: string, key: { name?: string; ctrl?: boolean }) => {
      if (key.ctrl && key.name === "c") done("cancel");
      else if (key.name === "escape" || input === "q") done("cancel");
      else if (input === "/") done("search");
      else if (input === "a") done("all");
      else if (allowBrowse && key.name === "return") done("browse");
    };

    stdin.on("keypress", onKeypress);
  });
}

function makeAssetChoices(assets: Asset[]): p.Option<Asset>[] {
  return assets.map((a) => ({
    value: a,
    label: `[${a.kind}] ${a.name}`,
    hint:
      a.description.length > 60
        ? a.description.slice(0, 57) + "…"
        : a.description,
  }));
}

async function searchAssets(
  searchableAssets: Asset[],
  allAssets: Asset[],
): Promise<Asset[]> {
  const query = await p.text({
    message: `${colors.primary("/")} Search assets`,
    placeholder: "keyword, category, or empty to show all",
  });
  if (p.isCancel(query)) return searchableAssets;

  const q = String(query ?? "").trim();
  if (!q) return allAssets;

  const fuse = new ModeSearch<Asset>(searchableAssets);
  const results = fuse.search(q).map((r) => r.item);
  if (results.length === 0) {
    p.log.warn(colors.warning(`No assets matched "${q}"`));
    return searchableAssets;
  }

  p.log.info(
    `${colors.primary(String(results.length))} asset${results.length === 1 ? "" : "s"} matched` +
      ` ${colors.muted(`"${q}"`)}`,
  );
  return results;
}

async function pickAssetsInteractively(initialAssets: Asset[]): Promise<Asset[]> {
  const allAssets = [...initialAssets];
  let assets = [...initialAssets];

  while (true) {
    if (assets.length <= MAX_INTERACTIVE_ASSETS) {
      const command = await readAssetPickerCommand(assets.length, true);
      if (command === "cancel") {
        p.cancel("Cancelled");
        process.exit(0);
      }
      if (command === "all") return assets;
      if (command === "search") {
        assets = await searchAssets(assets, allAssets);
        continue;
      }

      const picked = await p.multiselect({
        message: `Pick what to install  ${colors.dim("· / search before browsing")}`,
        options: makeAssetChoices(assets),
        required: true,
      });
      if (p.isCancel(picked)) {
        p.cancel("Cancelled");
        process.exit(0);
      }
      return picked as Asset[];
    }

    p.log.warn(
      colors.warning(`Too many assets (${assets.length}) to display in a picker.`) +
        `\n  ${colors.dim("Press / to narrow the results, or use one of these:")}` +
        `\n  ${colors.secondary(`vibe add <name>`)} - install specific assets by name` +
        `\n  ${colors.secondary(`vibe add <name> --yes`)} - install without prompts` +
        `\n  ${colors.secondary(`vibe list -k <kind>`)} - list by kind, then install`,
    );

    const command = await readAssetPickerCommand(assets.length, false);
    if (command === "cancel") {
      p.cancel("Cancelled");
      process.exit(0);
    }
    if (command === "all") return assets;
    assets = await searchAssets(assets, allAssets);
  }
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
  animation?: boolean;
  noAnimation?: boolean;
  dryRun?: boolean;
  installed?: boolean;
}

type AssetPickerCommand = "search" | "browse" | "all" | "cancel";

const MAX_INTERACTIVE_ASSETS = 50;

function rootOptions(): CliOptions {
  return program.opts<CliOptions>();
}

function mergeRootOptions<T extends CliOptions>(opts: T): T {
  return { ...rootOptions(), ...opts };
}

const EXAMPLES = `
Examples:
  vibe                           Interactive install with animation
  vibe add tony-stark-mode       Install a specific asset
  vibe add <a> <b> --yes --json Install multiple, non-interactive
  vibe list                      Show all available assets
  vibe list --installed          Show what's already installed
  vibe list -k skill -c devops   List skills in the devops category
  vibe list -k system-prompt     List the 758 vendor system prompts
  vibe add claude-opus-4.8       Install a leaked system prompt as reference
  vibe info tony-stark-mode      Preview an asset before installing
  vibe search "react"            Fuzzy-search the asset library
  vibe uninstall tony-stark      Remove an installed asset
  vibe update                    Re-install all (latest versions)
  vibe update tony-stark         Re-install a specific asset
  vibe add <name> --dry-run      Preview what would be installed
  vibe doctor                    Check environment and detected CLIs
  vibe targets                   Show supported target CLIs
  vibe completions zsh           Generate shell completions`;

program
  .name("vibe")
  .description(
    "Install Vibe AI-agent assets (skills/agents/commands/modes/system-prompts) onto coding-agent CLIs." +
    EXAMPLES,
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
    "Filter by kind: skill | agent | command | mode | system-prompt",
  )
  .option("-c, --category <category>", "Filter by category")
  .option("-l, --list", "List available assets without installing")
  .option("-y, --yes", "Skip confirmation prompts (auto-accept)")
  .option("--json", "JSON output for scripting/CI")
  .option("--preview <name>", "Preview a single asset and exit")
  .option("--no-animation", "Skip startup animation (for slow terminals or scripts)")
  .option("--dry-run", "Show what would be installed without actually installing")
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
  .option("--dry-run", "Preview what would be installed without installing")
  .action(async (names: string[], opts: CliOptions) => {
    await main(defaultSource(), { ...mergeRootOptions(opts), asset: names, yes: true });
  });

program
  .command("list")
  .description("List bundled assets")
  .option("-k, --kind <kinds...>", "Filter by kind")
  .option("-c, --category <category>", "Filter by category")
  .option("--installed", "Show only installed assets")
  .option("--json", "JSON output")
  .action(async (opts: CliOptions & { installed?: boolean }) => {
    const merged = mergeRootOptions(opts);
    if (merged.installed) {
      await runListInstalled(merged);
    } else {
      await main(defaultSource(), { ...merged, list: true });
    }
  });

program
  .command("info <name>")
  .description("Show a rich preview of one asset")
  .option("--json", "JSON output")
  .action(async (name: string, opts: { json?: boolean }) => {
    opts.json = opts.json ?? rootOptions().json;
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
      // Show similar suggestions
      const suggestions = search.search(name).slice(0, 5);
      const msg = `Asset not found: ${name}`;
      if (opts.json) {
        console.log(formatError(msg, VERSION));
      } else {
        console.error(colors.error(msg));
        if (suggestions.length > 0) {
          console.error(colors.muted("\nDid you mean one of these?"));
          for (const s of suggestions) {
            console.error(
              `  ${colors.secondary(s.item.name)} ${colors.dim(`(${s.item.kind} · ${s.item.category})`)}`,
            );
          }
        }
        console.error(
          colors.dim(`\nUse ${colors.secondary("vibe search <query>")} to search the full library.`),
        );
      }
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
    opts.json = opts.json ?? rootOptions().json;
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
      opts.json = opts.json ?? rootOptions().json;
      const root = defaultSource();
      const items = await discoverAssets(root, {
        kinds: parseKinds(opts.kind),
      });
      const search = new ModeSearch<Asset>(items);
      const limit = Math.max(1, Math.min(200, Number(opts.limit) || 20));
      const results = search.search(query).slice(0, limit) as Array<{
        item: Asset;
        score: number;
      }>;
      if (opts.json) {
        console.log(
          formatAssetsAsJson(
            results.map((r) => ({ ...r.item, _score: r.score })),
            VERSION,
          ),
        );
        return;
      }
      console.log();
      console.log(colors.primaryBold(`Search: ${chalk.italic(query)}`));
      console.log(
        colors.dim(`${results.length} result${results.length === 1 ? "" : "s"} (sorted by relevance)`),
      );
      console.log();
      for (const r of results) {
        const a = r.item;
        const relevance = Math.round((1 - r.score) * 100);
        const relBar = colors.dim(`(${relevance}% match)`);
        console.log(
          `${colors.muted(`[${a.kind}]`)} ${colors.secondaryBold(a.name)} ${colors.dim("·")} ${colors.muted(a.category)} ${relBar}`,
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
    opts.json = opts.json ?? rootOptions().json;
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

program
  .command("uninstall <names...>")
  .description("Remove installed assets from target CLIs")
  .option("-g, --global", "Remove from global scope")
  .option("-a, --agent <agents...>", "Target CLIs (default: auto-detect)")
  .option("--json", "JSON output")
  .option("-y, --yes", "Skip confirmation")
  .action(async (names: string[], opts: CliOptions) => {
    await runUninstall(names, mergeRootOptions(opts));
  });

program
  .command("update [names...]")
  .description("Re-install assets to get the latest versions")
  .option("-g, --global", "Install globally")
  .option("-a, --agent <agents...>", "Target CLIs")
  .option("-y, --yes", "Skip confirmation")
  .option("--json", "JSON output")
  .option("--dry-run", "Preview what would be updated")
  .action(async (names: string[], opts: CliOptions) => {
    await runUpdate(names, mergeRootOptions(opts));
  });

program.parse();

/* ───────────────────────── Main interactive flow ───────────────────────── */

function parseKinds(input?: string[]): AssetKind[] | undefined {
  if (!input || input.length === 0) return undefined;
  const valid: AssetKind[] = ["skill", "agent", "command", "mode", "system-prompt"];
  return input.filter((k): k is AssetKind =>
    valid.includes(k as AssetKind),
  ) as AssetKind[];
}

/** Every installable kind, used when scanning on-disk install directories. */
const ALL_KINDS: AssetKind[] = ["skill", "agent", "command", "mode", "system-prompt"];

/** Recursively collect file basenames (no extension) under a directory. */
async function listInstalledEntries(
  dir: string,
): Promise<Array<{ name: string; path: string }>> {
  const fs = await import("fs/promises");
  const out: Array<{ name: string; path: string }> = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listInstalledEntries(full)));
    } else if (entry.isFile()) {
      const name = entry.name.replace(/\.(agent\.md|md)$/, "");
      if (name.toUpperCase() === "README") continue;
      out.push({ name, path: full });
    }
  }
  return out;
}

/**
 * Exit only after stdout has fully drained. `process.exit()` can truncate large
 * buffered output when piped (e.g. `vibe list --json | jq`); this waits for the
 * write buffer to flush first.
 */
async function flushAndExit(code: number): Promise<never> {
  await new Promise<void>((res) => {
    if (process.stdout.write("")) res();
    else process.stdout.once("drain", () => res());
  });
  process.exit(code);
}

async function main(source: string, options: CliOptions): Promise<void> {
  const config = await loadConfig();
  const merged = mergeConfigWithOptions(config, options as never);
  const json = options.json ?? false;
  const dryRun = options.dryRun ?? false;
  const animationEnabled = options.animation !== false && !options.noAnimation;

  // Interactive mode: animated startup runs concurrently with discovery.
  // All other modes (json, list, preview, --yes, --asset, --no-animation): use spinner.
  const isInteractive =
    !json && !options.list && !options.preview && !options.asset?.length && !options.yes && animationEnabled;
  const animCtrl: AnimController | null = isInteractive ? startAnimation(VERSION) : null;

  if (!json && !isInteractive) console.log(renderHeader(VERSION));

  const spinner = !json && !isInteractive ? p.spinner() : null;
  spinner?.start("Discovering assets…");

  let assets = await discoverAssets(source, {
    kinds: parseKinds(options.kind),
    onKindFound: !json ? (kind, count) => {
      spinner?.message(`Discovering assets… ${colors.dim(`${kind}: ${count}`)}`);
    } : undefined,
  });

  // Stop animation (shows "Ready", waits for keypress, clears screen)
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
    ` ${colors.muted(`(${counts.skill} skills · ${counts.agent} agents · ${counts.command} commands · ${counts.mode} modes · ${counts["system-prompt"]} system-prompts)`)}`;
  if (animCtrl) {
    p.log.step(countMsg);
  } else {
    spinner?.stop(countMsg);
  }

  // Preview-only mode
  if (options.preview) {
    const target = assets.find(
      (a) => a.name.toLowerCase() === options.preview!.toLowerCase(),
    );
    if (!target) {
      // Try fuzzy search for suggestions
      const search = new ModeSearch<Asset>(assets);
      const suggestions = search.search(options.preview!).slice(0, 3);
      const msg = `Asset not found: ${options.preview}`;
      if (json) {
        console.log(formatError(msg, VERSION));
      } else {
        p.log.error(msg);
        if (suggestions.length > 0) {
          p.log.info(colors.muted("Did you mean: " + suggestions.map((s) => colors.secondary(s.item.name)).join(", ")));
        }
      }
      process.exit(1);
    }
    if (json) console.log(formatAssetPreviewAsJson(target, VERSION));
    else printAssetPreview(target);
    await flushAndExit(0);
  }

  // List mode
  if (options.list) {
    if (json) {
      console.log(formatAssetsAsJson(assets, VERSION));
    } else {
      printGroupedList(assets);
    }
    await flushAndExit(0);
  }

  // Selection
  let selected: Asset[];
  if (options.asset && options.asset.length > 0) {
    const search = new ModeSearch<Asset>(assets);
    const matched: Asset[] = [];
    const unmatched: string[] = [];
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
      } else {
        unmatched.push(name);
      }
    }
    if (unmatched.length > 0 && !json) {
      p.log.warn(
        colors.warning(`No match for: ${unmatched.join(", ")}`) +
        colors.dim(" (skipped)"),
      );
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
    selected = await pickAssetsInteractively(assets);
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

  // Scope — with clear explanations for beginners
  let installGlobally: boolean = merged.global ?? false;
  if (merged.global === undefined && !options.yes && !json) {
    const scope = await p.select({
      message: "Install scope",
      options: [
        {
          value: false,
          label: "Project",
          hint: "Installed into ./<cli-dir>/ — committed with your repo, team-shared",
        },
        {
          value: true,
          label: "Global",
          hint: "Installed into ~/.<cli-dir>/ — available in all your projects",
        },
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
    const label = dryRun ? colors.warningBold("Installation plan (dry run — nothing will be changed)") : colors.primaryBold("Installation plan");
    p.log.step(label);
    let totalBytes = 0;
    for (const a of selected) {
      p.log.message(`  ${colors.muted(`[${a.kind}]`)} ${colors.secondary(a.name)}`);
      // Calculate source size
      try {
        const s = await statAsync(a.path);
        totalBytes += s.size;
      } catch {
        // rough estimate if stat fails
      }
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
    const totalTasks = selected.length * targets.length;
    const sizeStr = totalBytes > 0 ? formatBytes(totalBytes * targets.length) : "";
    console.log(
      colors.dim(`  ${totalTasks} operation${totalTasks !== 1 ? "s" : ""}${sizeStr ? ` · ~${sizeStr} total` : ""}`),
    );
    console.log();
  }

  // Dry run: stop here
  if (dryRun) {
    if (json) {
      console.log(JSON.stringify({ version: VERSION, dryRun: true, message: "No changes were made" }, null, 2));
    } else {
      p.outro(colors.dim("Dry run complete — no files were changed."));
    }
    process.exit(0);
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

    // Offer rollback when partial failure occurs
    if (failed.length > 0) {
      const successful = results.filter((r) => r.success && !r.skipped && r.path);
      if (successful.length > 0 && !options.yes) {
        console.log();
        const rollback = await p.confirm({
          message: `${successful.length} item(s) succeeded but ${failed.length} failed. Roll back the successful installs?`,
        });
        if (rollback && !p.isCancel(rollback)) {
          const rb = await rollbackInstalledPaths(results);
          if (rb.removed.length > 0) {
            p.log.info(colors.dim(`Rolled back ${rb.removed.length} item(s).`));
          }
          if (rb.failed.length > 0) {
            p.log.warn(colors.warning(`Could not remove ${rb.failed.length} path(s).`));
          }
        }
      } else if (successful.length > 0) {
        console.log(
          colors.dim(`Tip: Re-run with same command to retry, or use ${colors.secondary("vibe uninstall")} to clean up.`),
        );
      }
    }

    console.log();
    p.outro(
      failed.length === 0 ? colors.success("Done!") : colors.warning("Completed with errors"),
    );
  }
  await flushAndExit(failed.length > 0 ? 1 : 0);
}

/* ───────────────────────── Helpers ─────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
    for (const a of items) {
      console.log(
        `  ${colors.success(symbols.bullet)} ${colors.textBold(a.name)} ${colors.muted(`· ${a.category}`)}`,
      );
      console.log(
        `    ${colors.dim(a.description.length > 80 ? a.description.slice(0, 80) + "…" : a.description)}`,
      );
    }
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
  const targets = ALL_AGENT_TYPES.map((t) => {
    const globalDir = getKindDir(t, "skill", { global: true });
    const projectDir = getKindDir(t, "skill", { global: false });
    // Check write permission for global dir
    let writable = false;
    if (globalDir) {
      try {
        const parent = dirname(globalDir);
        statSync(parent);
        writable = true;
      } catch {
        writable = false;
      }
    }
    return {
      type: t,
      displayName: agents[t].displayName,
      detected: detectedSet.has(t),
      skillsDir: globalDir,
      projectDir,
      writable,
    };
  });

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
    const writeMark = t.detected
      ? (t.writable ? colors.dim("writable") : colors.error("no write access"))
      : "";
    console.log(
      `  ${mark} ${colors.secondary(t.displayName.padEnd(22))} ${colors.muted(t.skillsDir ?? "")} ${writeMark}`,
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

/* ───────────────────────── List Installed ──────────────────────────────── */

async function runListInstalled(
  opts: CliOptions & { installed?: boolean; json?: boolean },
): Promise<void> {
  const json = opts.json ?? false;
  const config = await loadConfig();
  const merged = mergeConfigWithOptions(config, opts as never);
  const global = merged.global ?? false;

  // Determine which agents to check
  let targetAgents: AgentType[];
  if (merged.agent && merged.agent.length > 0) {
    targetAgents = merged.agent as AgentType[];
  } else {
    targetAgents = await detectInstalledAgents();
    if (targetAgents.length === 0) targetAgents = ALL_AGENT_TYPES;
  }

  // Load bundled assets for metadata
  const root = defaultSource();
  const allAssets = await discoverAssets(root, { kinds: parseKinds(opts.kind) });
  const assetMap = new Map(allAssets.map((a) => [a.name.toLowerCase(), a]));

  const installed: Array<{
    name: string;
    kind: AssetKind;
    agent: string;
    path: string;
    category: string;
  }> = [];

  for (const agentType of targetAgents) {
    for (const kind of ALL_KINDS) {
      if (opts.kind && !opts.kind.includes(kind)) continue;
      const dir = getKindDir(agentType, kind, { global });
      if (!dir) continue;
      // Recursive walk handles flat kinds and vendor-nested system-prompts.
      const entries = await listInstalledEntries(dir);
      for (const entry of entries) {
        const bundled = assetMap.get(entry.name.toLowerCase());
        installed.push({
          name: entry.name,
          kind,
          agent: agents[agentType].displayName,
          path: entry.path,
          category: bundled?.category ?? "unknown",
        });
      }
    }
  }

  if (json) {
    console.log(
      JSON.stringify({ version: VERSION, installed, total: installed.length }, null, 2),
    );
    return;
  }

  console.log();
  if (installed.length === 0) {
    p.log.info(colors.muted("No installed assets found."));
    console.log(
      colors.dim(`Use ${colors.secondary("vibe list")} to see available assets to install.`),
    );
  } else {
    p.log.step(colors.primaryBold(`Installed (${installed.length})`));
    const byAgent = new Map<string, typeof installed>();
    for (const item of installed) {
      const list = byAgent.get(item.agent) ?? [];
      list.push(item);
      byAgent.set(item.agent, list);
    }
    for (const [agent, items] of byAgent) {
      console.log();
      console.log(colors.secondaryBold(`${agent} (${items.length})`));
      for (const item of items) {
        console.log(
          `  ${colors.success(symbols.bullet)} ${colors.textBold(item.name)} ${colors.muted(`[${item.kind}]`)} ${colors.dim(`· ${item.category}`)}`,
        );
        console.log(`    ${colors.dim(item.path)}`);
      }
    }
  }
  console.log();
}

/* ───────────────────────── Uninstall ───────────────────────────────────── */

async function runUninstall(names: string[], opts: CliOptions): Promise<void> {
  const json = opts.json ?? false;
  const config = await loadConfig();
  const merged = mergeConfigWithOptions(config, opts as never);
  const global = merged.global ?? false;

  // Determine which agents to uninstall from
  let targetAgents: AgentType[];
  if (merged.agent && merged.agent.length > 0) {
    targetAgents = merged.agent as AgentType[];
  } else {
    targetAgents = await detectInstalledAgents();
    if (targetAgents.length === 0) targetAgents = ALL_AGENT_TYPES;
  }

  const root = defaultSource();
  const allAssets = await discoverAssets(root);

  const removed: Array<{ name: string; agent: string; path: string; success: boolean; error?: string }> = [];
  const notFound: string[] = [];

  for (const name of names) {
    // Find the asset metadata
    const asset = allAssets.find(
      (a) => a.name.toLowerCase() === name.toLowerCase(),
    );
    if (!asset) {
      notFound.push(name);
      continue;
    }

    for (const agentType of targetAgents) {
      for (const kind of ALL_KINDS) {
        if (asset.kind !== kind) continue;
        const targetPath = getInstallTarget(asset, agentType, { global });
        if (!targetPath) continue;

        try {
          if (existsSync(targetPath)) {
            rmSync(targetPath, { recursive: true, force: true });
            removed.push({
              name: asset.name,
              agent: agents[agentType].displayName,
              path: targetPath,
              success: true,
            });
          }
        } catch (error) {
          removed.push({
            name: asset.name,
            agent: agents[agentType].displayName,
            path: targetPath,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  if (json) {
    console.log(
      JSON.stringify(
        { version: VERSION, removed, notFound, total: removed.length },
        null,
        2,
      ),
    );
    return;
  }

  if (notFound.length > 0) {
    p.log.warn(colors.warning(`Not found in library: ${notFound.join(", ")}`));
  }

  const successItems = removed.filter((r) => r.success);
  const failedItems = removed.filter((r) => !r.success);

  if (successItems.length === 0 && failedItems.length === 0) {
    p.log.info(colors.muted("Nothing to uninstall — assets not found in target directories."));
  } else {
    console.log();
    if (successItems.length > 0) {
      p.log.step(colors.success(`${symbols.check} Removed ${successItems.length} item${successItems.length === 1 ? "" : "s"}:`));
      for (const r of successItems) {
        console.log(
          `  ${colors.success(symbols.bullet)} ${r.name} ${colors.dim("→")} ${r.agent}`,
        );
      }
    }
    if (failedItems.length > 0) {
      console.log();
      p.log.step(colors.error(`${symbols.cross} Failed ${failedItems.length}:`));
      for (const r of failedItems) {
        console.log(
          `  ${colors.error(symbols.bullet)} ${r.name} ${colors.dim("→")} ${r.agent}: ${r.error}`,
        );
      }
    }
  }
  console.log();
}

/* ───────────────────────── Update ──────────────────────────────────────── */

async function runUpdate(names: string[], opts: CliOptions): Promise<void> {
  const json = opts.json ?? false;
  const dryRun = opts.dryRun ?? false;

  // Update is just re-install — load all assets and pass through
  if (names.length > 0) {
    // Specific assets requested
    await main(defaultSource(), { ...opts, asset: names, yes: true });
  } else {
    // No names: update all installed assets
    const config = await loadConfig();
    const merged = mergeConfigWithOptions(config, opts as never);
    const global = merged.global ?? false;

    let targetAgents: AgentType[];
    if (merged.agent && merged.agent.length > 0) {
      targetAgents = merged.agent as AgentType[];
    } else {
      targetAgents = await detectInstalledAgents();
      if (targetAgents.length === 0) targetAgents = ALL_AGENT_TYPES;
    }

    // Find installed asset names
    const root = defaultSource();
    const allAssets = await discoverAssets(root);
    const installedNames = new Set<string>();

    for (const agentType of targetAgents) {
      for (const kind of ALL_KINDS) {
        const dir = getKindDir(agentType, kind, { global });
        if (!dir) continue;
        for (const entry of await listInstalledEntries(dir)) {
          installedNames.add(entry.name);
        }
      }
    }

    // Match installed names against bundled assets
    const matched = allAssets.filter((a) =>
      installedNames.has(a.name.toLowerCase()) || installedNames.has(a.name),
    );

    if (matched.length === 0) {
      if (json) {
        console.log(formatError("No installed assets found to update", VERSION));
      } else {
        p.log.info(colors.muted("No installed assets found to update."));
        console.log(
          colors.dim(`Use ${colors.secondary("vibe add <name>")} to install assets first.`),
        );
      }
      return;
    }

    if (!json) {
      console.log(renderHeader(VERSION));
      p.log.info(`Updating ${matched.length} installed asset${matched.length === 1 ? "" : "s"}…`);
    }

    await main(defaultSource(), { ...opts, asset: matched.map((a) => a.name), yes: true, dryRun });
  }
}
