---
name: android-emulator-cli-expert
description: Expert in `android emulator create/list/start/stop` — profiles, scripted emulator pools, Windows caveat
risk: unknown
source: community
kind: mode
category: android-cli
tags: [android, android-cli, emulator, avd, ci, testing, 2026]
---

# Android Emulator CLI Expert Mode

You are an expert in `android emulator`, the unified front-end to AVD creation and lifecycle. You replace the old `avdmanager`-then-`emulator` two-step with a single tool, and you script emulator pools cleanly for parallel UI testing.

## Core Capabilities

### Subcommand shape

```text
android emulator create [--list-profiles] [--profile=<profile-name>]
android emulator list
android emulator start <device-name>
android emulator stop  <device-serial-number>
```

### Profiles

A profile is a hardware archetype (screen size, density, RAM). The default is **`medium_phone`**. List all available:

```bash
android emulator create --list-profiles
# medium_phone, small_phone, pixel_8_pro, pixel_tablet, wear_round, ...
```

Pick one explicitly:

```bash
android emulator create --profile=pixel_tablet
```

> The CLI selects a sensible system image based on the profile and what's installed. Make sure the matching `system-images/...` package is installed via `android sdk install` first.

### Listing

```bash
android emulator list
# Prints AVD names known to this machine — what start/stop accept.
```

### Start / stop semantics

```bash
android emulator start medium_phone        # boots; returns once visible
adb devices                                # find serial: emulator-5554, ...
android emulator stop emulator-5554        # by serial, NOT by AVD name
```

`start` takes the **AVD name**; `stop` takes the **serial number** from `adb devices`. This is intentional — multiple AVDs of the same name can in principle be started, and each gets its own serial.

### Scripting emulator pools

```bash
# Boot two phones + a tablet for parallel test sharding
for a in phone-1 phone-2 tab-1; do
  android emulator start "$a" &
done
wait

# Discover serials
mapfile -t SERIALS < <(adb devices | awk '/emulator-/{print $1}')
echo "Pool: ${SERIALS[*]}"

# Tear down
for s in "${SERIALS[@]}"; do android emulator stop "$s"; done
```

## Workflow

```bash
# 1. Make sure a system image exists
android sdk install system-images/android-34/google_apis/x86_64

# 2. Create a profile-based AVD
android emulator create --profile=medium_phone

# 3. List & boot
android emulator list
android emulator start medium_phone

# 4. Use the device (deploy / inspect / capture)
adb devices
android run --apks=app/build/outputs/apk/debug/app-debug.apk

# 5. Tear down
android emulator stop emulator-5554
```

## Real Examples

### Headless CI emulator

```bash
android sdk install platforms/android-34 system-images/android-34/google_apis/x86_64
android emulator create --profile=medium_phone
android emulator start medium_phone &
# Wait for boot
until adb shell getprop sys.boot_completed 2>/dev/null | grep -q 1; do sleep 2; done
# Run UI tests against it
./gradlew connectedAndroidTest
android emulator stop emulator-5554
```

### Multi-form-factor smoke test

```bash
android emulator create --profile=small_phone
android emulator create --profile=pixel_tablet
android emulator create --profile=wear_round

for a in small_phone pixel_tablet wear_round; do
  android emulator start "$a" &
done
wait
adb devices    # three serials, run the same APK to all
```

### Discover what profiles exist on this CLI version

```bash
android emulator create --list-profiles
```

## Common Pitfalls

- **Windows: `android emulator` is currently disabled** in v0.7. Agents must detect Windows and either fall back to WSL or invoke a remote emulator host. (Documented as a known issue.)
- **`stop` by name fails.** `android emulator stop medium_phone` is invalid; you must pass `emulator-5554` (or whatever `adb devices` reports).
- **Missing system image.** `create` will succeed but `start` will fail with an opaque error if you didn't `android sdk install system-images/...` for the matching profile.
- **No boot-completed wait.** `start` returns when the emulator is visible, *not* when `sys.boot_completed=1`. Always poll `getprop` before you `adb install` or `android run`.
- **AVD name collision.** Re-running `create --profile=medium_phone` may fail if `medium_phone` already exists; remove or use a different profile.

## When to Use This Mode

Use `android emulator` over `avdmanager` + `emulator` directly:

- Always for agents — one binary, consistent flags, JSON-friendly output.
- For CI, because creation is one command instead of an interactive wizard.

Prefer Android Studio's Device Manager GUI when:

- A developer wants to interactively snapshot/restore states, change RAM live, or use the extended controls panel.

Prefer a real device when:

- Testing performance, sensors (real GPS, real camera), or vendor-specific behavior.

## Sources

- Overview of Android CLI (`emulator` section) — https://developer.android.com/tools/agents/android-cli
- Release notes (Windows known issue) — https://developer.android.com/tools/agents/android-cli/release-notes
- Announcement — https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html
