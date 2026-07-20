import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildModelInvocation } from "../src/models/invocation.js";
import {
  loadModelProfileState,
  removeModelProfile,
  saveModelProfile,
  setDefaultModelProfile,
  validateModelProfileState,
} from "../src/models/profiles.js";
import { getModelTargetStatus } from "../src/models/targets.js";
import { parseModelTarget } from "../src/models/types.js";
import { validateModelProfile } from "../src/models/validation.js";

test("normalizes supported target aliases", () => {
  assert.equal(parseModelTarget("codex"), "codex");
  assert.equal(parseModelTarget("claude-code"), "claude");
  assert.equal(parseModelTarget("gemini-cli"), "gemini");
  assert.throws(() => parseModelTarget("cursor"), /Unsupported model target/);
});

test("validates target-specific profile fields", () => {
  assert.deepEqual(validateModelProfile({ target: "gemini", model: "auto", approvalMode: "plan", sandbox: "on" }), []);
  assert.match(validateModelProfile({ target: "gemini", effort: "high" })[0], /does not support effort/);
  assert.match(validateModelProfile({ target: "claude", nativeProfile: "work" })[0], /only supported by Codex/);
  assert.match(validateModelProfile({ target: "codex", effort: "ultra" })[0], /does not support effort/);
  assert.match(validateModelProfile({ target: "claude", effort: "auto" })[0], /does not support effort/);
  assert.deepEqual(validateModelProfile({ target: "claude", effort: "max" }), []);
  assert.match(
    validateModelProfile({ target: "claude", extraArgs: ["--api-key=do-not-store"] })[0],
    /secret-bearing flags/,
  );
});

test("builds native invocations without a shell", () => {
  assert.deepEqual(
    buildModelInvocation(
      {
        target: "codex",
        model: "gpt-5.6-sol",
        effort: "high",
        approvalMode: "on-request",
        sandbox: "workspace-write",
      },
      "review this repo",
      true,
    ),
    {
      target: "codex",
      command: "codex",
      args: [
        "--model",
        "gpt-5.6-sol",
        "--config",
        'model_reasoning_effort="high"',
        "--ask-for-approval",
        "on-request",
        "--sandbox",
        "workspace-write",
        "exec",
        "review this repo",
      ],
    },
  );
  assert.deepEqual(buildModelInvocation({ target: "claude", model: "opus", effort: "xhigh" }, "plan", true).args, [
    "--model",
    "opus",
    "--effort",
    "xhigh",
    "--print",
    "--output-format",
    "text",
    "plan",
  ]);
  assert.deepEqual(
    buildModelInvocation({ target: "gemini", model: "auto", approvalMode: "plan" }, "inspect", true).args,
    ["--approval-mode", "plan", "--prompt", "inspect"],
  );
});

test("persists, selects, and removes model profiles", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "vibe-model-profile-"));
  try {
    await saveModelProfile("deep", { target: "claude", model: "opus", effort: "high" }, cwd);
    await setDefaultModelProfile("deep", cwd);
    let state = await loadModelProfileState(cwd);
    assert.equal(state.defaultProfile, "deep");
    assert.equal(state.profiles.deep.model, "opus");
    const yaml = await readFile(join(cwd, ".vibeconfig.yaml"), "utf8");
    assert.match(yaml, /modelProfiles:/);
    assert.doesNotMatch(yaml, /apiKey|token|secret/i);

    await removeModelProfile("deep", cwd);
    state = await loadModelProfileState(cwd);
    assert.equal(state.defaultProfile, undefined);
    assert.deepEqual(state.profiles, {});
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("reports malformed YAML during configuration validation", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "vibe-invalid-config-"));
  try {
    await writeFile(join(cwd, ".vibeconfig.yaml"), "modelProfiles: [\n", "utf8");
    const result = await validateModelProfileState(cwd);
    assert.equal(result.errors.length, 1);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("rejects invalid profiles at the configuration boundary", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "vibe-invalid-profile-config-"));
  const originalWarn = console.warn;
  const warnings: string[] = [];
  console.warn = (...values: unknown[]) => warnings.push(values.map(String).join(" "));
  try {
    await writeFile(
      join(cwd, ".vibeconfig.yaml"),
      "modelProfiles:\n  default: broken\n  profiles:\n    broken:\n      target: codex\n      effort: ultra\n",
      "utf8",
    );
    const state = await loadModelProfileState(cwd);
    assert.deepEqual(state.profiles, {});
    assert.match(warnings.join("\n"), /Invalid model profiles/);

    const result = await validateModelProfileState(cwd);
    assert.match(result.errors.join("\n"), /does not support effort/);
  } finally {
    console.warn = originalWarn;
    await rm(cwd, { recursive: true, force: true });
  }
});

test("skips malformed native model configuration files", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "vibe-malformed-native-config-"));
  try {
    await mkdir(join(cwd, ".codex"));
    await writeFile(join(cwd, ".codex", "config.toml"), 'model = "unterminated\n', "utf8");
    await mkdir(join(cwd, ".claude"));
    await writeFile(join(cwd, ".claude", "settings.json"), "{", "utf8");
    await mkdir(join(cwd, ".gemini"));
    await writeFile(join(cwd, ".gemini", "settings.json"), "{", "utf8");

    await assert.doesNotReject(() => getModelTargetStatus("codex", {}, cwd));
    await assert.doesNotReject(() => getModelTargetStatus("claude", {}, cwd));
    await assert.doesNotReject(() => getModelTargetStatus("gemini", {}, cwd));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("project model configuration overrides user-level discovery", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "vibe-model-precedence-"));
  try {
    await mkdir(join(cwd, ".codex"));
    await writeFile(join(cwd, ".codex", "config.toml"), 'model = "project-codex"\n', "utf8");
    const codex = await getModelTargetStatus("codex", {}, cwd);
    assert.equal(codex.activeModel, "project-codex");

    await mkdir(join(cwd, ".claude"));
    await writeFile(join(cwd, ".claude", "settings.json"), '{"model":"project-claude"}', "utf8");
    await writeFile(join(cwd, ".claude", "settings.local.json"), '{"model":"local-claude"}', "utf8");
    const claude = await getModelTargetStatus("claude", {}, cwd);
    assert.equal(claude.activeModel, "local-claude");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
