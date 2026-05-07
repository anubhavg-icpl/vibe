# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Multi-CLI plugin manifests** - One-command install across Claude Code, Codex CLI/App, Cursor, OpenCode, Gemini CLI, GitHub Copilot CLI, and Factory Droid via native marketplace systems (`.claude-plugin/`, `.codex-plugin/`, `.cursor-plugin/`, `.factory-plugin/`, `.github/plugin/`, `.opencode/plugin.js`, `gemini-extension.json`)
- **14 superpowers skills** imported from obra/superpowers (brainstorming, dispatching-parallel-agents, executing-plans, finishing-a-development-branch, receiving-code-review, requesting-code-review, subagent-driven-development, systematic-debugging, test-driven-development, using-git-worktrees, using-superpowers, verification-before-completion, writing-plans, writing-skills)
- **GEMINI.md** context file for Gemini CLI extension users
- **VIBE CLI** - TypeScript command-line tool for installing VIBE modes as skills to AI agents
- **Agent support** - Install modes to OpenCode, Claude Code, Codex, and Cursor
- **Mode discovery** - Automatic discovery and parsing of 283+ modes across 33 categories
- **Skill conversion** - Convert mode files to SKILL.md format with YAML frontmatter
- **Global/project installation** - Install modes globally or per-project
- **Interactive CLI** - Select modes and agents with beautiful prompts
- **CI/CD support** - Non-interactive mode for automation
- **3 Vercel agent-skills** - Integrated react-best-practices, web-design-guidelines, vercel-deploy-claimable
- **CLI development guide** - Documentation for contributing to VIBE CLI
- **TypeScript tooling** - Added tsup, tsx, and typescript for CLI development
- `.gitignore` file for repository hygiene
- `LICENSE` file (originally MIT, see Changed below)
- `CONTRIBUTING.md` with comprehensive contribution guidelines
- `CHANGELOG.md` for tracking version history
- GitHub Actions workflow for validation
- Missing category README files

### Changed

- **License migrated from MIT to CC BY-NC-SA 4.0** - Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International. Non-commercial use remains free with attribution; commercial licensing available on request.
- README badges, install table, and FAQ updated to reflect CC BY-NC-SA 4.0 and per-CLI plugin install instructions.
- Updated main `README.md` with VIBE CLI documentation and usage examples
- Updated mode counts: 283 modes, 33 categories
- Enhanced CONTRIBUTING.md with CLI development section
- Updated stats in README.md

---

## [1.2.0] - 2024-12-28

### Added

- **Dhurandhar mode** - Deep-cover operative security expert persona
- **9 personality chat modes** including characters from popular culture
- Updated author attribution to Anubhav Gain

### Changed

- Enhanced personality modes with unique voice characteristics

---

## [1.1.0] - 2024-12-28

### Added

- **12 production-ready coding standards modes** for major programming languages:
  - Rust, Python, TypeScript, Go, Java, C#, Swift, Kotlin, C++, Scala, React
- Comprehensive coding standards with best practices and anti-patterns

---

## [1.0.0] - 2024-12-27

### Added

- Initial release of Vibe
- **Core Development Modes (23)**
  - Software Engineer Agent
  - Blueprint Mode v39
  - Rust Beast
  - API Development Specialist
  - Principal Engineer
  - Code Alchemist
  - Sacred Games Architect
  - Critical Thinking Mode
  - Code Sentinel
  - Delhi Crime Debugger
  - And more...

- **Cloud & Infrastructure Modes (10)**
  - AWS Solutions Architect
  - GCP Cloud Architect
  - Azure Solutions Expert
  - Terraform IaC Expert
  - Kubernetes Expert
  - DevOps modes

- **Programming & Database Modes (21)**
  - Language specialists: Python, Java, Go, C++, PHP, Ruby
  - Database experts: PostgreSQL, MongoDB, Redis, SQL Optimization
  - Blockchain modes: Solidity, Web3, DeFi

- **Mobile & Game Development Modes (7)**
  - iOS Swift, Android Kotlin, React Native, Flutter
  - Unity, Unreal Engine, Game Design Consultant

- **Design & UX Modes (4)**
  - Design System Architect
  - UX Researcher
  - UI Designer
  - Accessibility Designer

- **Testing & Quality Modes (5)**
  - QA Automation Expert
  - Test Automation Engineer
  - Accessibility Testing
  - Performance Testing
  - QA Specialist

- **Project Structure Templates (14)**
  - Production-ready templates for Rust, Python, Next.js, .NET, Java Spring, Go, iOS, macOS, Android, TypeScript/Node, React/Vite, Scala, C++/CMake, Browser Extensions

- **Universal Rules Engine**
  - Core rules: conversation, code-quality
  - Workflow rules: git-workflow, testing-standards
  - Security rules: security-standards
  - Language rules: TypeScript

- **Documentation**
  - Comprehensive README files
  - Universal Rules Setup Guide
  - Son of Anubhav code review instructions

---

## Version History Summary

| Version | Date       | Highlights                     |
| ------- | ---------- | ------------------------------ |
| 1.2.0   | 2024-12-28 | Personality modes, Dhurandhar  |
| 1.1.0   | 2024-12-28 | 12 coding standards modes      |
| 1.0.0   | 2024-12-27 | Initial release with 90+ modes |

---

## Contributors

- **Anubhav Gain** - Creator and maintainer

---

## Links

- [Repository](https://github.com/anubhavg-icpl/vibe)
- [Issues](https://github.com/anubhavg-icpl/vibe/issues)
- [Pull Requests](https://github.com/anubhavg-icpl/vibe/pulls)
