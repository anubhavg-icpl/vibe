import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const CLI = resolve("dist/index.js");

function run(cwd: string, args: string[]) {
  const result = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

test("model CLI commands work together in an isolated project", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "vibe-model-cli-"));
  try {
    const targets = JSON.parse(run(cwd, ["models", "--json"]));
    assert.equal(targets.targets.length, 3);

    run(cwd, [
      "profile",
      "set",
      "codex-deep",
      "-t",
      "codex",
      "-m",
      "gpt-5.6-sol",
      "--effort",
      "high",
      "--sandbox",
      "workspace-write",
      "--default",
    ]);
    run(cwd, [
      "profile",
      "set",
      "claude-plan",
      "-t",
      "claude",
      "-m",
      "opus",
      "--effort",
      "high",
      "--approval-mode",
      "plan",
    ]);
    run(cwd, [
      "profile",
      "set",
      "gemini-plan",
      "-t",
      "gemini",
      "-m",
      "auto",
      "--approval-mode",
      "plan",
      "--sandbox",
      "on",
    ]);

    const validation = JSON.parse(run(cwd, ["config", "validate", "--json"]));
    assert.equal(validation.valid, true);

    for (const name of ["codex-deep", "claude-plan", "gemini-plan"]) {
      const invocation = JSON.parse(
        run(cwd, ["run", "--profile", name, "--dry-run", "--json", "review this repository"]),
      );
      assert.ok(["codex", "claude", "gemini"].includes(invocation.target));
      assert.ok(invocation.args.includes("review this repository"));
    }
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("run defaults to Codex when no profile is configured", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "vibe-model-cli-default-"));
  try {
    const invocation = JSON.parse(run(cwd, ["run", "--dry-run", "--json", "explain this repository"]));
    assert.equal(invocation.target, "codex");
    assert.equal(invocation.command, "codex");
    assert.deepEqual(invocation.args, ["explain this repository"]);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
