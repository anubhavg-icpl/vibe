# Project Structure Architect Modes

Production-ready project structure validation and scaffolding agents for modern development stacks. These modes help any LLM create, validate, and improve project structures following industry best practices.

## Available Modes

| Mode | Technology | Key Features |
|------|------------|--------------|
| [rust-project-architect-mode](./rust-project-architect-mode.md) | Rust | Cargo workspaces, Rust 2024 edition, xtask automation |
| [python-project-architect-mode](./python-project-architect-mode.md) | Python | src layout, pyproject.toml, uv/poetry, modern tooling |
| [nextjs-project-architect-mode](./nextjs-project-architect-mode.md) | Next.js 14/15 | App Router, Server Components, TypeScript strict |
| [dotnet-project-architect-mode](./dotnet-project-architect-mode.md) | .NET 8/9 | Clean Architecture, DDD, CQRS, Minimal APIs |

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

## Quick Reference

### Rust Projects
```
my-workspace/
├── Cargo.toml          # Virtual manifest
├── crates/             # All workspace crates
│   ├── my-core/
│   ├── my-api/
│   └── my-cli/
├── xtask/              # Build automation
└── deny.toml           # Security auditing
```

### Python Projects
```
my-project/
├── pyproject.toml      # Single source of truth
├── src/
│   └── my_package/     # src layout
├── tests/
│   ├── unit/
│   └── integration/
└── .pre-commit-config.yaml
```

### Next.js Projects
```
my-nextjs-app/
├── src/
│   ├── app/            # App Router
│   ├── components/     # Shared components
│   ├── lib/            # Utilities
│   └── hooks/          # Custom hooks
├── next.config.ts
└── tailwind.config.ts
```

### .NET Projects
```
MyProject/
├── src/
│   ├── MyProject.Domain/       # Core business logic
│   ├── MyProject.Application/  # Use cases (CQRS)
│   ├── MyProject.Infrastructure/
│   └── MyProject.Api/          # Minimal APIs
├── tests/
├── Directory.Build.props
└── Directory.Packages.props
```

## Usage Examples

### Validate a Project
```
"Validate my Rust project structure and suggest improvements"
"Check if my Python project follows best practices"
"Review my Next.js project organization"
"Audit my .NET solution architecture"
```

### Scaffold a New Project
```
"Create a new Rust workspace for a CLI tool with a core library"
"Set up a Python package with FastAPI and proper testing"
"Scaffold a Next.js 15 app with authentication and dashboard"
"Generate a .NET 9 Clean Architecture solution with CQRS"
```

### Fix Issues
```
"Convert my Python project to use src layout"
"Migrate my Next.js app from Pages to App Router structure"
"Add proper workspace configuration to my Rust project"
"Implement Clean Architecture layers in my .NET project"
```

## Key Technologies & Versions

### Rust
- **Edition**: Rust 2024 (edition = "2024")
- **Resolver**: Version 3
- **Tooling**: cargo-deny, cargo-audit, cargo-nextest

### Python
- **Version**: Python 3.12+
- **Build**: hatchling, setuptools, poetry 2.0
- **Tooling**: ruff, mypy, pytest, uv

### Next.js
- **Version**: Next.js 14/15
- **Router**: App Router
- **Tooling**: TypeScript strict, ESLint, Prettier, Tailwind

### .NET
- **Version**: .NET 8/9
- **Pattern**: Clean Architecture + DDD + CQRS
- **Tooling**: MediatR, FluentValidation, EF Core

## Contributing

When adding new project structure modes:

1. Research current best practices (use web search)
2. Include complete project structure trees
3. Provide configuration file templates
4. Add validation checklists
5. Include scaffold commands
6. Reference official documentation

## Sources

These modes are based on research from:

- Official documentation (Cargo Book, Python Packaging Guide, Next.js Docs, Microsoft Docs)
- Community best practices (matklad, Ardalis, Jason Taylor templates)
- Modern tooling recommendations (Ruff, Biome, etc.)
- Enterprise patterns (Clean Architecture, DDD, CQRS)
