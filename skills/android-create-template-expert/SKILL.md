---
name: android-create-template-expert
description: Expert in `android create` — scaffolding new Android projects from official templates with `--dry-run`, `--name`, `--output`
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: android-cli
  tags: [android, android-cli, create, template, scaffolding, agp-9, 2026]
---

# Android Create Template Expert Mode

You are an expert in `android create`, the scaffolding command of Android CLI. You produce projects that are aligned with the Android team's current "official template" defaults (AGP 9, Compose, Kotlin, edge-to-edge), without manually wiring `build.gradle.kts`, manifests, or theme XML.

## Core Capabilities

### Command shape

```text
android create [--dry-run] [--verbose] [--name=<application-name>] [--output=<dest-path>] [<template-name>]
```

- `--output, -o` — **required** destination project directory.
- `--name=<application-name>` — project directory / module name. Defaults to the basename of `--output`.
- `--dry-run` — simulate; print what would be written, do not touch disk.
- `--verbose` — log every file write.
- `<template-name>` — optional positional. Defaults to **`empty-activity-agp-9`**.

### Listing templates

```bash
android create list
```

Lists every template the CLI knows about. The default `empty-activity-agp-9` is the equivalent of Android Studio's "Empty Activity" New Project wizard but pre-tuned for AGP 9.

### Scaffolding patterns

```bash
# Default Empty Activity (AGP 9, Compose, Kotlin)
android create --output=./MyApp

# Pick a specific template, custom module name
android create --name=Wallet --output=./apps/wallet empty-activity-agp-9

# Dry-run to preview the file tree before committing
android create --dry-run --verbose --output=./apps/wallet empty-activity-agp-9
```

### Output structure (default template)

A `empty-activity-agp-9` scaffold gives you:

```text
MyApp/
├── build.gradle.kts            # AGP 9, Kotlin DSL
├── settings.gradle.kts
├── gradle/
│   └── libs.versions.toml      # version catalog
├── gradlew, gradlew.bat
└── app/
    ├── build.gradle.kts
    └── src/main/
        ├── AndroidManifest.xml
        └── java/<package>/MainActivity.kt   # Compose entry
```

You do **not** get the legacy `tools/templates/` cruft from older `android` (deprecated) — only modern, opinionated defaults.

## Workflow

```bash
# 1. List templates and pick one
android create list

# 2. Dry-run to see what lands where
android create --dry-run --verbose --output=./apps/checkout

# 3. Real run
android create --output=./apps/checkout --name=Checkout

# 4. Cd in and verify with describe (see android-describe-expert-mode)
cd ./apps/checkout
android describe --project_dir=. > project.json

# 5. Hand off to build
./gradlew assembleDebug
# OR deploy directly
android run --apks=app/build/outputs/apk/debug/app-debug.apk
```

## Real Examples

### Multi-module monorepo bootstrap

```bash
mkdir -p ~/work/superapp && cd ~/work/superapp
android create --output=./apps/wallet   --name=Wallet   empty-activity-agp-9
android create --output=./apps/messages --name=Messages empty-activity-agp-9
android create --output=./apps/camera   --name=Camera   empty-activity-agp-9
ls ./apps/   # wallet messages camera
```

### Throwaway preview before commit

```bash
android create --dry-run --verbose --output=/tmp/preview empty-activity-agp-9 \
  | tee preview.log
# Inspect preview.log; nothing was written.
```

### Agent-driven scaffold + immediate run

```bash
android create --output=./Demo --name=Demo
cd Demo
./gradlew :app:assembleDebug
android run --apks=app/build/outputs/apk/debug/app-debug.apk
```

## Common Pitfalls

- **`--output` is required.** Forgetting it produces a help dump, not a default-cwd scaffold. (Different from `git init` muscle memory.)
- **Name vs output mismatch.** `--name` controls Gradle module name; `--output` controls directory. They can differ but should usually match for sanity.
- **Re-running into a non-empty directory.** `android create` will refuse to overwrite. Use a clean directory or remove first.
- **Templates evolve.** The default name `empty-activity-agp-9` may shift to `empty-activity-agp-10` in a future release. Always run `android create list` in CI to detect drift; don't hardcode template names without an upgrade plan.
- **No JDK pinning.** The scaffold trusts the JDK on `JAVA_HOME`. If your team standardizes on JDK 21 for AGP 9, pin it before `./gradlew`.

## When to Use This Mode

Use `android create` over alternatives when:

- An **agent** is bootstrapping a project (instead of a human in Android Studio's New Project wizard).
- You need **reproducible** scaffolds in CI / templates.
- You want the **AGP 9 + Compose** modern baseline without manually maintaining a template repo.

Prefer Android Studio's wizard when:

- The user wants to interactively pick UI options not exposed via `--name/--output`.
- The user needs Wear/TV/Auto module scaffolds not yet covered by a CLI template (check `android create list`).

## Sources

- Overview of Android CLI (`create` section) — https://developer.android.com/tools/agents/android-cli
- Release notes — https://developer.android.com/tools/agents/android-cli/release-notes
- Announcement — https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html
