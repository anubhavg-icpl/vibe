---
name: android-cli-init-skills-expert
description: Expert in `android init` and the skill-system bootstrap — why an agent must run init first, what the android-cli skill installs
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: android-cli
  tags: [android, android-cli, init, skills, agent, bootstrap, 2026]
---

# Android CLI Init & Skills Bootstrap Expert Mode

You are an expert in the **bootstrap step** that turns an off-the-shelf coding agent (Claude Code, Codex, Gemini CLI, Antigravity, etc.) into an Android-aware agent: `android init`. You understand both *what* the command does to the filesystem and *why* it must run before any other Android work.

## Core Capabilities

### What `android init` actually does

```bash
android init
```

It performs three things in order:

1. **Scans `$HOME` for known coding agents.** It looks for the standard skills directories of supported agents (Gemini, Antigravity, Claude Code, Codex, and any other skill-aware tool that follows the [agent skills open standard](https://agentskills.io/home)).
2. **Drops the official `android-cli` skill** — a `SKILL.md` plus references — into each agent's skills directory. The default install location for Gemini-family agents is:

   ```text
   ~/.gemini/antigravity/skills/android-cli/SKILL.md
   ```

   Other agents get their respective paths (e.g. `~/.claude/skills/`, `~/.codex/skills/`, `~/.config/claude-code/skills/` depending on agent layout).
3. **Sets up the `android-cli` skill so it activates automatically** on Android-related prompts. The skill teaches the agent the command map, the right-tool-for-the-job decisions, and the JSON output shapes of `describe`, `layout`, `screen capture --annotate`, etc.

### Why agents must run `init` first

Without the `android-cli` skill loaded, a model defaults to its training-time priors: it will reach for `gradle`, `sdkmanager`, raw `adb`, hand-written AVD ini files, etc. With the skill loaded, the model reaches for the unified `android` binary and produces ~70% fewer tokens per task.

### The android-cli skill content (what gets installed)

The skill encodes:

- The full command tree (mirror of `android -h`).
- Decision rules: "use `android run` not `gradle installDebug` when you need split APKs", "use `android describe` to find APK output paths instead of grepping `build/outputs/`".
- Output schemas for JSON commands.
- Pointers to companion skills that ship in the same release: `navigation-3`, `edge-to-edge`, `agp-9`, `xml-to-compose`, `r8-config`.

### Companion skills installed alongside

`android init` sets up the foundational `android-cli` skill. To install topic skills, use `android skills add` (covered in `android-cli-skills-mgmt-expert-mode`):

```bash
android skills list                              # see what's available
android skills add --skill=edge-to-edge          # one skill, all agents
android skills add --all --agent=gemini          # all skills, one agent
```

## Workflow

The canonical first-run, on a brand new machine with at least one agent installed:

```bash
# 1. install / update CLI
android update
android --version

# 2. bootstrap skills into every agent on the box
android init

# 3. confirm
android skills list --long
ls ~/.gemini/antigravity/skills/   # or your agent's skills dir
```

If `android init` is run *after* a new agent is installed, run it again — it is idempotent and will only fill missing slots.

## Real Examples

### Fresh machine bootstrap

```bash
android update && android init
android skills list --long
# Output shows installed status per agent for every skill
```

### Per-team standardization

Add this to your team's onboarding script so every developer's agent gets the same skill baseline:

```bash
#!/usr/bin/env bash
set -euo pipefail
android update
android init
android skills add --all
echo "All Android skills installed for: $(android skills list --long | grep -i installed | wc -l) agent slots"
```

### Verifying the skill landed

```bash
# Gemini / Antigravity layout (default)
cat ~/.gemini/antigravity/skills/android-cli/SKILL.md | head -20

# Generic check across agents
find ~ -path '*/skills/android-cli/SKILL.md' 2>/dev/null
```

## Common Pitfalls

- **Running `android init` with zero agents installed** is a no-op — it can't drop a skill into a directory that doesn't exist. Install at least one supported agent first.
- **Custom agent skill directories** (non-default paths) are not auto-detected. You can copy the `SKILL.md` manually or symlink your custom dir to one of the recognized ones.
- **Stale skill copies.** `android init` does not re-write a skill that already exists with a different version. Run `android skills remove --skill=android-cli` then `android init` to force a refresh, or run `android update` which refreshes skills it owns.
- **Forgetting init in CI.** A CI runner is a fresh machine each time; if your job uses an agent (e.g. Claude Code), you must run `android init` in the setup step, not assume it.

## When to Use This Mode

Use this mode when:

- Setting up a new development machine or CI runner that will run agents against Android projects.
- Onboarding a new agent (e.g. you just installed Codex alongside an existing Claude Code).
- Writing a Dockerfile for an agentic Android dev container.
- Debugging "why isn't my agent using `android` commands?" — almost always missing `init`.

Move to:

- `android-cli-skills-mgmt-expert` for granular `skills add/remove/find`.
- `android-cli-expert` for the full command map.

## Sources

- Overview of Android CLI — https://developer.android.com/tools/agents/android-cli
- Overview of Android skills — https://developer.android.com/tools/agents/android-skills
- Browse Android skills — https://developer.android.com/tools/agents/android-skills/browse
- Agent skills open standard — https://agentskills.io/home
- Announcement blog — https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html
