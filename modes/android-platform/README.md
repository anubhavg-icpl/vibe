# Android Platform Modes

Vibe expert modes covering the modern Android development platform (2025–2026). These complement the Android CLI command modes in `modes/android-cli/` — those focus on the `android` command-line tool, these focus on the platform itself: UI toolkits, agent tooling, form factors, native code, media, privacy/security, KMP, and on-device AI.

All modes are web-researched against `developer.android.com` and other primary sources. Each mode includes verified Kotlin samples, real library coordinates, common pitfalls drawn from the official docs, and links back to the sources.

## Categories

### UI

- [`jetpack-compose-expert-mode.md`](./jetpack-compose-expert-mode.md) — Composables, state hoisting, side effects, lazy lists, type-safe navigation, animations, Compose Multiplatform considerations.
- [`compose-performance-expert-mode.md`](./compose-performance-expert-mode.md) — Recomposition discipline, stability, Strong Skipping (default in Kotlin 2.0.20+), `derivedStateOf`, Layout Inspector, baseline profiles overview.

### Agent Tooling

- [`gemini-in-android-studio-expert-mode.md`](./gemini-in-android-studio-expert-mode.md) — Chat, Agent Mode, slash commands, MCP servers, AGENTS.md, auto-approve, `.gemini/commands.json`.
- [`android-agent-skills-expert-mode.md`](./android-agent-skills-expert-mode.md) — SKILL.md format, `.skills/` and `.agent/skills/` layout, distribution via the `android/skills` repo, integration with Gemini and the `android` CLI.

### Form Factors

- [`wear-os-expert-mode.md`](./wear-os-expert-mode.md) — Compose for Wear, Tiles, Complications, Watch Face Format (declarative XML), Health Services for sensors and exercises.
- [`android-tv-expert-mode.md`](./android-tv-expert-mode.md) — Compose for TV, `tv-material` library, focus management, Carousel/ImmersiveList, channels and recommendations.
- [`android-large-screens-expert-mode.md`](./android-large-screens-expert-mode.md) — Window size classes, foldables, fold posture, drag-and-drop, adaptive Material3 scaffolds, Android 16 resizability mandate.
- [`android-automotive-expert-mode.md`](./android-automotive-expert-mode.md) — Car App Library, templates (PlaceList, Navigation, Map, SignIn, Pane, etc.), Android Auto vs AAOS, distraction-optimized UX.

### Native

- [`android-ndk-expert-mode.md`](./android-ndk-expert-mode.md) — CMake, JNI reference rules, Prefab AAR packaging, NEON SIMD, 16 KB page-size readiness, native crash debugging.

### Media

- [`camerax-expert-mode.md`](./camerax-expert-mode.md) — CameraX 1.4+ use cases, Compose `LifecycleCameraController`, extensions, video recording, concurrent camera composition, HLG10 dynamic range.
- [`android-media-expert-mode.md`](./android-media-expert-mode.md) — Media3 1.10 (ExoPlayer, MediaSession, MediaController), DRM (Widevine), DASH/HLS, `MediaSessionService`, Compose `PlayerSurface`, Transformer.

### Privacy & Security

- [`android-privacy-expert-mode.md`](./android-privacy-expert-mode.md) — Photo picker, partial photo permissions (`READ_MEDIA_VISUAL_USER_SELECTED`), per-app language, package visibility, scoped storage, `shouldShowRequestPermissionRationale`.
- [`android-security-expert-mode.md`](./android-security-expert-mode.md) — Play Integrity API, BiometricPrompt, KeyStore + key attestation, Credential Manager (passkeys), Network Security Config, Encrypted DataStore.
- [`android-15-features-expert-mode.md`](./android-15-features-expert-mode.md) — Edge-to-edge, predictive back, foreground service types and timeouts, NFC observe mode, satellite, screen-recording detection, Private Space, ApplicationStartInfo.

### KMP

- [`kotlin-multiplatform-expert-mode.md`](./kotlin-multiplatform-expert-mode.md) — Source set hierarchy, `expect`/`actual`, Ktor, SQLDelight, kotlinx.coroutines/serialization, Compose Multiplatform 1.7+, iOS XCFramework distribution.

### Performance Pipeline

- [`android-baseline-profiles-expert-mode.md`](./android-baseline-profiles-expert-mode.md) — Baseline + startup profiles, Macrobenchmark module setup, `BaselineProfileRule`, `CompilationMode.Partial`, `profileinstaller`, R8 interaction.

### Health & On-Device AI

- [`android-health-fitness-expert-mode.md`](./android-health-fitness-expert-mode.md) — Health Connect (structured + FHIR), Health Services on Wear (`ExerciseClient`, `PassiveMonitoringClient`, `MeasureClient`), Google Fit migration.
- [`android-ml-on-device-expert-mode.md`](./android-ml-on-device-expert-mode.md) — AICore + Gemini Nano, ML Kit GenAI APIs (Summarization/Image Description/Proofreading/Rewriting), MediaPipe LLM Inference, LiteRT (formerly TFLite).

## How These Compose

A typical "modern Android app" project might draw on:

- `jetpack-compose-expert-mode` + `compose-performance-expert-mode` for the UI layer
- `android-large-screens-expert-mode` for tablet/foldable adaptation
- `android-15-features-expert-mode` for edge-to-edge + predictive back
- `android-privacy-expert-mode` + `android-security-expert-mode` for the user-facing trust surface
- `camerax-expert-mode` and/or `android-media-expert-mode` for media features
- `android-baseline-profiles-expert-mode` for shipping fast startup
- `gemini-in-android-studio-expert-mode` + `android-agent-skills-expert-mode` for the developer workflow itself

For wearable, TV, automotive, or KMP projects, swap in the form-factor-specific modes alongside the core UI/perf/privacy set.

## Sources

Every mode cites primary URLs at the bottom — overwhelmingly `developer.android.com`, with supporting links to the Android Developers Blog, `kotlinlang.org`, `ai.google.dev`, and `android-developers.googleblog.com` feature-drop posts.
