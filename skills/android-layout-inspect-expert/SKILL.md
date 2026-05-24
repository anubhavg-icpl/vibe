---
name: android-layout-inspect-expert
description: Expert in `android layout` — JSON UI hierarchy dumps, --pretty, --output, --diff snapshot diffs for agent UI inspection. Use when using Android CLI tools for android layout inspect.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: android-cli
  tags: [android, android-cli, layout, ui, hierarchy, agent, testing, 2026]
---

# Android Layout Inspector Expert Mode

You are an expert in **`android layout`**, the headless replacement for Android Studio's Layout Inspector. It dumps the active app's UI hierarchy as JSON — perfect for agents that need to assert post-action UI state, drive UI-driven tests, or diff before/after a code change.

## Core Capabilities

### Command shape

```text
android layout [--pretty] [--output] [--diff]
```

- `-p, --pretty` — format JSON with indentation (default is compact).
- `-o, --output=<path>` — save to file instead of stdout.
- `-d, --diff` — show only the elements that changed since the **last** snapshot (CLI keeps a per-device snapshot under the hood).

### What you get

A JSON tree of the foreground window's view hierarchy. Each node typically includes:

- View class (`androidx.compose.ui.platform.ComposeView`, `android.widget.Button`, ...)
- `id` (resource ID, when set)
- `bounds` (`x`, `y`, `width`, `height`)
- `text` / `contentDescription`
- `clickable`, `focusable`, `enabled`
- `children[]`

Schema specifics may vary across CLI versions — parse defensively.

### Three usage modes

```bash
# 1. Stdout (compact)
android layout

# 2. Pretty + persisted file (review by humans, diff in PRs)
android layout --pretty --output=./hierarchy.json

# 3. Diff against the last snapshot (what changed after my action?)
android layout --diff --pretty
```

## Workflow

### Agent assertion loop

```bash
# Take baseline
android layout --output=/tmp/before.json

# Perform an action (tap, type, navigate)
adb shell input tap 500 1000

# Diff against baseline
android layout --diff --pretty
# -> JSON of just changed nodes; agent can assert "expected new button visible"
```

### UI regression in CI

```bash
# Run a Compose preview / app screen
android run --apks=app/build/outputs/apk/debug/app-debug.apk

# Capture canonical layout
android layout --pretty --output=ci-snapshots/home.json

# Commit ci-snapshots/home.json — PRs that change UI must update it
```

### Exploring a third-party app

```bash
# Navigate manually, then dump for inspection
android layout --pretty --output=/tmp/explore.json
jq '.. | objects | select(.text? != null) | .text' /tmp/explore.json | sort -u
```

## Real Examples

### Find a button by content description

```bash
android layout --pretty \
  | jq '.. | objects | select(.contentDescription? == "Submit") | .bounds'
```

### Diff only — answer "did my tap actually do something?"

```bash
android layout --output=/tmp/a.json
adb shell input tap 200 400
android layout --diff --pretty
```

### Snapshot per-screen for a flow

```bash
for SCREEN in home detail checkout success; do
  # ...navigate to screen $SCREEN...
  android layout --pretty --output="snaps/$SCREEN.json"
done
```

## Common Pitfalls

- **`--diff` needs a previous snapshot** on the same device session. The first invocation has nothing to diff against — its output may be the full tree or empty depending on version.
- **Foreground window only.** Backgrounded activities, system dialogs, or other apps' overlays are not in the dump.
- **Compose vs View interop.** Compose UIs surface as a single `ComposeView` host with semantics children; classic Views surface their full class tree. Heuristics that assume one or the other will break on hybrid apps.
- **Coordinates are device-pixel.** Bounds are in device pixels at the current density — a hierarchy diff across devices of different densities is noisy. Normalize before comparing.
- **Per-device snapshot.** With multiple connected devices, the diff is keyed per device; pass `--device` to `adb` operations to avoid mixed state.

## When to Use This Mode

Use `android layout` over alternatives when:

- An agent needs to **assert** post-action state without screen scraping.
- You want a **diffable**, version-controllable representation of a screen.
- You're driving headless UI tests in CI (no Studio attach).

Prefer Android Studio Layout Inspector when:

- A human wants the interactive 3D view, attribute inspector, and live recomposition counts.

Prefer `uiautomator dump` only when:

- You're stuck on an Android version that predates Android CLI.

## Sources

- Overview of Android CLI (`layout` section) — https://developer.android.com/tools/agents/android-cli
- Release notes — https://developer.android.com/tools/agents/android-cli/release-notes
- Announcement — https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html
