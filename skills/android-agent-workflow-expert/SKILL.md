---
name: android-agent-workflow-expert
description: End-to-end agent recipes — init → create → sdk install → emulator → run → layout → screen → docs. Composes every Android CLI command cluster.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: android-cli
  tags: [android, android-cli, agent, workflow, end-to-end, recipes, 2026]
---

# Android Agent Workflow Expert Mode

You are the **end-to-end orchestrator**. You compose every Android CLI command cluster (init, create, sdk, emulator, run, describe, layout, screen, docs, skills) into reliable agent recipes. You know which command to call when, in what order, and how to feed each command's output as the input to the next.

## Core Capabilities

### The canonical agent flow

```text
android update                  # ensure CLI fresh
   ↓
android init                    # install android-cli skill into this agent
   ↓
android skills add --all        # equip topic skills
   ↓
android sdk install ...         # only what's needed
   ↓
android create --output=...     # scaffold
   ↓
./gradlew assembleDebug         # build
   ↓
android describe                # find APK path
   ↓
android emulator create/start   # boot device
   ↓
android run --apks=...          # deploy + launch
   ↓
android screen capture -a       # snapshot UI
   ↓
android screen resolve          # tap by label
   ↓
android layout --diff           # assert state changed
   ↓
android docs search/fetch       # ground next code-gen step
```

### Mental model: which mode for which step

| Step | Mode |
|---|---|
| First-run on a fresh box | `android-cli-init-skills-expert` |
| Pinning SDK for the team | `android-sdk-mgmt-expert` |
| Bootstrapping a project | `android-create-template-expert` |
| Booting + tearing down devices | `android-emulator-cli-expert` |
| Deploying + launching | `android-run-deploy-expert` |
| Finding artifacts | `android-describe-expert` |
| Asserting UI state | `android-layout-inspect-expert` |
| Vision-driven UI driving | `android-screen-tools-expert` |
| Pulling Android docs into context | `android-docs-kb-expert` |
| Adding/removing skills | `android-cli-skills-mgmt-expert` |
| CI/CD wiring | `android-cli-ci-automation-expert` |

## Workflow Recipes

### Recipe 1: Scaffold and Run

Use when: agent is asked "create a new Android app and show me it running."

```bash
android update && android init
android sdk install platforms/android-34 build-tools/34.0.0 platform-tools \
  system-images/android-34/google_apis/x86_64
android create --output=./Hello --name=Hello
cd Hello
./gradlew :app:assembleDebug
APK=$(android describe | jq -r '.modules[] | select(.name=="app") | .outputs[] | select(.variant=="debug") | .apk')
android emulator create --profile=medium_phone
android emulator start medium_phone &
until adb shell getprop sys.boot_completed 2>/dev/null | grep -q 1; do sleep 2; done
android run --apks="$APK"
android screen capture --output=hello.png
```

### Recipe 2: Test on multiple devices in parallel

Use when: agent is asked "verify this app on a phone, a tablet, and Wear."

```bash
android sdk install \
  system-images/android-34/google_apis/x86_64 \
  system-images/android-34/android-wear/x86

for p in medium_phone pixel_tablet wear_round; do
  android emulator create --profile="$p"
  android emulator start "$p" &
done
wait
mapfile -t SERIALS < <(adb devices | awk '/emulator-/{print $1}')

APK=$(android describe | jq -r '.modules[] | select(.name=="app") | .outputs[] | select(.variant=="debug") | .apk')
for S in "${SERIALS[@]}"; do
  android run --device="$S" --apks="$APK"
  android screen capture --output="snap-$S.png" --annotate
done

for S in "${SERIALS[@]}"; do android emulator stop "$S"; done
```

### Recipe 3: Vision-driven login flow

Use when: agent is asked to log into an app it's never seen.

```bash
android run --apks=app-debug.apk
android screen capture --output=/tmp/ui.png --annotate
# Agent reasons about /tmp/ui.png, identifies #1 (email), #2 (password), #3 (sign-in)
adb shell $(android screen resolve --screenshot=/tmp/ui.png --string="input tap #1")
adb shell input text 'me@example.com'
adb shell $(android screen resolve --screenshot=/tmp/ui.png --string="input tap #2")
adb shell input text 'hunter2'
adb shell $(android screen resolve --screenshot=/tmp/ui.png --string="input tap #3")
android layout --diff --pretty   # confirm we navigated away from login
```

### Recipe 4: Regenerate code from authoritative docs

Use when: agent is asked "implement edge-to-edge correctly" and shouldn't trust training-time recall.

```bash
android docs search 'edge-to-edge insets handling'
android docs fetch kb://android/topic/ui/look-and-feel/edge-to-edge > /tmp/e2e.md
# Pair with the topic skill so the agent uses team patterns:
android skills add --skill=edge-to-edge
# Now the agent generates code with /tmp/e2e.md + edge-to-edge skill loaded.
```

### Recipe 5: Diff-driven UI regression check

Use when: agent has changed code and must prove the UI didn't break.

```bash
# Baseline (before the change, in main branch):
android run --apks=$(./gradlew :app:assembleDebug -q && android describe | jq -r '...')
android layout --pretty --output=baseline.json
android screen capture --output=baseline.png

# After the change:
git checkout my-branch
./gradlew :app:assembleDebug
android run --apks=$(android describe | jq -r '...')
android layout --diff --pretty --output=delta.json
android screen capture --output=after.png
# Agent reviews delta.json + diffs baseline.png/after.png; flags regressions.
```

### Recipe 6: Complete agent project setup from scratch

Use when: brand-new machine, brand-new project.

```bash
# 1. Install / refresh CLI
curl -L -o android https://developer.android.com/tools/agents/download/$(uname -s | tr A-Z a-z)/android
sudo install -m 0755 android /usr/local/bin/android
android update

# 2. Equip the agent
android init
android skills add --all

# 3. Pin SDK
mkdir -p /opt/android-sdk
echo '--sdk=/opt/android-sdk' > ~/.androidrc
android sdk install platforms/android-34@2 build-tools/34.0.0 platform-tools

# 4. Scaffold
android create --output=./MyApp --name=MyApp

# 5. Build & deploy
cd MyApp && ./gradlew :app:assembleDebug
android sdk install system-images/android-34/google_apis/x86_64
android emulator create --profile=medium_phone
android emulator start medium_phone &
until adb shell getprop sys.boot_completed 2>/dev/null | grep -q 1; do sleep 2; done
android run --apks=$(android describe | jq -r '.modules[]|select(.name=="app")|.outputs[]|select(.variant=="debug")|.apk')
```

## Common Pitfalls

- **Skipping `android init` in a fresh shell.** The agent reverts to non-CLI tools and bloats token usage.
- **Calling `android describe` before `./gradlew assemble*`.** Output paths may be empty.
- **Re-using stale annotated screenshots** across `android screen resolve` calls. Always re-capture between actions.
- **Running multiple long-lived emulators on a small CI runner.** RAM exhaustion. Pool size = floor((runner_RAM_GB - 4) / 2).
- **Mixing `android docs search` results across CLI versions.** kb:// URLs can change; always search before fetch.
- **Forgetting `--device` once a second emulator boots.** Quietly deploys to the wrong target.
- **Treating skills as code.** Skills are *instructions* for the agent — they don't execute, they shape generation.

## When to Use This Mode

Use this mode when:

- You're orchestrating a multi-step Android task end-to-end.
- You need to compose three or more Android CLI command clusters.
- You're writing a runbook or onboarding doc that spans the whole flow.

Drop into a **focused** mode (`android-run-deploy-expert`, `android-screen-tools-expert`, etc.) when one cluster dominates the task.

## Sources

- Overview of Android CLI — https://developer.android.com/tools/agents/android-cli
- Agent tools and resources — https://developer.android.com/tools/agents
- Overview of Android skills — https://developer.android.com/tools/agents/android-skills
- Release notes — https://developer.android.com/tools/agents/android-cli/release-notes
- Announcement — https://android-developers.googleblog.com/2026/04/build-android-apps-3x-faster-using-any-agent.html
