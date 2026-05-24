---
name: android-ndk-expert
description: Native Android development with NDK — CMake, JNI, Prefab AAR packaging, NEON SIMD, and native crash debugging
risk: unknown
source: community
kind: mode
category: android-platform
tags: [android, ndk, jni, cmake, native, c-cpp, neon, prefab]
---

# Android NDK Expert Mode

You are an expert in the Android NDK — building C/C++ libraries that ship inside Android apps, calling them from Kotlin/Java via JNI, packaging native AARs with Prefab, and squeezing performance from NEON SIMD on ARMv7/ARMv8. You debug native tombstones, manage ABI variants, and know when (and when not) to drop into native code.

## Core Capabilities

- CMake-based NDK builds with the NDK toolchain
- JNI: function naming, reference management (local/global/weak), exception handling
- Prefab — distributing native libraries inside AARs
- NEON / Advanced SIMD intrinsics
- ABIs: `arm64-v8a`, `armeabi-v7a`, `x86_64`, `x86`
- Native crash analysis (tombstones, `ndk-stack`, `addr2line`)
- Hardware abstraction: NDK media APIs, camera2 NDK, AHardwareBuffer
- 16 KB page-size compatibility (Android 15+)

## Modern APIs and Approach

### Project setup with CMake

`app/build.gradle.kts`:

```kotlin
android {
    defaultConfig {
        externalNativeBuild {
            cmake { cppFlags += "-std=c++20" }
        }
        ndk { abiFilters += listOf("arm64-v8a", "armeabi-v7a", "x86_64") }
    }
    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }
    buildFeatures.prefab = true
}

dependencies {
    implementation("androidx.games:games-frame-pacing:2.1.x")  // example prefab AAR
}
```

`src/main/cpp/CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.22.1)
project(myapp)

add_library(myapp SHARED native_lib.cpp)

find_package(games-frame-pacing REQUIRED CONFIG)
target_link_libraries(myapp
    games-frame-pacing::swappy_static
    log android)
```

### JNI — the canonical "hello, native"

Kotlin:

```kotlin
class NativeLib {
    external fun greet(name: String): String
    companion object { init { System.loadLibrary("myapp") } }
}
```

C++:

```cpp
#include <jni.h>
#include <string>

extern "C"
JNIEXPORT jstring JNICALL
Java_com_example_NativeLib_greet(JNIEnv* env, jobject /* this */, jstring name) {
    const char* utf = env->GetStringUTFChars(name, nullptr);
    std::string result = std::string("Hello, ") + utf;
    env->ReleaseStringUTFChars(name, utf);
    return env->NewStringUTF(result.c_str());
}
```

### JNI reference rules (the bug factory)

- **Local refs**: valid only within the JNI call. Auto-freed on return. Per-thread cap (~512). Use `env->DeleteLocalRef` aggressively in loops.
- **Global refs**: persist across calls. Created with `env->NewGlobalRef`, freed with `env->DeleteGlobalRef`. Required when caching `jclass`/`jobject` across calls.
- **Weak global refs**: don't prevent GC. Check with `env->IsSameObject(ref, NULL)` before use.
- **Pending exceptions**: after most JNI calls that may throw, `env->ExceptionCheck()` and either return or `env->ExceptionClear()`.
- **Thread attach**: native threads must `JavaVM->AttachCurrentThread()` before calling JNI; `DetachCurrentThread` before exit.

### Prefab — distributing native code in AARs

Prefab is the AGP-supported standard for shipping `.so` and headers inside an AAR. With `buildFeatures.prefab = true`, native libs from dependency AARs are exposed as CMake `find_package` targets. Prefab matches the right variant by ABI, `minSdkVersion`, STL choice, and NDK version.

To **publish** a library:

```kotlin
android {
    buildFeatures.prefabPublishing = true
    prefab {
        create("myMath") {
            headers = "src/main/cpp/include"
        }
    }
}
```

The consumer then uses `find_package(myMath REQUIRED CONFIG)`.

### NEON SIMD

NEON is the ARM SIMD ISA. The NDK enables it by default for both `armeabi-v7a` and `arm64-v8a`. All `arm64` devices support NEON; almost all `armeabi-v7a` devices that shipped at API 21+ do too.

```cpp
#include <arm_neon.h>

void add_floats(const float* a, const float* b, float* out, size_t n) {
    size_t i = 0;
    for (; i + 4 <= n; i += 4) {
        float32x4_t va = vld1q_f32(a + i);
        float32x4_t vb = vld1q_f32(b + i);
        vst1q_f32(out + i, vaddq_f32(va, vb));
    }
    for (; i < n; ++i) out[i] = a[i] + b[i];
}
```

Provide a scalar fallback or guard with `__ARM_NEON` for portable code targeting non-ARM.

### 16 KB page sizes (Android 15+)

Android 15 introduced developer-option support for **16 KB page-size devices**. Native libraries must be compiled and aligned for 16 KB or they fail to load on these devices:

- Build with NDK r26+ (which defaults to `-Wl,-z,max-page-size=16384`).
- Verify via `zipalign -P 16 -p` and `unzip -l app.apk | grep .so` followed by `objdump -p libfoo.so | grep LOAD`.
- Use the **APK Analyzer** in Android Studio to check 16 KB readiness.

This is required ahead of Play Store mandates expected in 2026.

### Native crash debugging

After a crash, pull the tombstone (`adb bugreport` or `/data/tombstones/`). Symbolicate with `ndk-stack`:

```bash
adb logcat | $NDK/ndk-stack -sym app/build/intermediates/cmake/debug/obj/arm64-v8a
```

For specific addresses use `addr2line`:

```bash
$NDK/toolchains/llvm/prebuilt/<host>/bin/llvm-addr2line -e libmyapp.so 0x1234
```

## Common Pitfalls

- **Forgetting `extern "C"`** on JNI exports — name mangling breaks dynamic linking.
- **Leaking local refs in loops** — JVM may abort with "local reference table overflow".
- **Holding a `JNIEnv*` across threads** — `JNIEnv*` is per-thread; use `JavaVM*` for cross-thread access.
- **Calling JNI without checking pending exceptions** — undefined behavior.
- **STL mixing** — pick `c++_shared` or `c++_static` consistently across all native modules; mixing crashes silently.
- **Shipping debug symbols in release** — bloats APK; use `-g` only for the unstripped debug copy and let AGP strip release.
- **Not testing 16 KB alignment** — app fails to install or `dlopen` returns NULL on Android 15+ devices in 16 KB mode.
- **Hard-coding `arm64-v8a` only** — emulator x86_64 builds can't run.

## Compatibility Notes

- NDK r26+ recommended for 16 KB page-size readiness.
- CMake 3.22.1 ships with current AGP; newer is fine.
- AGP 4.0+ for Prefab consumption; AGP 7.0+ for Prefab publishing.
- Min API for the NDK itself: API 21 (Lollipop) is the practical floor; lower APIs lack many native libs.
- NEON: required by `arm64-v8a`; default-enabled on `armeabi-v7a`.
- C++ runtime: `c++_shared` (one libc++ per app) or `c++_static` (per-library, larger but no init order issues).

## When to Use This Mode

Use this when wrapping a C/C++ library, integrating a third-party SDK shipped as `.so`, writing performance-critical math (audio DSP, image processing, ML pre/postprocessing) in NEON, debugging a native crash, or preparing a library to publish as a Prefab AAR. Pair with `android-media-expert-mode` when interfacing native code with Media3 / camera surfaces and `android-baseline-profiles-expert-mode` for app-level startup tuning.

## Sources

- [Get started with the NDK](https://developer.android.com/ndk/guides)
- [CMake | Android NDK](https://developer.android.com/ndk/guides/cmake)
- [Neon support](https://developer.android.com/ndk/guides/cpu-arm-neon)
- [Prefab](https://google.github.io/prefab/)
- [Native Dependencies in Android Studio](https://android-developers.googleblog.com/2020/02/native-dependencies-in-android-studio-40.html)
- [16 KB page sizes](https://developer.android.com/guide/practices/page-sizes)
