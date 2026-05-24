---
name: android-describe-expert
description: Expert in `android describe` — JSON project introspection for build targets, output artifact paths, and module graph. Use when using Android CLI tools for android describe.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: android-cli
  tags: [android, android-cli, describe, json, introspection, agent-context, 2026]
---

# Android Describe Expert Mode

You are an expert in **`android describe`**, the project-introspection command. It is the canonical way for an agent (or any other tool) to find APK paths, build targets, and module structure of an Android project — without parsing `build.gradle.kts`, walking `build/outputs/`, or guessing.

## Core Capabilities

### Command shape

```text
android describe [--project_dir=<project-directory>]
```

- `--project_dir` — path to the project root (defaults to current directory).
- Output: a single JSON document on stdout.

### What the JSON contains

The `describe` JSON is the contract used by the rest of the Android CLI (and other agent tools) to reason about a project. Expect at least these fields:

- `project.name`, `project.dir`
- `modules[]` — each application/library module
  - `name`, `path`
  - `applicationId` (for app modules)
  - `buildTypes[]` (`debug`, `release`, custom)
  - `flavors[]` (if any)
  - `outputs[]` — per build variant:
    - `variant` (e.g. `debug`, `release`)
    - `apk` (path to the produced APK or splits)
    - `mapping` (path to the R8 mapping file, when applicable)
- `targets[]` — Gradle tasks the CLI knows it can invoke
- `sdk` — `compileSdk`, `minSdk`, `targetSdk`

Treat exact field names as version-specific — always parse defensively (check for key presence, fall back when missing).

### Why agents use it

- **Find APK paths post-build** without globbing `build/outputs/apk/.../*.apk`.
- **Discover modules** in a multi-module monorepo.
- **Determine min/target SDK** before deciding which emulator profile to boot.
- **Hand off** to `android run --apks=...` deterministically.

## Workflow

```bash
# 1. Build first
./gradlew :app:assembleDebug

# 2. Describe — agent saves this JSON to its context
android describe --project_dir=. > project.json

# 3. Pluck the APK path (jq sketch — actual schema may vary by version)
APK=$(jq -r '.modules[] | select(.name=="app") | .outputs[] | select(.variant=="debug") | .apk' project.json)

# 4. Deploy
android run --apks="$APK"
```

## Real Examples

### One-shot build → describe → run

```bash
cd ~/work/checkout
./gradlew :app:assembleDebug
android describe --project_dir=. \
  | jq -r '.modules[] | select(.name=="app") | .outputs[] | select(.variant=="debug") | .apk' \
  | xargs -I {} android run --apks={}
```

### Multi-module agent flow

```bash
android describe --project_dir=. > /tmp/p.json
# Module list
jq -r '.modules[].name' /tmp/p.json
# All debug APKs across modules
jq -r '.modules[] | .outputs[]? | select(.variant=="debug") | .apk' /tmp/p.json
```

### Pre-decide emulator profile from minSdk

```bash
MIN=$(android describe | jq -r '.sdk.minSdk')
case "$MIN" in
  21|22|23) android emulator create --profile=small_phone ;;
  *)        android emulator create --profile=medium_phone ;;
esac
```

### Discover R8 mapping for crash symbolication

```bash
android describe --project_dir=. \
  | jq -r '.modules[] | .outputs[]? | select(.variant=="release") | .mapping'
```

## Common Pitfalls

- **Calling `describe` before any build** may yield empty `outputs[]` for some module types — variants that have never been built may not appear. Build at least once, or be ready for missing fields.
- **Hardcoding the schema.** Field names can shift across CLI versions. Always do `jq -r '... // empty'` or equivalent presence checks.
- **Path is relative to `--project_dir`.** APK paths in the JSON may be relative; resolve against `project.dir` before passing to `android run`.
- **Confusing with `gradle :tasks`.** `tasks` lists Gradle tasks; `describe` describes the *project* (modules, variants, artifacts). Different abstraction, different consumer.
- **Large monorepos** can produce huge JSON. Pipe through `jq` immediately rather than loading the whole document into a model context.

## When to Use This Mode

Use `android describe` whenever an agent needs to:

- Locate a built APK without globbing.
- Enumerate modules in a multi-module project.
- Pre-decide emulator/SDK choices from project metadata.
- Hand a deterministic structure to a downstream tool.

Prefer Android Studio's "Project Structure" dialog when:

- A human wants to interactively browse modules and dependency graphs.

Prefer `./gradlew :app:tasks` / `./gradlew :app:dependencies` when:

- You specifically need Gradle-internal info (task DAG, dependency tree).

## Sources

- Overview of Android CLI (`describe` section) — https://developer.android.com/tools/agents/android-cli
- Release notes — https://developer.android.com/tools/agents/android-cli/release-notes
- Announcement — https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html
