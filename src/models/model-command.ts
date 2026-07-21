import type { Command } from "commander";
import { colors, symbols } from "../ui/index.js";
import { guardedAction } from "./command-helpers.js";
import { loadModelProfileState } from "./profiles.js";
import { getModelTargetStatus } from "./targets.js";
import { MODEL_TARGETS, parseModelTarget } from "./types.js";

export function registerModelsCommand(program: Command, version: string): void {
  program
    .command("models [target]")
    .description("List models discovered for Codex, Claude Code, and Gemini CLI")
    .option("--json", "JSON output")
    .action(async (targetValue: string | undefined, opts: { json?: boolean }) =>
      guardedAction(async () => {
        const json = opts.json ?? program.opts().json;
        const state = await loadModelProfileState();
        const targets = targetValue ? [parseModelTarget(targetValue)] : [...MODEL_TARGETS];
        const statuses = await Promise.all(targets.map((target) => getModelTargetStatus(target, state.profiles)));

        if (json) {
          console.log(JSON.stringify({ version, targets: statuses }, null, 2));
          return;
        }

        console.log();
        console.log(colors.primaryBold("Model targets"));
        for (const status of statuses) {
          const mark = status.installed ? colors.success(symbols.check) : colors.dim(symbols.dot);
          console.log();
          console.log(`  ${mark} ${colors.secondaryBold(status.displayName)}`);
          console.log(`    ${colors.dim(status.executable ?? "CLI not found on PATH")}`);
          if (status.activeModel) {
            console.log(`    Active: ${colors.textBold(status.activeModel)}`);
          }
          if (status.provider) console.log(`    Provider: ${status.provider}`);
          if (status.configPaths.length > 0) {
            console.log(`    Config: ${status.configPaths.join(", ")}`);
          }
          for (const model of status.models) {
            const detail = model.detail ? ` · ${model.detail}` : "";
            console.log(`      ${symbols.bullet} ${model.id} ${colors.dim(`(${model.source}${detail})`)}`);
          }
        }
        console.log();
      }),
    );
}
