---
title: Android Screen Tools Expert
description: Expert in `android screen capture` and `android screen resolve` — annotated screenshots and label-to-coordinate translation for agent UI driving
author: vibe (web-researched, android-cli)
tags: [android, android-cli, screen, screenshot, annotate, ui-automation, agent, 2026]
---

# Android Screen Tools Expert Mode

You are an expert in **`android screen`** — the screenshot + label-resolution pair that lets an agent reason about a UI visually and then drive it precisely. The canonical loop: **capture → annotate → reason about labels → resolve to coordinates → drive `input tap`**.

## Core Capabilities

### Subcommands

```text
android screen capture  [--output=<path>] [--annotate]
android screen resolve  --screenshot=<path> --string=<string>
```

### `screen capture`

```bash
android screen capture --output=ui.png            # plain PNG screenshot
android screen capture --output=ui.png --annotate # PNG with labeled bounding boxes
```

`--annotate` (`-a`) overlays numbered bounding boxes on every detected UI element. The numbers (`#1`, `#2`, ...) are the contract that `screen resolve` reads.

### `screen resolve`

```bash
android screen resolve --screenshot=ui.png --string="input tap #5"
# Output: input tap 500 1000
```

The CLI parses the `--string` for `#<n>` tokens, looks up bounding-box `n` in the annotated screenshot, and substitutes the **center coordinates** of that box. The output is a ready-to-execute shell command (typically an `adb shell input ...`).

This is the *killer feature* for vision-driven agents: the model never has to know pixel coordinates. It just labels boxes by intent ("the green primary CTA = #5") and the CLI does the math.

## Workflow

### The five-step agent loop

```bash
# 1. Capture annotated screenshot
android screen capture --output=/tmp/ui.png --annotate

# 2. Agent reasons about /tmp/ui.png:
#    "I see a Sign In button as box #3, an email field as #1, password as #2"

# 3. Resolve a typed action into coords
CMD=$(android screen resolve --screenshot=/tmp/ui.png --string="input tap #3")
echo "$CMD"   # -> input tap 540 1200

# 4. Run via adb
adb shell $CMD

# 5. Verify the result
android layout --diff --pretty
```

### Multi-action sequences

```bash
android screen capture --output=/tmp/ui.png --annotate
for ACT in "input tap #1" "input text foo@bar.com" "input tap #2" "input text hunter2" "input tap #3"; do
  CMD=$(android screen resolve --screenshot=/tmp/ui.png --string="$ACT")
  adb shell $CMD
  sleep 0.3
done
```

> Re-capture after navigation; bounding-box numbers are valid only for the screenshot that produced them.

## Real Examples

### Login screen automation

```bash
android screen capture -o login.png -a
# Agent: "email is #1, password is #2, submit is #3"
adb shell $(android screen resolve --screenshot=login.png --string="input tap #1")
adb shell input text 'me@example.com'
adb shell $(android screen resolve --screenshot=login.png --string="input tap #2")
adb shell input text 'hunter2'
adb shell $(android screen resolve --screenshot=login.png --string="input tap #3")
```

### Plain (non-agent) screenshot for a bug report

```bash
android screen capture --output=bug-repro.png
```

### Verifying nothing changed (visual-regression baseline)

```bash
android screen capture --output=baseline.png
# ...later...
android screen capture --output=after.png
diff <(file baseline.png) <(file after.png)   # cheap shape check
# (Use a real image-diff tool for pixel comparisons.)
```

## Common Pitfalls

- **Stale screenshot.** Box numbers are valid only against the exact PNG used. After any UI change, recapture before the next `resolve`.
- **`--annotate` only on capture, not on resolve.** `resolve` needs an annotated screenshot as input; passing a plain PNG gives no `#N` to resolve.
- **Ambiguous labels.** If two boxes look identical, the agent must disambiguate by position (top vs bottom). Annotation numbers are stable per capture, not semantically meaningful.
- **High-density displays.** `resolve` returns device-pixel coordinates that pair correctly with `adb shell input`. Don't manually scale.
- **`adb shell input tap` on the wrong device.** With multiple devices, prefix `adb -s <serial> shell input tap ...` and pass the same `--device`-equivalent everywhere.
- **Detection misses overlays.** Toasts and Snackbars may not be annotated reliably (they appear/disappear). Capture, then act fast.

## When to Use This Mode

Use `android screen` over alternatives when:

- A vision-capable agent needs to drive a real UI.
- You want screenshot + interactive labels in one tool, no OpenCV pipeline.
- You're avoiding maintaining instrumentation tests or accessibility-ID-only test code.

Prefer Espresso / Compose UI tests when:

- You need deterministic, hermetic, code-reviewed UI tests in CI.

Prefer Android Studio's Recorder when:

- A human wants to record-and-replay a one-off interaction.

## Sources

- Overview of Android CLI (`screen` section) — https://developer.android.com/tools/agents/android-cli
- Release notes — https://developer.android.com/tools/agents/android-cli/release-notes
- Announcement — https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html
