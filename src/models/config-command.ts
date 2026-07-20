import type { Command } from "commander";
import { colors, symbols } from "../ui/index.js";
import { guardedAction } from "./command-helpers.js";
import { loadModelProfileState, validateModelProfileState } from "./profiles.js";

export function registerConfigCommand(program: Command): void {
  const config = program.command("config").description("Inspect and validate Vibe configuration");

  config
    .command("show")
    .description("Print the merged Vibe configuration")
    .option("--json", "JSON output")
    .action(async (opts: { json?: boolean }) =>
      guardedAction(async () => {
        const json = opts.json ?? program.opts().json;
        const state = await loadModelProfileState();
        const value = { path: state.configPath, config: state.config };
        console.log(
          json ? JSON.stringify(value, null, 2) : `\n${state.configPath}\n${JSON.stringify(state.config, null, 2)}\n`,
        );
      }),
    );

  config
    .command("path")
    .description("Print the active Vibe configuration path")
    .action(async () => guardedAction(async () => console.log((await loadModelProfileState()).configPath)));

  config
    .command("validate")
    .description("Validate model profiles and the default selection")
    .option("--json", "JSON output")
    .action(async (opts: { json?: boolean }) =>
      guardedAction(async () => {
        const json = opts.json ?? program.opts().json;
        const result = await validateModelProfileState();
        if (json) {
          console.log(JSON.stringify({ ...result, valid: result.errors.length === 0 }, null, 2));
        } else if (result.errors.length === 0) {
          console.log(colors.success(`${symbols.check} Valid configuration: ${result.path}`));
        } else {
          console.error(colors.error(`${symbols.cross} Invalid configuration: ${result.path}`));
          for (const error of result.errors) console.error(`  ${symbols.bullet} ${error}`);
        }
        if (result.errors.length > 0) process.exitCode = 1;
      }),
    );
}
