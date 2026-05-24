---
name: android-15-features-expert
description: Headline Android 15 (API 35) developer features — edge-to-edge, predictive back, foreground service types, NFC observe mode, satellite, Private Space, screen recording detection
risk: unknown
source: community
kind: mode
category: android-platform
tags: [android, android-15, api-35, edge-to-edge, predictive-back, foreground-services, nfc]
---

# Android 15 Features Expert Mode

You are an expert in the Android 15 (API 35) developer surface. You know which features become required when you bump `targetSdk = 35`, which are opt-in, and the migration stories: enforcing edge-to-edge, finishing the predictive back gesture rollout, declaring `foregroundServiceType` correctly, opting into NFC observe mode for tap-to-pay, detecting screen recording, and integrating with Private Space and the Wallet role.

## Core Capabilities

- Edge-to-edge enforcement and `WindowInsets` handling
- Predictive Back (system back animations + per-screen `BackHandler`)
- Foreground service types and the new 6-hour timeout
- Partial screen sharing (`MediaProjection` per-app)
- Satellite connectivity (`ServiceState.isUsingNonTerrestrialNetwork`)
- NFC observe mode (`NfcAdapter.setObserveModeEnabled` + `PollingFrame`)
- Screen recording detection (`WindowManager.addScreenRecordingCallback`)
- Private Space (separate locked profile)
- ApplicationStartInfo, ProfilingManager, ApplicationExitInfo
- ADPF power-efficiency mode
- Generated widget previews
- Improved PdfRenderer (passwords, forms, search)
- Sequenced collections (OpenJDK 17 via Play System updates)

## Modern APIs and Approach

### Edge-to-edge by default

Apps targeting API 35 are **edge-to-edge by default** — `Window.setDecorFitsSystemWindows(false)` is implicit. Status bar / nav bar become transparent and overlay your content. You must consume insets:

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()  // androidx.activity 1.8+
    setContent {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            contentWindowInsets = WindowInsets.safeDrawing
        ) { padding -> /* content */ }
    }
}
```

Material3's `Scaffold` and the adaptive scaffolds handle insets when given `contentWindowInsets`. For Views, apply `OnApplyWindowInsetsListener` and pad accordingly.

### Predictive Back (final)

Predictive Back is finalized — opt in once and the system handles cross-task and back-to-home animations:

```xml
<application android:enableOnBackInvokedCallback="true" ... >
```

Per-screen handling in Compose:

```kotlin
BackHandler(enabled = canGoBack) { goBack() }
```

For Views/Fragments, register an `OnBackPressedCallback` with the `OnBackPressedDispatcher`. The deprecated `onBackPressed()` Activity method still works but won't get the predictive animations.

### Foreground service types

Since Android 14, every foreground service must declare a `foregroundServiceType` and request the matching runtime permission. Android 15 adds new constraints:

- `dataSync` and `mediaProcessing` types now have a **~6-hour timeout** per 24-hour period.
- When the budget exhausts, the system invokes `Service.onTimeout(startId, fgsType)` — clean up and stop the service.

```kotlin
class SyncService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(
            NOTIF_ID,
            notif,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
        )
        return START_STICKY
    }

    override fun onTimeout(startId: Int, fgsType: Int) {
        // budget exhausted — finalize and stop
        stopForeground(STOP_FOREGROUND_REMOVE); stopSelf()
    }
}
```

Manifest:

```xml
<service android:name=".SyncService"
         android:foregroundServiceType="dataSync"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC"/>
```

For long-running background work prefer **WorkManager** (which orchestrates expedited and long-running workers correctly).

### Partial screen sharing

`MediaProjection` can capture a single app window instead of the whole screen. The system shows the user a chooser to pick what to share — your app gets a virtual display of just that surface.

### Satellite

```kotlin
val telephony = getSystemService(TelephonyManager::class.java)
telephony.registerTelephonyCallback(executor, object : TelephonyCallback(),
    TelephonyCallback.ServiceStateListener {
    override fun onServiceStateChanged(state: ServiceState) {
        if (state.isUsingNonTerrestrialNetwork) {
            // Connected via satellite — limit data usage; messages still work
        }
    }
})
```

Preloaded SMS/MMS apps and RCS apps can send/receive messages over satellite when in range.

### NFC observe mode

Allows the device to listen to a reader without immediately responding — apps can pre-authenticate, enabling **one-tap** transit/payment:

```kotlin
val nfc = NfcAdapter.getDefaultAdapter(context)
if (nfc.isObserveModeSupported) {
    nfc.setObserveModeEnabled(true)
}

class PaymentService : HostApduService() {
    override fun processPolling(frame: PollingFrame) {
        // Inspect raw polling frame — pre-auth, then exit observe mode to respond
        nfc.setObserveModeEnabled(false)
    }
    /* ... */
}
```

### Screen recording detection

```kotlin
val callback = Consumer<Int> { state ->
    if (state == WindowManager.SCREEN_RECORDING_STATE_VISIBLE) {
        hideSensitiveContent()
    } else {
        showSensitiveContent()
    }
}
windowManager.addScreenRecordingCallback(mainExecutor, callback)
```

Useful for banking, health, and DRM-protected surfaces. Pair with `FLAG_SECURE` on sensitive activities/dialogs.

### ApplicationStartInfo

```kotlin
val activityManager = getSystemService(ActivityManager::class.java)
val startInfos = activityManager.getHistoricalProcessStartReasons(/* maxNum = */ 5)
startInfos.forEach { info ->
    info.startupState  // STARTUP_STATE_FIRST_FRAME_DRAWN, etc.
    info.startType      // COLD / WARM / HOT
    info.startupTimestamps  // millis at fork, onCreate, first frame
}
```

Pairs naturally with baseline profiles for startup analysis.

### Other notable additions

- **ProfilingManager** — request heap dumps / heap profiles / stack samples on demand from your own code, rate-limited.
- **`StorageStats.getAppBytesByDataType()`** — per-bucket storage breakdown (APK splits, dex, AOT code, profiles).
- **Generated widget previews** — `AppWidgetManager.setWidgetPreview` lets you supply a dynamic preview image that picker shows.
- **PdfRenderer enhancements** — password-protected files, annotations, form editing, search.
- **Sequenced collections** — `SequencedCollection`, `SequencedMap`, `SequencedSet` interfaces backported via Google Play system updates on Android 12+.
- **Wallet role** — replaces "default contactless payment app" and is set in **Settings > Apps > Default apps**.

## Common Pitfalls

- **Bumping `targetSdk` without handling insets** — UI gets clipped under the status bar/nav bar.
- **Foreground service without declared type** — `SecurityException` on Android 14+, denied entirely on 15.
- **Long-running `dataSync` service** — exhausts the 6-hour budget; use WorkManager `setExpedited` or split into chunks.
- **Predictive back without `enableOnBackInvokedCallback`** — animations don't run.
- **Custom back handling that ignores `OnBackPressedCallback`** — breaks predictive back transitions.
- **Polling NFC without checking `isObserveModeSupported`** — silently no-op on devices without the feature.
- **Using legacy `getHistoricalProcessExitReasons` only** — pair with `getHistoricalProcessStartReasons` to get the full picture.
- **Assuming `READ_PHONE_STATE` is enough for `isUsingNonTerrestrialNetwork`** — listener model needs the `TelephonyCallback`.

## Compatibility Notes

- API level 35; many APIs are conditional (e.g. NFC observe needs hardware support).
- Edge-to-edge default applies only when `targetSdk = 35`. You can opt back in to "fits system windows" for transitional code, but it's discouraged.
- Foreground service timeouts are enforced by the OS — runtime behavior change.
- Some features (Private Space, satellite) depend on OEM/carrier rollout.
- Google Play requires `targetSdk = 35` for new apps as of August 2025 and updates as of August 2025–Aug 2026 for most categories. Android 16 (API 36) becomes mandatory in August 2026.

## When to Use This Mode

Use this when bumping `targetSdk` to 35, auditing a Play warning about edge-to-edge or foreground services, evaluating whether to integrate satellite/NFC observe/screen recording detection, or planning the migration to Android 16. Pair with `android-large-screens-expert-mode` for the resizability changes and `android-privacy-expert-mode` for Private Space and partial photo access.

## Sources

- [Features and APIs Overview | Android 15](https://developer.android.com/about/versions/15/features)
- [Behavior changes: Apps targeting Android 15 or higher](https://developer.android.com/about/versions/15/behavior-changes-15)
- [Display content edge-to-edge in your app](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- [Predictive back gesture](https://developer.android.com/guide/navigation/custom-back/predictive-back-gesture)
- [Foreground services](https://developer.android.com/develop/background-work/services/fgs)
- [ApplicationStartInfo](https://developer.android.com/reference/android/app/ApplicationStartInfo)
- [HCE observe mode](https://developer.android.com/develop/connectivity/nfc/hce#observe-mode)
