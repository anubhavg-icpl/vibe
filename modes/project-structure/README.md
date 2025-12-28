# Project Structure Architect Modes

Production-ready project structure validation and scaffolding agents for modern development stacks. These modes help any LLM create, validate, and improve project structures following industry best practices.

## Available Modes (9 Total)

| Mode | Technology | Key Features |
|------|------------|--------------|
| [rust-project-architect-mode](./rust-project-architect-mode.md) | Rust | Cargo workspaces, Rust 2024 edition, xtask automation |
| [python-project-architect-mode](./python-project-architect-mode.md) | Python | src layout, pyproject.toml, uv/poetry, modern tooling |
| [nextjs-project-architect-mode](./nextjs-project-architect-mode.md) | Next.js 14/15/16 | App Router, Server Components, proxy.ts (16+), Turbopack |
| [dotnet-project-architect-mode](./dotnet-project-architect-mode.md) | .NET 8/9 | Clean Architecture, DDD, CQRS, Minimal APIs |
| [java-spring-project-architect-mode](./java-spring-project-architect-mode.md) | Java Spring Boot 3.x | Hexagonal Architecture, Ports & Adapters, ArchUnit |
| [go-project-architect-mode](./go-project-architect-mode.md) | Go | golang-standards layout, flat to hexagonal patterns |
| [swift-ios-project-architect-mode](./swift-ios-project-architect-mode.md) | Swift/iOS | SwiftUI, TCA, modular SPM architecture |
| [kotlin-android-project-architect-mode](./kotlin-android-project-architect-mode.md) | Kotlin/Android | Clean Architecture, multi-module, Jetpack Compose |
| [typescript-node-project-architect-mode](./typescript-node-project-architect-mode.md) | TypeScript/Node.js | Turborepo monorepo, pnpm workspaces, Biome |

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

| Stack | Structure | Architecture |
|-------|-----------|--------------|
| **Rust** | `crates/` workspace | Flat → Modular |
| **Go** | `cmd/`, `internal/`, `pkg/` | Flat → Hexagonal |
| **Java Spring** | `domain/`, `application/`, `infrastructure/` | Hexagonal (Ports & Adapters) |
| **.NET** | `src/Domain/`, `Application/`, `Infrastructure/` | Clean Architecture + CQRS |
| **Node.js/TS** | `apps/`, `packages/` (monorepo) | Turborepo workspaces |
| **Python** | `src/package_name/` | src layout + pyproject.toml |

### Frontend/Mobile

| Stack | Structure | Architecture |
|-------|-----------|--------------|
| **Next.js** | `src/app/`, `components/`, `lib/` | App Router + Server Components |
| **iOS/Swift** | `Features/`, `Core/`, `Packages/` | TCA or MVVM + Coordinator |
| **Android/Kotlin** | `feature/`, `domain/`, `data/`, `core/` | Clean Architecture + Multi-module |

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
| Technology | Version | Key Features |
|------------|---------|--------------|
| Rust | 2024 edition | Resolver v3, workspace deps |
| Go | 1.23+ | Structured logging (slog) |
| Java | 21+ | Spring Boot 3.4.x, records |
| .NET | 9.0 | Minimal APIs, Native AOT |
| Node.js | 22+ | ESM, native test runner |
| Python | 3.12+ | pyproject.toml, uv |

### Frontend/Mobile
| Technology | Version | Key Features |
|------------|---------|--------------|
| Next.js | 14/15/16 | App Router, Turbopack, `"use cache"` |
| Swift/iOS | iOS 17+ | SwiftUI, TCA 1.x |
| Kotlin/Android | Kotlin 2.1 | Compose, Hilt, Coroutines |

## Architectural Patterns

### Hexagonal Architecture (Ports & Adapters)
Used by: **Java Spring**, **Go** (large projects), **.NET**

```
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

```
Presentation → Application → Domain ← Infrastructure
                    ↑
              (Use Cases)
```

### Feature-Based Modular
Used by: **Next.js**, **Kotlin/Android**, **Swift/iOS**

```
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
```
my-workspace/
├── Cargo.toml          # Virtual manifest
├── crates/             # All workspace crates
└── xtask/              # Build automation
```

### Python
```
my-project/
├── pyproject.toml      # Single source of truth
├── src/my_package/     # src layout
└── tests/
```

### Next.js (14/15/16)
```
my-app/
├── src/
│   ├── app/            # App Router
│   ├── components/     # Shared components
│   └── lib/            # Utilities
├── proxy.ts            # Next.js 16+ (was middleware.ts)
└── next.config.ts
```

### Java Spring (Hexagonal)
```
src/main/java/com/example/
├── domain/             # Pure business logic
├── application/        # Use cases, ports
└── infrastructure/     # Adapters (REST, DB)
```

### Go
```
my-app/
├── cmd/api/            # Entry points
├── internal/           # Private code
└── pkg/                # Public libraries
```

### Kotlin/Android
```
my-android-app/
├── app/                # Main application
├── feature/            # Feature modules
├── domain/             # Pure Kotlin
├── data/               # Repositories
└── core/               # Shared utilities
```

### TypeScript/Node.js (Turborepo)
```
my-platform/
├── apps/               # Applications
├── packages/           # Shared packages
├── turbo.json          # Task orchestration
└── pnpm-workspace.yaml
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

### Community Best Practices
- [golang-standards/project-layout](https://github.com/golang-standards/project-layout)
- [Ardalis Clean Architecture Template](https://github.com/ardalis/CleanArchitecture)
- [Now in Android Sample](https://github.com/android/nowinandroid)
- [The Composable Architecture](https://github.com/pointfreeco/swift-composable-architecture)
