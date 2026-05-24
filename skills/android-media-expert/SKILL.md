---
name: android-media-expert
description: Media3 / ExoPlayer 1.x for playback, MediaSession, MediaController, DRM (Widevine), DASH/HLS streaming, and Compose Media UI
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: android-platform
  tags: [android, media3, exoplayer, drm, widevine, dash, hls, mediasession]
---

# Android Media Expert Mode

You are an expert in Media3, Android's unified media framework that subsumes ExoPlayer, MediaSession, and the Compose-friendly playback UI components. You configure adaptive streaming for DASH/HLS, integrate Widevine DRM, manage audio focus, expose a `MediaSession` for system controls and Auto/Wear, and run background playback from a `MediaSessionService`. You know that `com.google.android.exoplayer2.*` is deprecated.

## Core Capabilities

- ExoPlayer (Media3) playback APIs
- `MediaItem`, `MediaSource`, adaptive sources for DASH / HLS / SmoothStreaming
- `MediaSession`, `MediaController`, `MediaSessionService` (background playback)
- DRM via `MediaDrmCallback` and `DefaultDrmSessionManager` (Widevine, ClearKey, PlayReady)
- Compose Media3 UI: `PlayerSurface`, content frame, Material3 playback widgets
- Track selection with `TrackSelector`
- Audio focus, becoming-noisy, and lifecycle handling
- Cast support (Media3 Cast extension)
- Offline downloads with `DownloadService`
- Transformer (transcoding, edits, exports)

## Modern APIs and Approach

### Dependencies (Media3 1.10 in 2026)

```kotlin
val media3 = "1.10.x"
implementation("androidx.media3:media3-exoplayer:$media3")
implementation("androidx.media3:media3-exoplayer-dash:$media3")
implementation("androidx.media3:media3-exoplayer-hls:$media3")
implementation("androidx.media3:media3-session:$media3")
implementation("androidx.media3:media3-ui:$media3")
implementation("androidx.media3:media3-ui-compose:$media3")     // PlayerSurface
implementation("androidx.media3:media3-datasource:$media3")
implementation("androidx.media3:media3-exoplayer-ima:$media3")  // IMA ads
```

### Basic playback

```kotlin
val player = ExoPlayer.Builder(context).build().apply {
    setMediaItem(MediaItem.fromUri("https://example.com/video.mp4"))
    prepare()
    playWhenReady = true
}
```

### Compose UI

```kotlin
@Composable
fun VideoPlayer(player: Player) {
    PlayerSurface(
        player = player,
        surfaceType = SURFACE_TYPE_SURFACE_VIEW,
        modifier = Modifier.fillMaxSize()
    )
}
```

`media3-ui-compose` ships Material3-based playback widgets (play/pause button, time bar, etc.) since Media3 1.10.

### Adaptive streaming — DASH / HLS

```kotlin
val mediaItem = MediaItem.fromUri("https://example.com/master.m3u8")
val mediaSource = HlsMediaSource.Factory(DefaultHttpDataSource.Factory())
    .createMediaSource(mediaItem)

val player = ExoPlayer.Builder(context).build().apply {
    setMediaSource(mediaSource); prepare(); play()
}
```

For DASH replace `HlsMediaSource.Factory` with `DashMediaSource.Factory`. ExoPlayer auto-detects format from the MIME type or extension; explicit `MediaSource` is needed only for advanced configuration.

### Widevine DRM

```kotlin
val drmConfig = MediaItem.DrmConfiguration.Builder(C.WIDEVINE_UUID)
    .setLicenseUri("https://license.example.com/widevine")
    .setMultiSession(true)
    .setLicenseRequestHeaders(mapOf("X-AxDRM-Message" to token))
    .build()

val mediaItem = MediaItem.Builder()
    .setUri("https://example.com/video.mpd")
    .setDrmConfiguration(drmConfig)
    .build()
```

For more control, build a `DefaultDrmSessionManager` with a custom `MediaDrmCallback`. Widevine security level (L1 vs L3) depends on device hardware — query with `MediaDrm.getPropertyString("securityLevel")`. L3-only devices get downgraded resolution from license servers.

### MediaSession + background playback

```kotlin
class PlaybackService : MediaSessionService() {
    private lateinit var session: MediaSession

    override fun onCreate() {
        super.onCreate()
        val player = ExoPlayer.Builder(this).build()
        session = MediaSession.Builder(this, player).build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo) = session

    override fun onDestroy() {
        session.run { player.release(); release() }
        super.onDestroy()
    }
}
```

Manifest:

```xml
<service
    android:name=".PlaybackService"
    android:foregroundServiceType="mediaPlayback"
    android:exported="true">
    <intent-filter>
        <action android:name="androidx.media3.session.MediaSessionService" />
    </intent-filter>
</service>
```

`MediaSessionService` extends `LifecycleService` since Media3 1.10, giving you a `lifecycleScope` inside the service.

### MediaController (UI client)

```kotlin
val sessionToken = SessionToken(context, ComponentName(context, PlaybackService::class.java))
val controllerFuture = MediaController.Builder(context, sessionToken).buildAsync()
controllerFuture.addListener({
    val controller = controllerFuture.get()
    controller.setMediaItem(MediaItem.fromUri(url))
    controller.play()
}, ContextCompat.getMainExecutor(context))
```

The same controller surface drives Auto, Wear, system media controls, and Cast.

### Audio focus and becoming-noisy

```kotlin
val player = ExoPlayer.Builder(context)
    .setAudioAttributes(
        AudioAttributes.Builder()
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .setUsage(C.USAGE_MEDIA).build(),
        /* handleAudioFocus = */ true
    )
    .setHandleAudioBecomingNoisy(true)
    .build()
```

`handleAudioFocus = true` makes ExoPlayer pause on transient focus loss and duck on transient-may-duck. `handleAudioBecomingNoisy` pauses when headphones unplug.

### Offline downloads

`DownloadManager` + `DownloadService` for offline DRM and progressive content. Use `DownloadHelper` to pick tracks for download.

### Transformer (export, edit, transcode)

```kotlin
val transformer = Transformer.Builder(context)
    .setVideoMimeType(MimeTypes.VIDEO_H264)
    .build()
transformer.start(EditedMediaItem.Builder(MediaItem.fromUri(input)).build(), outputPath)
```

Media3 1.10 improved Transformer's speed adjustment when exporting.

## Common Pitfalls

- **Still using `com.google.android.exoplayer2.*`** — deprecated; migrate to `androidx.media3.*`. Class names mostly map 1:1.
- **Recreating `ExoPlayer` on every screen rotation** — wrap in a ViewModel or service; release in the proper lifecycle.
- **Forgetting `foregroundServiceType="mediaPlayback"`** — required since Android 14 to start a media foreground service.
- **Single `MediaSession` reused across multiple `Player`s** — leads to wrong "now playing" metadata; one session per logical player.
- **Hard-coding bitrate** — let `DefaultTrackSelector` pick adaptively; constraints belong on `setTrackSelectionParameters`.
- **Widevine on emulator** — emulators ship L3 only; some content servers refuse playback.
- **Ignoring `Player.Listener.onPlayerError`** — silent playback failures.
- **Using `PlayerView` AndroidView in Compose** — works, but `PlayerSurface` from `media3-ui-compose` is the modern path.

## Compatibility Notes

- Media3 **1.10** stable as of March 2026. Previous standalone ExoPlayer (`com.google.android.exoplayer2`) is deprecated.
- Min API: 21 (Android 5.0).
- `media3-ui-compose` provides the canonical Compose playback surface and Material3 widgets.
- Widevine L1 (hardware-backed) vs L3 (software) determines max-resolution that license servers will permit.
- HLS / DASH MediaSource factories require their respective `media3-exoplayer-hls` / `media3-exoplayer-dash` artifacts.

## When to Use This Mode

Use this when building any audio/video playback feature, integrating DRM-protected content, exposing background media controls, supporting Cast or Auto/Wear via `MediaSession`, or migrating off the legacy `com.google.android.exoplayer2` package. Pair with `camerax-expert-mode` for capture+playback pipelines and `android-tv-expert-mode` for Compose-on-TV media UIs.

## Sources

- [Media3 | Android Developers](https://developer.android.com/media/media3)
- [Media items](https://developer.android.com/media/media3/exoplayer/media-items)
- [Digital rights management](https://developer.android.com/media/media3/exoplayer/drm)
- [MediaSession](https://developer.android.com/media/media3/session)
- [Media3 1.10 is out](https://android-developers.googleblog.com/2026/03/media3-110-is-out.html)
- [androidx/media on GitHub](https://github.com/androidx/media)
