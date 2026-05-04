# Android CLI Modes

Vibe modes for Google's **Android CLI** — the agent-first command-line tool for Android development announced April 16, 2026 (v0.7). These modes cover the entire `android` command surface, from first-run bootstrap to end-to-end agent workflows, plus CI patterns.

> **Why a dedicated mode set?** Android CLI was built for agents (Claude Code, Codex, Gemini CLI, Antigravity, and any tool implementing the [agent skills open standard](https://agentskills.io/home)). Google measured ~70% LLM token reduction and ~3x task speedup vs. ad-hoc `gradle` / `sdkmanager` / `avdmanager` / `adb` orchestration. A focused mode per command cluster lets vibe-driven agents pick exactly the right pattern for the step they're on.

## Mode Index (13 modes)

### Overview

| Mode | What it covers |
|---|---|
| [`android-cli-expert-mode.md`](./android-cli-expert-mode.md) | Master overview: install, `.androidrc`, global flags, command map. **Start here.** |

### Bootstrap & Skills

| Mode | What it covers |
|---|---|
| [`android-cli-init-skills-expert-mode.md`](./android-cli-init-skills-expert-mode.md) | `android init` — installing the `android-cli` skill into every detected agent. |
| [`android-cli-skills-mgmt-expert-mode.md`](./android-cli-skills-mgmt-expert-mode.md) | `android skills add/list/find/remove` across Gemini, Antigravity, Claude Code, Codex. |

### Scaffolding

| Mode | What it covers |
|---|---|
| [`android-create-template-expert-mode.md`](./android-create-template-expert-mode.md) | `android create` — `empty-activity-agp-9` and other templates, `--dry-run`, `--output`, `--name`. |

### SDK Management

| Mode | What it covers |
|---|---|
| [`android-sdk-mgmt-expert-mode.md`](./android-sdk-mgmt-expert-mode.md) | `android sdk install/list/remove/update` — channels (`--beta`, `--canary`), `package@version` pinning, `--force` downgrades, reproducible team SDKs. |

### Emulator

| Mode | What it covers |
|---|---|
| [`android-emulator-cli-expert-mode.md`](./android-emulator-cli-expert-mode.md) | `android emulator create/list/start/stop` — profiles (`medium_phone`), pools, Windows caveat. |

### Deploy & Run

| Mode | What it covers |
|---|---|
| [`android-run-deploy-expert-mode.md`](./android-run-deploy-expert-mode.md) | `android run --apks=...` — multi-APK splits, `--device`, `--type` (ACTIVITY/WATCH_FACE/TILE/COMPLICATION/DECLARATIVE_WATCH_FACE). |

### Agent Tools (UI introspection / driving)

| Mode | What it covers |
|---|---|
| [`android-describe-expert-mode.md`](./android-describe-expert-mode.md) | `android describe` — JSON project structure, find APK paths post-build. |
| [`android-layout-inspect-expert-mode.md`](./android-layout-inspect-expert-mode.md) | `android layout` — JSON UI hierarchy, `--pretty`, `--output`, `--diff` snapshots. |
| [`android-screen-tools-expert-mode.md`](./android-screen-tools-expert-mode.md) | `android screen capture --annotate` + `android screen resolve` — vision-driven UI driving. |

### Knowledge Base

| Mode | What it covers |
|---|---|
| [`android-docs-kb-expert-mode.md`](./android-docs-kb-expert-mode.md) | `android docs search` + `android docs fetch kb://...` — Android Knowledge Base into agent context. |

### Automation & Workflows

| Mode | What it covers |
|---|---|
| [`android-cli-ci-automation-expert-mode.md`](./android-cli-ci-automation-expert-mode.md) | CI patterns: `.androidrc`, snapshotting SDK, headless emulator, GitHub Actions / GitLab CI / Bitrise. |
| [`android-agent-workflow-expert-mode.md`](./android-agent-workflow-expert-mode.md) | End-to-end recipes composing every cluster: scaffold-and-run, multi-device test, vision-driven login, doc-grounded code-gen. |

## Quick Start

A bare-minimum agent bootstrap (run in this order):

```bash
android update
android init
android skills add --all
android sdk install platforms/android-34 build-tools/34.0.0 platform-tools
android create --output=./MyApp
cd MyApp && ./gradlew :app:assembleDebug
android run --apks=app/build/outputs/apk/debug/app-debug.apk
```

For the full picture, read [`android-cli-expert-mode.md`](./android-cli-expert-mode.md) first, then [`android-agent-workflow-expert-mode.md`](./android-agent-workflow-expert-mode.md) for the orchestration patterns.

## Sources

All modes cite their authoritative sources individually. Primary references:

- [Overview of Android CLI](https://developer.android.com/tools/agents/android-cli)
- [Agent tools and resources](https://developer.android.com/tools/agents)
- [Overview of Android skills](https://developer.android.com/tools/agents/android-skills)
- [Browse Android skills](https://developer.android.com/tools/agents/android-skills/browse)
- [Android CLI release notes (v0.7)](https://developer.android.com/tools/agents/android-cli/release-notes)
- [Android skills GitHub repo](https://goo.gle/android-skills)
- [Agent skills open standard](https://agentskills.io/home)
- [Announcement: Build Android apps 3x faster using any agent](https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html)
