import type { Command } from "commander";
import { guardedAction } from "./command-helpers.js";
import { buildModelInvocation, runModelInvocation } from "./invocation.js";
import { loadModelProfileState } from "./profiles.js";
import { parseModelTarget, type ModelProfile } from "./types.js";
import { validateModelProfile } from "./validation.js";

interface RunOptions {
  profile?: string;
  target?: string;
  model?: string;
  effort?: string;
  approvalMode?: string;
  sandbox?: string;
  nativeProfile?: string;
  arg?: string[];
  print?: boolean;
  dryRun?: boolean;
  json?: boolean;
}

function mergeRunProfile(base: ModelProfile | undefined, opts: RunOptions): ModelProfile {
  const target = opts.target ? parseModelTarget(opts.target) : (base?.target ?? "codex");
  const inherited = base?.target === target ? base : undefined;
  const profile: ModelProfile = {
    ...inherited,
    target,
    model: opts.model ?? inherited?.model,
    effort: opts.effort ?? inherited?.effort,
    approvalMode: opts.approvalMode ?? inherited?.approvalMode,
    sandbox: opts.sandbox ?? inherited?.sandbox,
    nativeProfile: opts.nativeProfile ?? inherited?.nativeProfile,
    extraArgs: opts.arg ?? inherited?.extraArgs,
  };
  const errors = validateModelProfile(profile);
  if (errors.length > 0) throw new Error(errors.join("\n"));
  return profile;
}

export function registerRunCommand(program: Command): void {
  program
    .command("run [prompt...]")
    .description("Run Codex, Claude Code, or Gemini CLI through a Vibe model profile")
    .option("-p, --profile <name>", "Vibe model profile (defaults to the active profile)")
    .option("-t, --target <target>", "codex | claude | gemini")
    .option("-m, --model <model>", "Override the profile model")
    .option("--effort <level>", "Override reasoning/effort")
    .option("--approval-mode <mode>", "Override the native approval mode")
    .option("--sandbox <mode>", "Override the native sandbox mode")
    .option("--native-profile <name>", "Codex config profile selected with --profile")
    .option("--arg <args...>", "Additional native CLI arguments; never include secrets")
    .option("--print", "Run non-interactively and print the response")
    .option("--dry-run", "Print the native invocation without launching it")
    .option("--json", "JSON output for --dry-run")
    .action(async (promptParts: string[], opts: RunOptions) =>
      guardedAction(async () => {
        const json = opts.json ?? program.opts().json;
        const dryRun = opts.dryRun ?? program.opts().dryRun;
        const state = await loadModelProfileState();
        const profileName = opts.profile ?? state.defaultProfile;
        const base = profileName ? state.profiles[profileName] : undefined;
        if (profileName && !base) throw new Error(`Model profile not found: ${profileName}`);
        const profile = mergeRunProfile(base, opts);
        const prompt = promptParts.length > 0 ? promptParts.join(" ") : undefined;
        const invocation = buildModelInvocation(profile, prompt, opts.print);

        if (dryRun) {
          if (json) console.log(JSON.stringify({ profile: profileName, ...invocation }, null, 2));
          else {
            console.log([invocation.command, ...invocation.args].map((value) => JSON.stringify(value)).join(" "));
          }
          return;
        }
        process.exitCode = await runModelInvocation(invocation);
      }),
    );

  program
    .command("exec <target> [args...]")
    .description("Pass native arguments directly to Codex, Claude Code, or Gemini CLI")
    .allowUnknownOption(true)
    .passThroughOptions()
    .action(async (targetValue: string, args: string[]) =>
      guardedAction(async () => {
        const target = parseModelTarget(targetValue);
        const base = buildModelInvocation({ target });
        process.exitCode = await runModelInvocation({ ...base, args });
      }),
    );
}
