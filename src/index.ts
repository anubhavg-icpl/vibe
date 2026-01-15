#!/usr/bin/env node

import { program } from "commander";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { discoverModes, discoverModesByCategory, getModeDisplayName } from "./modes.js";
import { installModeForAgent, isModeInstalled, getInstallPath } from "./installer.js";
import { detectInstalledAgents, agents } from "./agents.js";
import type { Mode, AgentType } from "./types.js";

const version = "1.0.0";

interface Options {
  global?: boolean;
  agent?: string[];
  yes?: boolean;
  mode?: string[];
  category?: string;
  list?: boolean;
}

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
  .action(async (source: string = "./modes", options: Options) => {
    await main(source, options);
  });

program.parse();

async function main(source: string, options: Options) {
  console.log();
  p.intro(chalk.bgCyan.black(" vibe "));

  try {
    const spinner = p.spinner();

    spinner.start("Discovering modes...");
    const modes = options.category
      ? await discoverModesByCategory(source, options.category)
      : await discoverModes(source);

    if (modes.length === 0) {
      spinner.stop(chalk.red("No modes found"));
      p.outro(chalk.red("No valid modes found in the specified path."));
      process.exit(1);
    }

    spinner.stop(`Found ${chalk.green(modes.length)} mode${modes.length > 1 ? "s" : ""}`);

    if (options.list) {
      console.log();
      p.log.step(chalk.bold("Available Modes"));
      listModesByCategory(modes);
      console.log();
      p.outro("Use --mode <name> or --category <category> to install specific modes");
      process.exit(0);
    }

    let selectedModes: Mode[];

    if (options.mode && options.mode.length > 0) {
      selectedModes = modes.filter((m) =>
        options.mode!.some(
          (name) =>
            m.name.toLowerCase() === name.toLowerCase() || getModeDisplayName(m).toLowerCase() === name.toLowerCase(),
        ),
      );

      if (selectedModes.length === 0) {
        p.log.error(`No matching modes found for: ${options.mode.join(", ")}`);
        p.log.info("Available modes:");
        for (const m of modes) {
          p.log.message(`  - ${getModeDisplayName(m)}`);
        }
        process.exit(1);
      }

      p.log.info(
        `Selected ${selectedModes.length} mode${selectedModes.length !== 1 ? "s" : ""}: ${selectedModes.map((m) => chalk.cyan(getModeDisplayName(m))).join(", ")}`,
      );
    } else if (options.yes) {
      selectedModes = modes;
      p.log.info(`Installing all ${modes.length} modes`);
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

    if (options.agent && options.agent.length > 0) {
      const validAgents = ["opencode", "claude-code", "codex", "cursor"];
      const invalidAgents = options.agent.filter((a) => !validAgents.includes(a));

      if (invalidAgents.length > 0) {
        p.log.error(`Invalid agents: ${invalidAgents.join(", ")}`);
        p.log.info(`Valid agents: ${validAgents.join(", ")}`);
        process.exit(1);
      }

      targetAgents = options.agent as AgentType[];
    } else {
      spinner.start("Detecting installed agents...");
      const installedAgents = await detectInstalledAgents();
      spinner.stop(`Detected ${installedAgents.length} agent${installedAgents.length !== 1 ? "s" : ""}`);

      if (installedAgents.length === 0) {
        if (options.yes) {
          targetAgents = ["opencode", "claude-code", "codex", "cursor"];
          p.log.info("Installing to all agents (none detected)");
        } else {
          p.log.warn("No coding agents detected. You can still install modes.");

          const allAgentChoices = Object.entries(agents).map(([key, config]) => ({
            value: key as AgentType,
            label: config.displayName,
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
      } else if (installedAgents.length === 1 || options.yes) {
        targetAgents = installedAgents;
        if (installedAgents.length === 1) {
          const firstAgent = installedAgents[0];
          p.log.info(`Installing to: ${chalk.cyan(agents[firstAgent].displayName)}`);
        } else {
          p.log.info(`Installing to: ${installedAgents.map((a) => chalk.cyan(agents[a].displayName)).join(", ")}`);
        }
      } else {
        const agentChoices = installedAgents.map((a) => ({
          value: a,
          label: agents[a].displayName,
          hint: `${options.global ? agents[a].globalSkillsDir : agents[a].skillsDir}`,
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

    let installGlobally = options.global ?? false;

    if (options.global === undefined && !options.yes) {
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

    console.log();
    p.log.step(chalk.bold("Installation Summary"));

    for (const mode of selectedModes) {
      p.log.message(`  ${chalk.cyan(getModeDisplayName(mode))}`);
      for (const agent of targetAgents) {
        const path = getInstallPath(mode.name, agent, { global: installGlobally });
        const installed = await isModeInstalled(mode.name, agent, { global: installGlobally });
        const status = installed ? chalk.yellow(" (will overwrite)") : "";
        p.log.message(`    ${chalk.dim("→")} ${agents[agent].displayName}: ${chalk.dim(path)}${status}`);
      }
    }
    console.log();

    if (!options.yes) {
      const confirmed = await p.confirm({ message: "Proceed with installation?" });

      if (p.isCancel(confirmed) || !confirmed) {
        p.cancel("Installation cancelled");
        process.exit(0);
      }
    }

    spinner.start("Installing modes...");

    const results: { mode: string; agent: string; success: boolean; path: string; error?: string }[] = [];

    for (const mode of selectedModes) {
      for (const agent of targetAgents) {
        const result = await installModeForAgent(mode, agent, { global: installGlobally });
        results.push({
          mode: getModeDisplayName(mode),
          agent: agents[agent].displayName,
          ...result,
        });
      }
    }

    spinner.stop("Installation complete");

    console.log();
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (successful.length > 0) {
      p.log.success(
        chalk.green(`Successfully installed ${successful.length} mode${successful.length !== 1 ? "s" : ""}`),
      );
      for (const r of successful) {
        p.log.message(`  ${chalk.green("✓")} ${r.mode} → ${r.agent}`);
        p.log.message(`    ${chalk.dim(r.path)}`);
      }
    }

    if (failed.length > 0) {
      console.log();
      p.log.error(chalk.red(`Failed to install ${failed.length} mode${failed.length !== 1 ? "s" : ""}`));
      for (const r of failed) {
        p.log.message(`  ${chalk.red("✗")} ${r.mode} → ${r.agent}`);
        p.log.message(`    ${chalk.dim(r.error)}`);
      }
    }

    console.log();
    p.outro(chalk.green("Done!"));
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Unknown error occurred");
    p.outro(chalk.red("Installation failed"));
    process.exit(1);
  }
}

function listModesByCategory(modes: Mode[]): void {
  const categories = new Map<string, Mode[]>();

  for (const mode of modes) {
    if (!categories.has(mode.category)) {
      categories.set(mode.category, []);
    }
    categories.get(mode.category)!.push(mode);
  }

  const sortedCategories = Array.from(categories.entries()).sort((a, b) => b[1].length - a[1].length);

  for (const [category, categoryModes] of sortedCategories) {
    p.log.message(chalk.bold(`${category} (${categoryModes.length})`));
    for (const mode of categoryModes.sort((a, b) => a.name.localeCompare(b.name))) {
      p.log.message(`  ${chalk.cyan(getModeDisplayName(mode))}`);
      p.log.message(`    ${chalk.dim(mode.description)}`);
    }
    if (category !== sortedCategories[sortedCategories.length - 1][0]) {
      console.log();
    }
  }
}
