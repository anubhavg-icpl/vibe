---
name: android-baseline-profiles-expert
description: Baseline + startup profiles, Macrobenchmark, profileinstaller, AGP plugin, and R8 — the full Android startup-and-runtime perf pipeline
risk: unknown
source: community
kind: mode
category: android-platform
tags: [android, baseline-profiles, startup-profiles, macrobenchmark, r8, profileinstaller, app-startup]
---

# Android Baseline Profiles Expert Mode

You are an expert in the full Android startup-and-runtime performance pipeline — generating baseline profiles, generating startup profiles for DEX layout, measuring with Macrobenchmark, packaging with `profileinstaller`, and configuring R8 to keep the profile rules valid. You aim for 15–30% startup wins from baseline profiles alone, and another 15–30% from startup profiles on top.

## Core Capabilities

- Baseline Profile Gradle plugin (`androidx.baselineprofile`)
- Macrobenchmark (`androidx.benchmark:benchmark-macro-junit4`)
- `profileinstaller` runtime (`androidx.profileinstaller:profileinstaller`)
- Baseline vs Startup profiles (different roles, different rules)
- `BaselineProfileRule` and journey design
- `CompilationMode.Partial(BaselineProfileMode.Require)`
- R8 / ProGuard interaction (rule validation, obfuscated names)
- Cloud profile aggregation via Play Store
- Debugging missing profile installation

## Modern APIs and Approach

### What baseline profiles do

ART normally compiles methods in two ways: AOT at install (`speed-profile`) using a profile, then JIT for everything else as the user uses the app. Baseline profiles supply that initial profile **before** the user has run the app, so the critical user journeys are AOT-compiled from first launch. ART merges the bundled profile with the on-device cloud profile that Play assembles from the user base.

Typical wins:

- App startup: 15–30% faster cold start.
- Runtime hot paths (scrolling a list, opening a screen): noticeably less jank in the first few invocations.
- Stack with **startup profiles**: another 15–30% on top, by improving DEX layout so frequently-used classes are co-located on disk.

### Project setup

Two-module setup: app + a `baselineprofile` macrobenchmark module.

`app/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.application")
    id("androidx.baselineprofile")
}

dependencies {
    implementation("androidx.profileinstaller:profileinstaller:1.4.x")
    "baselineProfile"(project(":baselineprofile"))
}
```

`baselineprofile/build.gradle.kts`:

```kotlin
plugins {
    id("com.android.test")
    id("org.jetbrains.kotlin.android")
    id("androidx.baselineprofile")
}

android {
    targetProjectPath = ":app"
    defaultConfig {
        minSdk = 28; targetSdk = 35
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    testOptions.managedDevices.devices {
        create("pixel6Api34", ManagedVirtualDevice::class) {
            device = "Pixel 6"; apiLevel = 34; systemImageSource = "aosp-atd"
        }
    }
}

dependencies {
    implementation("androidx.benchmark:benchmark-macro-junit4:1.4.x")
    implementation("androidx.test.ext:junit:1.2.x")
    implementation("androidx.test.espresso:espresso-core:3.6.x")
    implementation("androidx.test.uiautomator:uiautomator:2.3.x")
}
```

### Generating a baseline profile

```kotlin
@OptIn(ExperimentalBaselineProfilesApi::class)
@RunWith(AndroidJUnit4::class)
class BaselineProfileGenerator {
    @get:Rule val rule = BaselineProfileRule()

    @Test fun generate() = rule.collect(
        packageName = "com.example.app",
        includeInStartupProfile = true     // also produce a startup-profile entry
    ) {
        pressHome()
        startActivityAndWait()             // measured cold start
        // Critical user journey
        device.findObject(By.text("Search")).click()
        device.wait(Until.hasObject(By.res("results")), 5_000)
        device.findObject(By.res("results")).children.first().click()
    }
}
```

Run:

```bash
./gradlew :app:generateReleaseBaselineProfile
```

Generated rules land at `app/src/release/generated/baselineProfiles/baseline-prof.txt` (and `startup-prof.txt`). Commit them.

### Measuring with Macrobenchmark

```kotlin
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule val rule = MacrobenchmarkRule()

    @Test fun startupNone() = rule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 10,
        startupMode = StartupMode.COLD,
        compilationMode = CompilationMode.None()
    ) { pressHome(); startActivityAndWait() }

    @Test fun startupBaseline() = rule.measureRepeated(
        packageName = "com.example.app",
        metrics = listOf(StartupTimingMetric()),
        iterations = 10,
        startupMode = StartupMode.COLD,
        compilationMode = CompilationMode.Partial(BaselineProfileMode.Require)
    ) { pressHome(); startActivityAndWait() }
}
```

Compare `timeToInitialDisplayMs` and `timeToFullDisplayMs` between modes — that's your baseline-profile uplift.

### Frame timing

```kotlin
@Test fun scrollFrameTiming() = rule.measureRepeated(
    packageName = "com.example.app",
    metrics = listOf(FrameTimingMetric()),
    iterations = 5,
    compilationMode = CompilationMode.Partial(BaselineProfileMode.Require)
) {
    startActivityAndWait()
    val list = device.findObject(By.res("feed"))
    repeat(10) { list.swipe(Direction.UP, /* percent = */ 0.5f, 1_000) }
}
```

Track p50 / p95 / p99 frame durations to catch jank regressions.

### Startup profiles + DEX layout

Adding `includeInStartupProfile = true` to the generator emits a `startup-prof.txt` that AGP uses to **reorder classes in the DEX** so the cold-start working set is contiguous on disk. This matters most on devices with slow storage. Combined with baseline profiles you typically get 30–60% startup improvement on real-world apps.

### profileinstaller runtime

The `androidx.profileinstaller:profileinstaller` artifact installs the profile on first launch when ART hasn't compiled it at install (e.g., installed via APK rather than Play). It runs in a low-priority background thread. Verify in Logcat:

```
ProfileInstaller: Installing profile for com.example.app
```

### R8 and Baseline Profiles

R8 minifies/obfuscates class and method names. The Baseline Profile generator runs against the **release** build (with R8) and emits already-obfuscated rules — they remain valid as long as you don't regenerate the profile and ship a different mapping. The Gradle plugin handles this by tying generation to your release build variant.

If R8 strips a class referenced by the profile, ART simply ignores that line — no crash, just a silent miss. Periodically re-generate after major dependency upgrades.

## Common Pitfalls

- **Generating against debug builds** — debug skips R8, so the profile rules don't match release symbols.
- **Forgetting `:baselineprofile` Gradle module** — without it the AGP plugin has nowhere to run the journey from.
- **Journey too narrow** — only the home screen runs; everything else falls through to JIT. Cover real user paths (sign-in, list, detail).
- **Profile larger than 1.5 MB** — ART rejects oversize profiles; trim by reducing journey scope or increasing iteration density rather than breadth.
- **Measuring with `CompilationMode.None()` only** — you'll miss the gain from the profile being applied.
- **Skipping `profileinstaller`** — APK-installed users (sideloaded) won't get the bundled profile applied.
- **Comparing benchmark numbers across devices** — always pin a Macrobenchmark device (managed virtual device or specific physical model).
- **Re-running on every CI build** — generation is slow; gate it behind a release prep job. Run *measurement* on every PR, not generation.

## Compatibility Notes

- Min API for `profileinstaller`: 24 (some support back to 23 via Play system updates).
- Macrobenchmark min API: 23 (some metrics require 29+).
- AGP: 8.0+ for app modules, 8.3+ to use a dedicated source set directory in libraries.
- Baseline Profile Gradle plugin tracks AGP versions; use the plugin version that matches your AGP minor.
- Profile installer 1.4.x and Macrobenchmark 1.4.x are the current recommended versions.

## When to Use This Mode

Use this when you see startup time complaints in Play Console vitals, want to set CI guardrails for performance regression, are about to ship a major release and want a measurable baseline, or are diagnosing why your app feels slow on first launch but fine afterward. Pair with `compose-performance-expert-mode` for the per-frame recomposition discipline that baseline profiles can't fix on their own.

## Sources

- [Baseline Profiles overview](https://developer.android.com/topic/performance/baselineprofiles/overview)
- [Create Baseline Profiles](https://developer.android.com/topic/performance/baselineprofiles/create-baselineprofile)
- [Benchmark Baseline Profiles with Macrobenchmark](https://developer.android.com/topic/performance/baselineprofiles/measure-baselineprofile)
- [Configure Baseline Profile generation](https://developer.android.com/topic/performance/baselineprofiles/configure-baselineprofiles)
- [Create Startup Profiles](https://developer.android.com/topic/performance/startupprofiles/dex-layout-optimizations)
- [Macrobenchmark library](https://developer.android.com/jetpack/androidx/releases/benchmark)
