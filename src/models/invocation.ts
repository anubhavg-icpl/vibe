import { spawn } from "child_process";
import type { ModelInvocation, ModelProfile } from "./types.js";
import { executableExtension, findExecutable } from "./targets.js";

function codexArgs(profile: ModelProfile, prompt?: string, print = false): string[] {
  const args: string[] = [];
  if (profile.nativeProfile) args.push("--profile", profile.nativeProfile);
  if (profile.model && profile.model !== "default") args.push("--model", profile.model);
  if (profile.effort) args.push("--config", `model_reasoning_effort=${JSON.stringify(profile.effort)}`);
  if (profile.approvalMode) args.push("--ask-for-approval", profile.approvalMode);
  if (profile.sandbox) args.push("--sandbox", profile.sandbox);
  args.push(...(profile.extraArgs ?? []));
  if (print) args.push("exec");
  if (prompt) args.push(prompt);
  return args;
}

function claudeArgs(profile: ModelProfile, prompt?: string, print = false): string[] {
  const args: string[] = [];
  if (profile.model && profile.model !== "default") args.push("--model", profile.model);
  if (profile.effort) args.push("--effort", profile.effort);
  if (profile.approvalMode) args.push("--permission-mode", profile.approvalMode);
  if (print) args.push("--print", "--output-format", "text");
  args.push(...(profile.extraArgs ?? []));
  if (prompt) args.push(prompt);
  return args;
}

function geminiArgs(profile: ModelProfile, prompt?: string, print = false): string[] {
  const args: string[] = [];
  if (profile.model && profile.model !== "auto") args.push("--model", profile.model);
  if (profile.approvalMode) args.push("--approval-mode", profile.approvalMode);
  if (profile.sandbox === "on") args.push("--sandbox");
  args.push(...(profile.extraArgs ?? []));
  if (prompt) args.push(print ? "--prompt" : "--prompt-interactive", prompt);
  return args;
}

export function buildModelInvocation(profile: ModelProfile, prompt?: string, print = false): ModelInvocation {
  const command = profile.target === "codex" ? "codex" : profile.target === "claude" ? "claude" : "gemini";
  const args =
    profile.target === "codex"
      ? codexArgs(profile, prompt, print)
      : profile.target === "claude"
        ? claudeArgs(profile, prompt, print)
        : geminiArgs(profile, prompt, print);
  return { target: profile.target, command, args };
}

export async function runModelInvocation(invocation: ModelInvocation): Promise<number> {
  const executable = findExecutable(invocation.command);
  if (!executable) throw new Error(`${invocation.command} is not installed or not on PATH.`);

  const extension = executableExtension(executable);
  const command = extension === ".ps1" ? "powershell.exe" : executable;
  const args =
    extension === ".ps1"
      ? ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", executable, ...invocation.args]
      : invocation.args;

  if ([".cmd", ".bat"].includes(extension)) {
    throw new Error(
      `Refusing to invoke the ${extension} shim directly. Install an executable or PowerShell shim for ${invocation.command}.`,
    );
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", windowsHide: false });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal) reject(new Error(`${invocation.command} exited via signal ${signal}.`));
      else resolve(code ?? 1);
    });
  });
}
