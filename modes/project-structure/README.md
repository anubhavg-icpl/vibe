# Project Structure Architect Modes

Production-ready project structure validation and scaffolding agents for modern development stacks. These modes help any LLM create, validate, and improve project structures following industry best practices.

## Available Modes (14 Total)

| Mode                                                                                      | Technology           | Key Features                                                   |
| ----------------------------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------- |
| [rust-project-architect-mode](./rust-project-architect-mode.md)                           | Rust                 | Cargo workspaces, Rust 2024 edition, xtask automation          |
| [python-project-architect-mode](./python-project-architect-mode.md)                       | Python               | src layout, pyproject.toml, uv/poetry, modern tooling          |
| [nextjs-project-architect-mode](./nextjs-project-architect-mode.md)                       | Next.js 14/15/16     | App Router, Server Components, proxy.ts (16+), Turbopack       |
| [dotnet-project-architect-mode](./dotnet-project-architect-mode.md)                       | .NET 8/9             | Clean Architecture, DDD, CQRS, Minimal APIs                    |
| [java-spring-project-architect-mode](./java-spring-project-architect-mode.md)             | Java Spring Boot 3.x | Hexagonal Architecture, Ports & Adapters, ArchUnit             |
| [go-project-architect-mode](./go-project-architect-mode.md)                               | Go                   | golang-standards layout, flat to hexagonal patterns            |
| [swift-ios-project-architect-mode](./swift-ios-project-architect-mode.md)                 | Swift/iOS            | SwiftUI, TCA, modular SPM architecture                         |
| [swift-macos-project-architect-mode](./swift-macos-project-architect-mode.md)             | Swift/macOS          | SwiftUI + AppKit, Xcode, sandboxing, multi-window              |
| [kotlin-android-project-architect-mode](./kotlin-android-project-architect-mode.md)       | Kotlin/Android       | Clean Architecture, multi-module, Jetpack Compose              |
| [typescript-node-project-architect-mode](./typescript-node-project-architect-mode.md)     | TypeScript/Node.js   | Turborepo monorepo, pnpm workspaces, Biome                     |
| [react-vite-project-architect-mode](./react-vite-project-architect-mode.md)               | React/Vite           | Feature-based structure, TanStack Query, Zustand               |
| [scala-sbt-project-architect-mode](./scala-sbt-project-architect-mode.md)                 | Scala/sbt            | Typelevel stack, Cats Effect, functional patterns              |
| [cpp-cmake-project-architect-mode](./cpp-cmake-project-architect-mode.md)                 | C/C++/CMake          | Modern CMake 3.21+, vcpkg/Conan, clang-tidy                    |
| [browser-extension-project-architect-mode](./browser-extension-project-architect-mode.md) | Browser Extensions   | Manifest V3, TypeScript, multi-browser (Chrome/Firefox/Safari) |

## What These Modes Do

### 1. Validate Existing Projects

Analyze your project structure and provide:

- ✅ What's done correctly
- ⚠️ Warnings (non-critical improvements)
- ❌ Issues (critical problems)
- 📋 Recommendations
- 🔧 Fix commands

### 2. Scaffold New Projects

Generate production-ready project structures with:

- Proper directory organization
- Configuration files (linting, formatting, testing)
- CI/CD workflows
- Docker configurations
- Documentation templates

### 3. Best Practices Enforcement

Each mode enforces modern best practices:

- **Security**: Dependency auditing, vulnerability scanning
- **Type Safety**: Strict type checking configurations
- **Testing**: Unit, integration, and e2e test structures
- **CI/CD**: GitHub Actions workflows
- **Documentation**: README, changelog, architecture docs

## Quick Reference by Stack

### Backend

| Stack           | Structure                                        | Architecture                 |
| --------------- | ------------------------------------------------ | ---------------------------- |
| **Rust**        | `crates/` workspace                              | Flat → Modular               |
| **Go**          | `cmd/`, `internal/`, `pkg/`                      | Flat → Hexagonal             |
| **Java Spring** | `domain/`, `application/`, `infrastructure/`     | Hexagonal (Ports & Adapters) |
| **.NET**        | `src/Domain/`, `Application/`, `Infrastructure/` | Clean Architecture + CQRS    |
| **Node.js/TS**  | `apps/`, `packages/` (monorepo)                  | Turborepo workspaces         |
| **Python**      | `src/package_name/`                              | src layout + pyproject.toml  |
| **Scala**       | `modules/`, `src/main/scala/`                    | Tagless final, Typelevel     |
| **C/C++**       | `src/`, `include/`, `lib/`                       | Modern CMake targets         |

### Frontend/Mobile/Desktop

| Stack                  | Structure                                | Architecture                      |
| ---------------------- | ---------------------------------------- | --------------------------------- |
| **Next.js**            | `src/app/`, `components/`, `lib/`        | App Router + Server Components    |
| **React/Vite**         | `src/features/`, `components/`, `hooks/` | Feature-based + TanStack          |
| **iOS/Swift**          | `Features/`, `Core/`, `Packages/`        | TCA or MVVM + Coordinator         |
| **macOS/Swift**        | `App/`, `Features/`, `Packages/`         | SwiftUI + AppKit hybrid           |
| **Android/Kotlin**     | `feature/`, `domain/`, `data/`, `core/`  | Clean Architecture + Multi-module |
| **Browser Extensions** | `src/`, `public/`, per-browser manifests | Manifest V3, multi-browser        |

## Usage Examples

### Validate a Project

```
"Validate my Rust workspace structure"
"Check if my Python project follows best practices"
"Review my Next.js 16 project organization"
"Audit my Spring Boot hexagonal architecture"
"Analyze my Android multi-module setup"
```

### Scaffold a New Project

```
"Create a new Rust workspace for a CLI tool with a core library"
"Set up a Python package with FastAPI and proper testing"
"Scaffold a Next.js 16 app with authentication"
"Generate a Spring Boot 3.x hexagonal architecture project"
"Create an Android app with Clean Architecture and Compose"
"Set up a TypeScript monorepo with Turborepo"
```

### Migrate/Upgrade

```
"Migrate my Next.js app from middleware.ts to proxy.ts (16.x)"
"Convert my Python project to src layout"
"Add multi-module structure to my Android app"
"Upgrade my Go project to hexagonal architecture"
```

## Key Technologies & Versions

### Backend

| Technology | Version      | Key Features                 |
| ---------- | ------------ | ---------------------------- |
| Rust       | 2024 edition | Resolver v3, workspace deps  |
| Go         | 1.23+        | Structured logging (slog)    |
| Java       | 21+          | Spring Boot 3.4.x, records   |
| .NET       | 9.0          | Minimal APIs, Native AOT     |
| Node.js    | 22+          | ESM, native test runner      |
| Python     | 3.12+        | pyproject.toml, uv           |
| Scala      | 3.4.x/3.5.x  | Cats Effect 3, http4s, ZIO 2 |
| C/C++      | C++20/23     | CMake 3.21+, vcpkg, Conan    |

### Frontend/Mobile/Desktop

| Technology         | Version     | Key Features                         |
| ------------------ | ----------- | ------------------------------------ |
| Next.js            | 14/15/16    | App Router, Turbopack, `"use cache"` |
| React              | 18.x/19.x   | Vite 6, TanStack Query, Zustand      |
| Swift/iOS          | iOS 17+     | SwiftUI, TCA 1.x                     |
| Swift/macOS        | macOS 14+   | SwiftUI + AppKit, multi-window       |
| Kotlin/Android     | Kotlin 2.1  | Compose, Hilt, Coroutines            |
| Browser Extensions | Manifest V3 | TypeScript, Chrome/Firefox/Safari    |

## Architectural Patterns

### Hexagonal Architecture (Ports & Adapters)

Used by: **Java Spring**, **Go** (large projects), **.NET**

```text
┌─────────────────────────────────────────┐
│              Infrastructure             │
│  ┌───────────────────────────────────┐  │
│  │           Application             │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │          Domain             │  │  │
│  │  │  (Business Logic - Pure)    │  │  │
│  │  └─────────────────────────────┘  │  │
│  │   Ports (Interfaces)              │  │
│  └───────────────────────────────────┘  │
│   Adapters (HTTP, DB, Queue, etc.)      │
└─────────────────────────────────────────┘
```

### Clean Architecture

Used by: **.NET**, **Kotlin/Android**, **Swift/iOS**

```text
Presentation → Application → Domain ← Infrastructure
                    ↑
              (Use Cases)
```

### Feature-Based Modular

Used by: **Next.js**, **Kotlin/Android**, **Swift/iOS**

```text
feature/
├── authentication/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
└── dashboard/
    └── ...
```

## Directory Structure Summary

### Rust

```text
my-workspace/
├── Cargo.toml          # Virtual manifest
├── crates/             # All workspace crates
└── xtask/              # Build automation
```

### Python

```text
my-project/
├── pyproject.toml      # Single source of truth
├── src/my_package/     # src layout
└── tests/
```

### Next.js (14/15/16)

```text
my-app/
├── src/
│   ├── app/            # App Router
│   ├── components/     # Shared components
│   └── lib/            # Utilities
├── proxy.ts            # Next.js 16+ (was middleware.ts)
└── next.config.ts
```

### Java Spring (Hexagonal)

```text
src/main/java/com/example/
├── domain/             # Pure business logic
├── application/        # Use cases, ports
└── infrastructure/     # Adapters (REST, DB)
```

### Go

```text
my-app/
├── cmd/api/            # Entry points
├── internal/           # Private code
└── pkg/                # Public libraries
```

### Kotlin/Android

```text
my-android-app/
├── app/                # Main application
├── feature/            # Feature modules
├── domain/             # Pure Kotlin
├── data/               # Repositories
└── core/               # Shared utilities
```

### TypeScript/Node.js (Turborepo)

```text
my-platform/
├── apps/               # Applications
├── packages/           # Shared packages
├── turbo.json          # Task orchestration
└── pnpm-workspace.yaml
```

### React/Vite

```text
my-react-app/
├── src/
│   ├── features/       # Feature modules
│   ├── components/     # Shared UI
│   ├── hooks/          # Custom hooks
│   └── lib/            # Third-party config
├── vite.config.ts
└── vitest.config.ts
```

### Scala/sbt

```text
my-scala-app/
├── build.sbt           # Build definition
├── project/            # sbt plugins
├── modules/            # Multi-module (optional)
└── src/main/scala/     # Source code
```

### C/C++ (CMake)

```text
my-cpp-project/
├── CMakeLists.txt      # Root build
├── src/                # Implementation
├── include/            # Public headers
├── lib/                # Internal libraries
└── tests/              # Unit tests
```

### macOS/Swift (Xcode)

```text
MyMacApp/
├── MyMacApp.xcodeproj
├── MyMacApp/
│   ├── App/            # App entry
│   └── Features/       # Feature modules
└── Packages/           # Local SPM packages
```

### Browser Extension

```text
my-extension/
├── src/
│   ├── background/     # Service worker
│   ├── content/        # Content scripts
│   ├── popup/          # Popup UI
│   └── options/        # Options page
├── public/
│   ├── manifest.json   # Chrome manifest
│   └── manifest.firefox.json
└── vite.config.ts
```

## Contributing

When adding new project structure modes:

1. Research current best practices (use web search)
2. Include complete project structure trees
3. Provide configuration file templates
4. Add validation checklists
5. Include scaffold commands
6. Reference official documentation

## Sources & References

### Official Documentation

- [Cargo Book - Package Layout](https://doc.rust-lang.org/cargo/guide/project-layout.html)
- [Python Packaging User Guide](https://packaging.python.org/)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Go Module Layout](https://go.dev/doc/modules/layout)
- [Android Architecture Guide](https://developer.android.com/topic/architecture)
- [Turborepo Documentation](https://turborepo.com/docs)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Scala 3 Documentation](https://docs.scala-lang.org/scala3/)
- [sbt Reference Manual](https://www.scala-sbt.org/1.x/docs/)
- [CMake Documentation](https://cmake.org/documentation/)
- [Apple Developer - macOS](https://developer.apple.com/macos/)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Firefox Add-ons Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

### Community Best Practices

- [golang-standards/project-layout](https://github.com/golang-standards/project-layout)
- [Ardalis Clean Architecture Template](https://github.com/ardalis/CleanArchitecture)
- [Now in Android Sample](https://github.com/android/nowinandroid)
- [The Composable Architecture](https://github.com/pointfreeco/swift-composable-architecture)
- [Typelevel Ecosystem](https://typelevel.org/projects/)
- [Modern CMake](https://cliutils.gitlab.io/modern-cmake/)
- [Bulletproof React](https://github.com/alan2207/bulletproof-react)
- [WebExtension Toolbox](https://github.com/nicholasess/webextension-toolbox)
