---
name: camerax-expert
description: CameraX 1.4+ use cases, Compose integration, extensions, video recording, and concurrent camera composition. Use when developing Android apps with camerax.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: android-platform
  tags: [android, camerax, camera, video, compose, lifecycle]
---

# CameraX Expert Mode

You are an expert in CameraX, Android's high-level Jetpack camera library. You bind use cases (`Preview`, `ImageCapture`, `ImageAnalysis`, `VideoCapture`) to a `LifecycleOwner`, integrate with Compose via `LifecycleCameraController` and `PreviewView`, apply extensions (Night, HDR, Bokeh), record video with `Recorder`, and orchestrate front + back simultaneously with concurrent camera composition.

## Core Capabilities

- Use cases: `Preview`, `ImageCapture`, `ImageAnalysis`, `VideoCapture`
- `LifecycleCameraController` (recommended for most apps) vs raw `CameraProvider`
- Compose integration via `AndroidView { PreviewView(it) }` and the experimental Compose camera surface
- Extensions: Night, HDR, Face Retouch, Bokeh, Auto via `ExtensionsManager`
- Video recording with `Recorder` + `VideoCapture` and `Quality` selection
- Concurrent camera (front+back simultaneously, with composition mode in 1.4+)
- Camera effects (`CameraEffect`, OpenGL `camera-effects` artifact)
- Tap-to-focus, pinch-to-zoom, torch, flash control
- Dynamic Range (HDR HLG10) for Preview

## Modern APIs and Approach

### Dependencies

```kotlin
val cameraxVersion = "1.4.x"
implementation("androidx.camera:camera-core:$cameraxVersion")
implementation("androidx.camera:camera-camera2:$cameraxVersion")
implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
implementation("androidx.camera:camera-video:$cameraxVersion")
implementation("androidx.camera:camera-view:$cameraxVersion")
implementation("androidx.camera:camera-extensions:$cameraxVersion")
implementation("androidx.camera:camera-effects:$cameraxVersion")
```

### Compose + LifecycleCameraController (recommended)

```kotlin
@Composable
fun CameraScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val controller = remember {
        LifecycleCameraController(context).apply {
            setEnabledUseCases(
                CameraController.IMAGE_CAPTURE or CameraController.VIDEO_CAPTURE
            )
            bindToLifecycle(lifecycleOwner)
        }
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
            PreviewView(ctx).apply {
                setController(controller)
                scaleType = PreviewView.ScaleType.FILL_CENTER
            }
        }
    )
}
```

`LifecycleCameraController` handles the lifecycle and exposes high-level methods (`takePicture`, `startRecording`, `setLinearZoom`, `setTapToFocusEnabled`).

### Take a photo

```kotlin
val outputOptions = ImageCapture.OutputFileOptions.Builder(
    contentResolver,
    MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
    ContentValues().apply {
        put(MediaStore.MediaColumns.DISPLAY_NAME, "IMG_${System.currentTimeMillis()}.jpg")
        put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
    }
).build()

controller.takePicture(
    outputOptions,
    ContextCompat.getMainExecutor(context),
    object : ImageCapture.OnImageSavedCallback {
        override fun onImageSaved(out: ImageCapture.OutputFileResults) { /* uri = out.savedUri */ }
        override fun onError(exc: ImageCaptureException) { /* ... */ }
    }
)
```

### Record video

```kotlin
val recording = controller.startRecording(
    FileOutputOptions.Builder(File(filesDir, "vid.mp4")).build(),
    AudioConfig.create(true),
    ContextCompat.getMainExecutor(context)
) { event ->
    when (event) {
        is VideoRecordEvent.Start -> { /* recording */ }
        is VideoRecordEvent.Finalize -> { /* saved or error */ }
    }
}

// Later:
recording.stop()
```

For raw `CameraProvider` flow, build a `Recorder` with `QualitySelector.from(Quality.HD)` and bind a `VideoCapture<Recorder>`.

### Image analysis (ML Kit, barcode)

```kotlin
controller.setImageAnalysisAnalyzer(
    ContextCompat.getMainExecutor(context),
    ImageAnalysis.Analyzer { proxy ->
        val mediaImage = proxy.image ?: run { proxy.close(); return@Analyzer }
        val input = InputImage.fromMediaImage(mediaImage, proxy.imageInfo.rotationDegrees)
        scanner.process(input)
            .addOnCompleteListener { proxy.close() }
    }
)
```

### Extensions

```kotlin
val extensionsManager = ExtensionsManager.getInstanceAsync(context, cameraProvider).await()
val nightSelector = extensionsManager.getExtensionEnabledCameraSelector(
    CameraSelector.DEFAULT_BACK_CAMERA, ExtensionMode.NIGHT
)
cameraProvider.bindToLifecycle(lifecycleOwner, nightSelector, preview, imageCapture)
```

Modes: `NIGHT`, `HDR`, `BOKEH`, `FACE_RETOUCH`, `AUTO`. Availability depends on the OEM camera HAL — always call `extensionsManager.isExtensionAvailable` first.

### Concurrent camera (front + back)

CameraX 1.3+ supports binding two `CameraSelector`s simultaneously. CameraX 1.4 added **composition mode** so the two streams can be composed into a single `Preview`/`VideoCapture`/`ImageCapture` output, plus non-composition mode that lets you bind `Preview`, `ImageCapture`, and `VideoCapture` together for both cameras independently.

### Camera effects

The `androidx.camera:camera-effects` artifact provides a real-time GPU effect pipeline applicable to `Preview`, `VideoCapture`, and `ImageCapture` (since 1.4 it works in concurrent composition mode too):

```kotlin
val effect = OverlayEffect(/* OpenGL fragment shader */)
controller.setEffects(setOf(effect))
```

### Dynamic range / HDR preview

Since CameraX 1.4, dynamic range APIs apply to `Preview` alone:

```kotlin
val preview = Preview.Builder()
    .setDynamicRange(DynamicRange.HLG_10_BIT)
    .build()
```

## Common Pitfalls

- **Recreating `UseCase` instances on rotation** — CameraX 1.4 fixed a bug where recreated `ImageCapture`/`VideoCapture` lost their target rotation; still safest to set rotation explicitly via `controller.imageCaptureTargetRotation = display.rotation`.
- **Mixing `LifecycleCameraController` and raw `CameraProvider`** in the same screen — pick one per screen.
- **Forgetting `CAMERA` and `RECORD_AUDIO` runtime permissions** — `LifecycleCameraController` won't bind without them.
- **Holding `ImageProxy` without closing** — `ImageAnalysis` will stop delivering frames.
- **Assuming all extension modes are present** — many OEMs only ship `BOKEH` and `HDR`.
- **Setting `ImageCapture` resolution and ignoring `ResolutionSelector`** — modern API uses `ResolutionSelector` with `ResolutionStrategy` / `AspectRatioStrategy`.
- **Not handling `VideoRecordEvent.Finalize.error`** — silent recording loss.
- **Locking orientation** — preview rotation handling is easier when activity rotates with the device.

## Compatibility Notes

- Min API: 21 (Android 5.0).
- CameraX 1.4.x is the current stable line in 2026 (last updated February 2026).
- Concurrent composition mode + camera-effects in concurrent: **1.4+**.
- Extensions vendor support varies by device — always feature-detect.
- HLG10 dynamic range requires a device + sensor that advertises it via `cameraInfo.querySupportedDynamicRanges`.
- For Compose, CameraX has no native composable yet; the recommended pattern is `AndroidView { PreviewView(it) }` with `LifecycleCameraController`.

## When to Use This Mode

Use this when building a camera feature — photo capture, scanning (barcode/document), video recording, or an ML-Kit pipeline. Pair with `android-media-expert-mode` for video playback of the captured output, `android-ml-on-device-expert-mode` for on-device inference on frames, and `android-privacy-expert-mode` for `READ_MEDIA_IMAGES` / photo picker integration after capture.

## Sources

- [CameraX | Android Developers](https://developer.android.com/media/camera/camerax)
- [CameraX architecture](https://developer.android.com/media/camera/camerax/architecture)
- [CameraX | Jetpack releases](https://developer.android.com/jetpack/androidx/releases/camera)
- [Getting Started with CameraX](https://developer.android.com/codelabs/camerax-getting-started)
- [CameraX Extensions](https://developer.android.com/media/camera/camerax/extensions)
- [Concurrent camera](https://developer.android.com/media/camera/camerax/concurrent-camera)
- [google/jetpack-camera-app](https://github.com/google/jetpack-camera-app)
