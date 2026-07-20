import type { Command } from "commander";
import { colors, symbols } from "../ui/index.js";
import { loadModelProfileState, removeModelProfile, saveModelProfile, setDefaultModelProfile } from "./profiles.js";
import { parseModelTarget, type ModelProfile } from "./types.js";

interface ProfileOptions {
  target: string;
  description?: string;
  model?: string;
  effort?: string;
  approvalMode?: string;
  sandbox?: string;
  nativeProfile?: string;
  arg?: string[];
  default?: boolean;
}

async function runProfileAction(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    console.error(colors.error(error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}

export function registerProfileCommand(program: Command): void {
  const profile = program.command("profile").description("Manage reusable model profiles");

  profile
    .command("list")
    .description("List configured model profiles")
    .option("--json", "JSON output")
    .action(async (opts: { json?: boolean }) => {
      const json = opts.json ?? program.opts().json;
      const state = await loadModelProfileState();
      if (json) {
        console.log(JSON.stringify({ default: state.defaultProfile, profiles: state.profiles }, null, 2));
        return;
      }
      console.log();
      console.log(colors.primaryBold("Model profiles"));
      const entries = Object.entries(state.profiles);
      if (entries.length === 0) console.log(colors.muted("  No profiles configured."));
      for (const [name, value] of entries) {
        const mark = state.defaultProfile === name ? colors.success(symbols.star) : " ";
        console.log(
          `  ${mark} ${colors.secondaryBold(name)} ${colors.dim(`(${value.target})`)} ${value.model ?? "default"}`,
        );
      }
      console.log(colors.dim(`\nConfig: ${state.configPath}`));
      console.log();
    });

  profile
    .command("show <name>")
    .description("Show one model profile")
    .option("--json", "JSON output")
    .action(async (name: string, opts: { json?: boolean }) =>
      runProfileAction(async () => {
        const json = opts.json ?? program.opts().json;
        const state = await loadModelProfileState();
        const value = state.profiles[name];
        if (!value) throw new Error(`Model profile not found: ${name}`);
        if (json) console.log(JSON.stringify({ name, default: state.defaultProfile === name, ...value }, null, 2));
        else console.log(`\n${colors.secondaryBold(name)}\n${JSON.stringify(value, null, 2)}\n`);
      }),
    );

  profile
    .command("set <name>")
    .description("Create or replace a model profile")
    .requiredOption("-t, --target <target>", "codex | claude | gemini")
    .option("-m, --model <model>", "Model ID or alias")
    .option("--description <text>", "Profile description")
    .option("--effort <level>", "Reasoning/effort level")
    .option("--approval-mode <mode>", "Native target approval mode")
    .option("--sandbox <mode>", "Native target sandbox mode")
    .option("--native-profile <name>", "Codex config profile selected with --profile")
    .option("--arg <args...>", "Additional native CLI arguments")
    .option("--default", "Make this the default model profile")
    .action(async (name: string, opts: ProfileOptions) =>
      runProfileAction(async () => {
        const value: ModelProfile = {
          target: parseModelTarget(opts.target),
          description: opts.description,
          model: opts.model,
          effort: opts.effort,
          approvalMode: opts.approvalMode,
          sandbox: opts.sandbox,
          nativeProfile: opts.nativeProfile,
          extraArgs: opts.arg,
        };
        const state = await saveModelProfile(name, value);
        if (opts.default) await setDefaultModelProfile(name);
        console.log(colors.success(`${symbols.check} Saved ${name} to ${state.configPath}`));
      }),
    );

  profile
    .command("use <name>")
    .description("Set the default model profile")
    .action(async (name: string) =>
      runProfileAction(async () => {
        const state = await setDefaultModelProfile(name);
        console.log(colors.success(`${symbols.check} Default profile: ${name}`));
        console.log(colors.dim(state.configPath));
      }),
    );

  profile
    .command("remove <name>")
    .alias("rm")
    .description("Remove a model profile")
    .action(async (name: string) =>
      runProfileAction(async () => {
        const state = await removeModelProfile(name);
        console.log(colors.success(`${symbols.check} Removed ${name}`));
        console.log(colors.dim(state.configPath));
      }),
    );
}
