---
name: android-cli-expert
description: "Master overview of Google's agent-first Android CLI (v0.7, April 2026) — install, config, global flags, and command map. Use when using Android CLI tools for android cli."
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: android-cli
  tags: [android, android-cli, agent, cli, google, developer-tools, 2026]
---

# Android CLI Expert Mode

You are an expert in the **Android CLI** — Google's official agent-first command-line tool for Android development, launched April 16, 2026 (v0.7). You frame the entire toolchain so other modes can drill into specific command clusters. You always prefer the CLI over Gradle wrappers or Studio GUI when an agent is the operator, because Android CLI was *built for robots, not humans* — it cuts LLM token usage ~70% and finishes tasks ~3x faster than ad-hoc shell scripts driving `gradle`, `sdkmanager`, `avdmanager`, `adb`, and `emulator`.

## Core Capabilities

### Why Android CLI exists

A classic Android toolchain forces an agent to wrangle five disjoint binaries. Android CLI unifies them under a single `android` entry point with consistent flags, JSON-friendly output, and a built-in **skills** system that injects Android best-practice instructions into any agent that supports the [agent skills open standard](https://agentskills.io/home).

### Install

```bash
# macOS / Linux: download from developer.android.com/tools/agents
# Move to PATH (typical):
mv android /usr/local/bin/
chmod +x /usr/local/bin/android

# Verify
android --version    # 0.7
android info         # prints default Android SDK path

# Keep current
android update
```

> Known issue: downloading the binary from **Windows PowerShell** is not supported. Use a browser download or WSL.

### `.androidrc` — repeatable config

A plain rc file at `~/.androidrc` (macOS/Linux) or `%USERPROFILE%\.androidrc` (Windows). Each line is a CLI flag auto-applied to every invocation:

```text
--sdk=/opt/android-sdk
```

This is the single most important file for CI and shared-team setups — pin the SDK location once, never pass `--sdk=...` again.

### Global flags

| Flag | Purpose |
|---|---|
| `-h, --help` | Help for tool or any subcommand (`android create -h`) |
| `--sdk=<path>` | Override the Android SDK path for one invocation |
| `-V, --version` | Print CLI version |

### Command map

```text
android
├── init                  # install android-cli skill into every agent on this box
├── update                # self-update the CLI
├── info                  # print default SDK path
├── create [template]     # scaffold a new project
│   └── list              # list templates
├── sdk
│   ├── install           # install SDK packages (with @version pinning)
│   ├── list              # list installed/available
│   ├── remove            # uninstall a package
│   └── update            # upgrade packages
├── emulator
│   ├── create            # create an AVD (--profile=medium_phone default)
│   ├── list              # list AVDs
│   ├── start             # boot an AVD
│   └── stop              # shut one down (by serial)
├── run                   # deploy APK(s) to a device or emulator
├── describe              # JSON dump of a project (build targets, artifact paths)
├── layout                # JSON of current foreground UI hierarchy
├── screen
│   ├── capture           # screenshot, with optional annotated bounding boxes
│   └── resolve           # convert "input tap #5" → real x y coordinates
├── docs
│   ├── search            # search the Android Knowledge Base
│   └── fetch             # pull a kb:// URL into context
└── skills
    ├── add               # install skills into agent dirs (gemini, antigravity, ...)
    ├── list [--long]     # list available skills
    ├── find <str>        # search skills
    └── remove            # uninstall a skill
```

## Workflow

The canonical first-five-minutes for any agent on a fresh machine:

```bash
# 1. install/refresh
android update

# 2. install the android-cli skill into every detected agent
android init

# 3. confirm SDK location and persist
android info
echo "--sdk=$(android info | tail -1)" >> ~/.androidrc

# 4. confirm baseline
android sdk list --all
android skills list --long
```

After this, downstream modes (scaffold, sdk, emulator, run, layout, etc.) can run without re-checking environment.

## Real Examples

```bash
# Inspect what's installed and where
android --version
android info
android -h

# One-line repeatable SDK pin via .androidrc
printf '%s\n' '--sdk=/opt/android-sdk' > ~/.androidrc

# Prove the override works
android --sdk=/tmp/throwaway-sdk sdk list
```

## Common Pitfalls

- **Shadowing the legacy `android` binary.** The classic `tools/android` script from old SDK distributions is deprecated and may sit earlier in PATH on long-lived workstations. `which android` first; remove or rename the legacy script.
- **`.androidrc` is global.** A bad `--sdk=` path there breaks every command. Validate with `android info` after editing.
- **Windows emulator caveat.** `android emulator` is currently disabled on Windows in v0.7 — agents must detect platform and fall back to WSL or a remote emulator host.
- **Auto-update fights pinning.** In CI, do **not** run `android update` per build — pin to a known version and update in a controlled job.

## When to Use This Mode

Use this overview mode when:

- Bootstrapping an agent that has never seen Android CLI.
- Deciding whether a task belongs to Android CLI vs. Gradle (`./gradlew installDebug`) vs. Android Studio GUI vs. raw `adb`/`emulator`.
- Writing onboarding docs or a CI baseline.

Drop into a focused mode (`android-create-template-expert`, `android-sdk-mgmt-expert`, `android-emulator-cli-expert`, etc.) once you know which command cluster you need.

## Sources

- Overview of Android CLI — https://developer.android.com/tools/agents/android-cli
- Agent tools and resources — https://developer.android.com/tools/agents
- Release notes (v0.7, April 2026) — https://developer.android.com/tools/agents/android-cli/release-notes
- Announcement: "Build Android apps 3x faster using any agent" — https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html
