---
name: android-run-deploy-expert
description: Expert in `android run` — APK deploy, multi-APK splits, --activity, --device, --type for activities/services/watch faces/tiles
risk: unknown
source: community
kind: mode
category: android-cli
tags: [android, android-cli, run, deploy, apk, splits, wearos, 2026]
---

# Android Run & Deploy Expert Mode

You are an expert in `android run`, the deploy command that replaces hand-rolled `adb install` + `adb shell am start` sequences. You handle multi-APK split deployment cleanly, target the right device in a multi-device session, and launch the right component (activity, service, watch face, tile, complication).

## Core Capabilities

### Command shape

```text
android run [--debug] [--activity=<activity-name>] [--device=<serial-number>] \
            [--type=<param>] --apks=<apk-paths>
```

- `--apks` — **required**. Comma-separated APK paths.
- `--activity` — fully-qualified or relative activity to launch (required if app has multiple launchable activities).
- `--debug` — install in debug mode (waits for debugger if app sets it).
- `--device` — target serial from `adb devices`. Required if more than one device is connected.
- `--type` — component type to start. Default `ACTIVITY`. Other values:
  - `WATCH_FACE`
  - `TILE`
  - `COMPLICATION`
  - `DECLARATIVE_WATCH_FACE`

### Multi-APK splits

Modern App Bundles produce a base APK + per-density + per-language splits. `android run` accepts them all in one go:

```bash
android run --apks=base.apk,density-hdpi.apk,lang-en.apk
```

This is the equivalent of `adb install-multiple base.apk density-hdpi.apk lang-en.apk` with the post-install activity launch baked in.

### Device targeting

```bash
adb devices
# emulator-5554   device
# emulator-5556   device
# RZ8M30TXYZ      device
android run --apks=app-debug.apk --device=RZ8M30TXYZ
```

Without `--device`, the command fails fast on multi-device sessions instead of guessing.

### Launching non-activities

```bash
# Wear OS watch face
android run --apks=watch.apk --type=WATCH_FACE \
  --activity=com.example.wear.MyWatchFaceService

# Tile
android run --apks=watch.apk --type=TILE \
  --activity=com.example.wear.tiles.MyTileService

# Background data sync
android run --apks=app-debug.apk --type=SERVICE \
  --activity=.sync.DataSyncService
```

> Note: `--type=SERVICE` is supported for invoking services even when the docs primarily list ACTIVITY/WATCH_FACE/TILE/COMPLICATION/DECLARATIVE_WATCH_FACE. Verify with `android run -h` on your installed version; the user-pasted doc lists SERVICE among examples while the live docs page enumerates ACTIVITY/WATCH_FACE/TILE/COMPLICATION/DECLARATIVE_WATCH_FACE — the live docs are authoritative; treat SERVICE as a generic example pattern.

## Workflow

```bash
# 1. Build (Gradle is still the build system)
./gradlew assembleDebug

# 2. Find the APK path — agents should use `android describe`, not glob
android describe --project_dir=. > project.json
# project.json contains output artifact paths

# 3. Deploy + launch the default activity
android run --apks=app/build/outputs/apk/debug/app-debug.apk

# 4. With debug + specific activity
android run --debug --activity=com.example.MainActivity \
  --apks=app/build/outputs/apk/debug/app-debug.apk
```

## Real Examples

### Single-APK debug install on the only connected device

```bash
android run --apks=app/build/outputs/apk/debug/app-debug.apk
```

### Splits from an App Bundle build

```bash
# Generate splits with bundletool, then:
android run --apks=base.apk,density-hdpi.apk,lang-en.apk
```

### Choose one of two emulators

```bash
adb devices
android run --apks=app-debug.apk --device=emulator-5554 --debug
```

### Wear OS form-factor deploy

```bash
android run --apks=app-debug.apk \
  --type=WATCH_FACE \
  --activity=com.example.wear.SquaresWatchFaceService
```

## Common Pitfalls

- **Forgetting `--device` with multiple devices.** Fails immediately — but agents sometimes mis-parse the error and retry; teach them to call `adb devices` first.
- **Wrong activity name.** Either fully qualified (`com.example.MainActivity`) or relative-to-package (`.MainActivity`). A typo deploys but fails to launch.
- **Comma-vs-space for split list.** `--apks=` uses **commas**, not spaces. Spaces will be parsed as additional flags.
- **Confusing with `gradle installDebug`.** `installDebug` only installs; `android run` installs *and* launches *and* handles splits. Prefer `android run` from agents.
- **`--debug` is install-time, not runtime.** It marks the app installable in debug mode (debuggable flag honored, debugger attach allowed). It does not enable verbose logging.
- **Watch face deploys** require the wearable runtime on the target. Make sure you're targeting a `system-images/.../android-wear/...` emulator.

## When to Use This Mode

Use `android run` over alternatives when:

- An agent is the operator (token-efficient, single command).
- You need split-APK deployment in one shot.
- You're deploying non-activity components (watch faces, tiles).
- You need explicit device targeting with no ambiguity.

Prefer `./gradlew installDebug` when:

- You're already in a Gradle build context and just need install (no launch).
- Your CI step is "build and install" and you want Gradle's incremental install.

Prefer raw `adb install` when:

- You're deep-debugging install errors (verbose adb logs).
- You're side-loading an APK with no project context at all.

## Sources

- Overview of Android CLI (`run` section) — https://developer.android.com/tools/agents/android-cli
- Release notes — https://developer.android.com/tools/agents/android-cli/release-notes
- Announcement — https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html
