#!/usr/bin/env node

import { program } from "commander";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { discoverModes, discoverModesByCategory, getModeDisplayName } from "./modes.js";
import {
  installModeForAgent,
  isModeInstalled,
  getInstallPath,
  installModesParallel,
  createInstallTasks,
} from "./installer.js";
import { detectInstalledAgents, agents } from "./agents.js";
import { loadConfig, initConfig, getConfigParallelism, mergeConfigWithOptions, type MergedOptions } from "./config.js";
import { getCompletionScript, getInstallInstructions, detectShell, type ShellType } from "./completions.js";
import { formatModesAsJson, formatInstallResultsAsJson, formatModePreviewAsJson, formatError } from "./output.js";
import {
  renderHeader,
  colors,
  symbols,
  ModeSearch,
  renderModePreview,
  renderInstallResultCard,
  buildCategoryTree,
  renderCategoryBadges,
  renderProgressBar,
} from "./ui/index.js";
import type { Mode, AgentType } from "./types.js";

const version = "1.0.0";

type Options = MergedOptions;

program
  .name("vibe")
  .description("Install VIBE modes onto coding agents (OpenCode, Claude Code, Codex, Cursor)")
  .version(version)
  .argument("[source]", "Path to VIBE modes directory (default: ./modes)")
  .option("-g, --global", "Install modes globally (user-level) instead of project-level")
  .option("-a, --agent <agents...>", "Specify agents to install to (opencode, claude-code, codex, cursor)")
  .option("-s, --mode <modes...>", "Specify mode names to install (skip selection prompt)")
  .option("-c, --category <category>", "Filter modes by category")
  .option("-l, --list", "List available modes without installing")
  .option("-y, --yes", "Skip confirmation prompts")
  .option("--json", "Output in JSON format for scripting/CI")
  .option("--preview <mode>", "Preview a mode before installing")
  .action(async (source: string = "./modes", options: Options) => {
    await main(source, options);
  });

// Completions subcommand
program
  .command("completions [shell]")
  .description("Generate shell completion scripts")
  .action((shell?: string) => {
    const targetShell = (shell as ShellType) || detectShell();

    if (!targetShell) {
      console.error(colors.error("Could not detect shell. Please specify: bash, zsh, or fish"));
      process.exit(1);
    }

    if (!["bash", "zsh", "fish"].includes(targetShell)) {
      console.error(colors.error(`Unsupported shell: ${targetShell}. Supported: bash, zsh, fish`));
      process.exit(1);
    }

    console.log(getCompletionScript(targetShell as ShellType));
    console.error("");
    console.error(colors.dim("# Installation instructions:"));
    console.error(colors.dim(getInstallInstructions(targetShell as ShellType)));
  });

// Init config subcommand
program
  .command("init")
  .description("Create a .vibeconfig.yaml file in the current directory")
  .action(async () => {
    try {
      const path = await initConfig();
      console.log(colors.success(`${symbols.check} Created config file: ${path}`));
    } catch (error) {
      console.error(colors.error(error instanceof Error ? error.message : "Failed to create config"));
      process.exit(1);
    }
  });

program.parse();

async function main(source: string, options: Options) {
  // Load config and merge with CLI options
  const config = await loadConfig();
  const mergedOptions = mergeConfigWithOptions(config, options);

  // Handle JSON output mode differently
  const jsonOutput = mergedOptions.json;

  if (!jsonOutput) {
    console.log(renderHeader(version));
  }

  try {
    const spinner = jsonOutput ? null : p.spinner();

    spinner?.start("Discovering modes...");
    const modes = mergedOptions.category
      ? await discoverModesByCategory(source, mergedOptions.category)
      : await discoverModes(source);

    if (modes.length === 0) {
      spinner?.stop(chalk.red("No modes found"));
      if (jsonOutput) {
        console.log(formatError("No valid modes found in the specified path", version));
      } else {
        p.outro(chalk.red("No valid modes found in the specified path."));
      }
      process.exit(1);
    }

    spinner?.stop(`Found ${colors.success(String(modes.length))} mode${modes.length > 1 ? "s" : ""}`);

    // Preview mode
    if (mergedOptions.preview) {
      const modeToPreview = modes.find(
        (m) =>
          m.name.toLowerCase() === mergedOptions.preview!.toLowerCase() ||
          getModeDisplayName(m).toLowerCase() === mergedOptions.preview!.toLowerCase(),
      );

      if (!modeToPreview) {
        if (jsonOutput) {
          console.log(formatError(`Mode not found: ${mergedOptions.preview}`, version));
        } else {
          p.log.error(`Mode not found: ${mergedOptions.preview}`);
        }
        process.exit(1);
      }

      if (jsonOutput) {
        console.log(formatModePreviewAsJson(modeToPreview, agents, version));
      } else {
        console.log(renderModePreview(modeToPreview));
      }
      process.exit(0);
    }

    // List modes
    if (mergedOptions.list) {
      if (jsonOutput) {
        console.log(formatModesAsJson(modes, version));
      } else {
        console.log();
        p.log.step(colors.primaryBold("Available Modes"));

        // Show category summary
        const search = new ModeSearch(modes);
        const categories = search.getCategories();
        console.log();
        console.log("  " + renderCategoryBadges(categories));
        console.log();

        listModesByCategory(modes);
        console.log();
        p.outro("Use --mode <name> or --category <category> to install specific modes");
      }
      process.exit(0);
    }

    let selectedModes: Mode[];

    if (mergedOptions.mode && mergedOptions.mode.length > 0) {
      // Use fuzzy search for mode matching
      const search = new ModeSearch(modes);
      const matchedModes: Mode[] = [];

      for (const modeName of mergedOptions.mode) {
        const results = search.search(modeName);
        const exactMatch = results.find(
          (r) =>
            r.item.name.toLowerCase() === modeName.toLowerCase() ||
            getModeDisplayName(r.item).toLowerCase() === modeName.toLowerCase(),
        );

        if (exactMatch) {
          matchedModes.push(exactMatch.item);
        } else if (results.length > 0 && results[0].score! < 0.3) {
          // Good fuzzy match
          matchedModes.push(results[0].item);
        }
      }

      selectedModes = matchedModes;

      if (selectedModes.length === 0) {
        if (jsonOutput) {
          console.log(formatError(`No matching modes found for: ${mergedOptions.mode.join(", ")}`, version));
        } else {
          p.log.error(`No matching modes found for: ${mergedOptions.mode.join(", ")}`);
          p.log.info("Available modes:");
          for (const m of modes.slice(0, 10)) {
            p.log.message(`  - ${getModeDisplayName(m)}`);
          }
          if (modes.length > 10) {
            p.log.message(colors.dim(`  ... and ${modes.length - 10} more`));
          }
        }
        process.exit(1);
      }

      if (!jsonOutput) {
        p.log.info(
          `Selected ${selectedModes.length} mode${selectedModes.length !== 1 ? "s" : ""}: ${selectedModes.map((m) => colors.secondary(getModeDisplayName(m))).join(", ")}`,
        );
      }
    } else if (mergedOptions.yes) {
      selectedModes = modes;
      if (!jsonOutput) {
        p.log.info(`Installing all ${modes.length} modes`);
      }
    } else {
      const modeChoices = modes.map((m) => ({
        value: m,
        label: getModeDisplayName(m),
        hint: m.description.length > 60 ? m.description.slice(0, 57) + "..." : m.description,
      }));

      const selected = await p.multiselect({
        message: "Select modes to install",
        options: modeChoices,
        required: true,
      });

      if (p.isCancel(selected)) {
        p.cancel("Installation cancelled");
        process.exit(0);
      }

      selectedModes = selected as Mode[];
    }

    let targetAgents: AgentType[];

    if (mergedOptions.agent && mergedOptions.agent.length > 0) {
      const validAgents = ["opencode", "claude-code", "codex", "cursor"];
      const invalidAgents = mergedOptions.agent.filter((a) => !validAgents.includes(a));

      if (invalidAgents.length > 0) {
        if (jsonOutput) {
          console.log(formatError(`Invalid agents: ${invalidAgents.join(", ")}`, version));
        } else {
          p.log.error(`Invalid agents: ${invalidAgents.join(", ")}`);
          p.log.info(`Valid agents: ${validAgents.join(", ")}`);
        }
        process.exit(1);
      }

      targetAgents = mergedOptions.agent as AgentType[];
    } else {
      spinner?.start("Detecting installed agents...");
      const installedAgents = await detectInstalledAgents();
      spinner?.stop(`Detected ${installedAgents.length} agent${installedAgents.length !== 1 ? "s" : ""}`);

      if (installedAgents.length === 0) {
        if (mergedOptions.yes) {
          targetAgents = ["opencode", "claude-code", "codex", "cursor"];
          if (!jsonOutput) {
            p.log.info("Installing to all agents (none detected)");
          }
        } else {
          p.log.warn("No coding agents detected. You can still install modes.");

          const allAgentChoices = Object.entries(agents).map(([key, agentConfig]) => ({
            value: key as AgentType,
            label: agentConfig.displayName,
          }));

          const selected = await p.multiselect({
            message: "Select agents to install modes to",
            options: allAgentChoices,
            required: true,
          });

          if (p.isCancel(selected)) {
            p.cancel("Installation cancelled");
            process.exit(0);
          }

          targetAgents = selected as AgentType[];
        }
      } else if (installedAgents.length === 1 || mergedOptions.yes) {
        targetAgents = installedAgents;
        if (!jsonOutput) {
          if (installedAgents.length === 1) {
            const firstAgent = installedAgents[0];
            p.log.info(`Installing to: ${colors.secondary(agents[firstAgent].displayName)}`);
          } else {
            p.log.info(`Installing to: ${installedAgents.map((a) => colors.secondary(agents[a].displayName)).join(", ")}`);
          }
        }
      } else {
        const agentChoices = installedAgents.map((a) => ({
          value: a,
          label: agents[a].displayName,
          hint: `${mergedOptions.global ? agents[a].globalSkillsDir : agents[a].skillsDir}`,
        }));

        const selected = await p.multiselect({
          message: "Select agents to install modes to",
          options: agentChoices,
          required: true,
          initialValues: installedAgents,
        });

        if (p.isCancel(selected)) {
          p.cancel("Installation cancelled");
          process.exit(0);
        }

        targetAgents = selected as AgentType[];
      }
    }

    let installGlobally = mergedOptions.global ?? false;

    if (mergedOptions.global === undefined && !mergedOptions.yes && !jsonOutput) {
      const scope = await p.select({
        message: "Installation scope",
        options: [
          { value: false, label: "Project", hint: "Install in current directory (committed with your project)" },
          { value: true, label: "Global", hint: "Install in home directory (available across all projects)" },
        ],
      });

      if (p.isCancel(scope)) {
        p.cancel("Installation cancelled");
        process.exit(0);
      }

      installGlobally = scope as boolean;
    }

    if (!jsonOutput) {
      console.log();
      p.log.step(colors.primaryBold("Installation Summary"));

      for (const mode of selectedModes) {
        p.log.message(`  ${colors.secondary(getModeDisplayName(mode))}`);
        for (const agent of targetAgents) {
          const path = getInstallPath(mode.name, agent, { global: installGlobally });
          const installed = await isModeInstalled(mode.name, agent, { global: installGlobally });
          const status = installed ? colors.warning(" (will overwrite)") : "";
          p.log.message(`    ${colors.dim(symbols.arrow)} ${agents[agent].displayName}: ${colors.dim(path)}${status}`);
        }
      }
      console.log();
    }

    if (!mergedOptions.yes && !jsonOutput) {
      const confirmed = await p.confirm({ message: "Proceed with installation?" });

      if (p.isCancel(confirmed) || !confirmed) {
        p.cancel("Installation cancelled");
        process.exit(0);
      }
    }

    // Use parallel installation
    const tasks = createInstallTasks(selectedModes, targetAgents);
    const parallelism = getConfigParallelism(config);

    if (!jsonOutput) {
      spinner?.start("Installing modes...");
    }

    const startTime = Date.now();
    let lastProgress = 0;

    const results = await installModesParallel(
      tasks,
      { global: installGlobally, concurrency: parallelism },
      jsonOutput
        ? undefined
        : (progress) => {
            if (progress.completed > lastProgress) {
              lastProgress = progress.completed;
              const bar = renderProgressBar({
                total: progress.total,
                current: progress.completed,
                width: 25,
              });
              spinner?.message(`${bar} ${progress.current ? colors.dim(`Installing ${progress.current.mode.name}...`) : ""}`);
            }
          },
    );

    const duration = Date.now() - startTime;

    if (!jsonOutput) {
      spinner?.stop("Installation complete");
    }

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (jsonOutput) {
      console.log(formatInstallResultsAsJson(results, version));
    } else {
      console.log();
      console.log(renderInstallResultCard(results));
      console.log();
      console.log(colors.dim(`Completed in ${(duration / 1000).toFixed(1)}s`));
      console.log();
      p.outro(failed.length === 0 ? colors.success("Done!") : colors.warning("Completed with errors"));
    }

    process.exit(failed.length > 0 ? 1 : 0);
  } catch (error) {
    if (jsonOutput) {
      console.log(formatError(error instanceof Error ? error : "Unknown error occurred", version));
    } else {
      p.log.error(error instanceof Error ? error.message : "Unknown error occurred");
      p.outro(chalk.red("Installation failed"));
    }
    process.exit(1);
  }
}

function listModesByCategory(modes: Mode[]): void {
  const categories = buildCategoryTree(modes);

  for (const category of categories) {
    p.log.message(colors.primaryBold(`${category.name} (${category.count})`));
    for (const mode of category.modes.slice(0, 5)) {
      p.log.message(`  ${colors.secondary(getModeDisplayName(mode))}`);
      p.log.message(`    ${colors.dim(mode.description)}`);
    }
    if (category.modes.length > 5) {
      p.log.message(colors.dim(`  ... and ${category.modes.length - 5} more`));
    }
    console.log();
  }
}
