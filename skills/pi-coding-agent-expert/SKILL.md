---
name: pi-coding-agent-expert
description: Using pi-coding-agent and its cross-tool skill format with Claude Code, Codex CLI, Amp, and Droid
risk: unknown
source: community
kind: mode
category: pi-dev
tags: [pi-dev, pi-coding-agent, claude-code, codex-cli, amp, droid, cross-tool]
---

# Pi Coding Agent Expert Mode

You are an expert in pi-coding-agent — the open-source TUI coding agent by badlogic (Mario Zechner) — and the cross-tool skill format it shares with Claude Code, Codex CLI, Amp, and Droid (Factory). You know how the same `SKILL.md`-based capability docs install into each tool, where each looks for them, and how the four pi resource types (extensions, skills, prompts, themes) compose at runtime.

## Core Concepts

Pi-coding-agent is a terminal coding agent built on a layered package set:

- `@mariozechner/pi-ai` — provider-neutral AI utilities
- `@mariozechner/pi-agent-core` — agent runtime
- `@mariozechner/pi-coding-agent` — the coding-agent CLI / TUI
- `@mariozechner/pi-tui` — terminal UI primitives
- `typebox` — schema for tool params

Its extensibility model has four resource types:

| Resource | What | Authored in |
| --- | --- | --- |
| Extensions | Lifecycle-hooked code | TypeScript |
| Skills | Capability docs surfaced to the model | Markdown (`SKILL.md`) |
| Prompts | User-invoked `/name` shortcuts | Markdown |
| Themes | TUI color schemes | JSON |

A `pi package` is just an npm/git module that bundles any combination of those.

### Cross-Tool Skill Compatibility

The pi-skills repo at `https://github.com/badlogic/pi-skills` is intentionally compatible with five agents. Same `SKILL.md` files, different install paths:

```bash
# pi-coding-agent (user-level)
git clone https://github.com/badlogic/pi-skills ~/.pi/agent/skills/pi-skills
# pi-coding-agent (project)
git clone https://github.com/badlogic/pi-skills .pi/skills/pi-skills

# Codex CLI
git clone https://github.com/badlogic/pi-skills ~/.codex/skills/pi-skills

# Amp (recursive in toolboxes)
git clone https://github.com/badlogic/pi-skills ~/.config/amp/tools/pi-skills

# Droid (Factory) — user
git clone https://github.com/badlogic/pi-skills ~/.factory/skills/pi-skills
# Droid (project)
git clone https://github.com/badlogic/pi-skills .factory/skills/pi-skills
```

**Claude Code** is special: it only looks one level deep for `SKILL.md`. So you clone once and symlink each skill folder:

```bash
git clone https://github.com/badlogic/pi-skills ~/pi-skills

mkdir -p ~/.claude/skills
ln -s ~/pi-skills/brave-search       ~/.claude/skills/brave-search
ln -s ~/pi-skills/browser-tools      ~/.claude/skills/browser-tools
ln -s ~/pi-skills/gccli              ~/.claude/skills/gccli
ln -s ~/pi-skills/gdcli              ~/.claude/skills/gdcli
ln -s ~/pi-skills/gmcli              ~/.claude/skills/gmcli
ln -s ~/pi-skills/transcribe         ~/.claude/skills/transcribe
ln -s ~/pi-skills/vscode             ~/.claude/skills/vscode
ln -s ~/pi-skills/youtube-transcript ~/.claude/skills/youtube-transcript
```

Project-level for Claude Code is the same with `.claude/skills/` instead.

### Skill Format (works in all five agents)

```markdown
---
name: skill-name
description: Short description shown to the agent
---

# Instructions

Detailed instructions here…
Helper files available at: {baseDir}/
```

`{baseDir}` is replaced at runtime with the skill's directory path. That's how a skill can ship adjacent helper scripts (e.g. `transcribe.sh`, `search.js`) and reference them portably from the SKILL body.

## Usage Patterns

### Selecting Resources at the Right Scope

Pi resolves resources in this order (first match wins for a given identity):

1. CLI flags (`--prompt-template`, `pi -e ...`)
2. Project settings (`.pi/settings.json`) and project directories
3. Global settings (`~/.pi/agent/settings.json`) and global directories

This means `.pi/skills/` overrides a `~/.pi/agent/skills/` of the same name.

### Mixing Pi Resources

A typical `package.json` for a pi package:

```json
{
  "name": "@me/team-pack",
  "keywords": ["pi-package"],
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-ai": "*",
    "@mariozechner/pi-tui": "*",
    "typebox": "*"
  },
  "pi": {
    "extensions": ["./extensions"],
    "skills":     ["./skills"],
    "prompts":    ["./prompts"],
    "themes":     ["./themes"]
  }
}
```

Install:

```bash
pi install npm:@me/team-pack
pi -l install npm:@me/team-pack    # project scope
```

### Driving the Agent

Common runtime controls (from extension code, but exposed via commands too):

- `pi.setModel(model)` and `ctx.modelRegistry.find(provider, modelId)`
- `pi.setThinkingLevel("off" | "minimal" | "low" | "medium" | "high" | "xhigh")`
- `pi.setActiveTools(["read", "bash"])` — gate which tools the LLM sees
- `pi.sendUserMessage("Focus on errors", { deliverAs: "steer" })`
- `ctx.compact()` and `ctx.getContextUsage()` for context management

### Multi-Agent Skill Authoring Discipline

To stay portable across pi/Codex/Amp/Droid/Claude Code:

- Frontmatter only `name` and `description` (no agent-specific fields)
- Use `{baseDir}/` for helper script paths
- Don't assume a global PATH — instruct the user to install once or `npm install` in `{baseDir}`
- Detect missing config (env vars, accounts) and tell the agent how to walk the user through setup, instead of hard-failing

## Key Examples

From the pi-skills repo (concrete cross-tool skills):

| Skill | What it does |
| --- | --- |
| `brave-search` | Web search + content extraction via Brave Search API. Ships `search.js`/`content.js`; needs `BRAVE_API_KEY` and `npm install` in `{baseDir}`. |
| `browser-tools` | Interactive browser automation via Chrome DevTools Protocol. |
| `gccli` | Google Calendar CLI (events, free/busy). Needs `npm install -g @mariozechner/gccli`. |
| `gdcli` | Google Drive CLI. |
| `gmcli` | Gmail CLI (email, drafts, labels). |
| `transcribe` | Speech-to-text via Groq Whisper; ships `transcribe.sh`; needs `GROQ_API_KEY`. |
| `vscode` | VS Code diff integration via the `code -d` CLI. |
| `youtube-transcript` | Fetch YouTube transcripts. |

Example of the `{baseDir}` pattern (from `brave-search/SKILL.md`):

```bash
{baseDir}/search.js "query" -n 10 --content
{baseDir}/content.js https://example.com/article
```

## Common Pitfalls

- **Cloning into the wrong directory for the wrong agent.** Each agent has its own skills root — see the install table above.
- **Forgetting Claude Code's depth limit.** Claude Code only sees `SKILL.md` one level under `~/.claude/skills/`. Symlink individual skill folders, don't symlink the parent repo.
- **Hard-coded helper paths.** Use `{baseDir}/` instead of `./` so the skill works regardless of cwd.
- **Skipping per-skill `npm install`.** Some skills (e.g. `brave-search`, `youtube-transcript`, `browser-tools`) need deps installed inside the skill folder.
- **Pinning core packages in `dependencies`.** Always declare `pi-coding-agent`/`pi-ai`/`pi-tui`/`typebox` as peer deps — they are singletons in the host.
- **Confusing scopes.** A project-scope install (`pi -l install ...` or `.pi/`) shadows the global version of the same package; this is intentional but confusing during debugging.
- **Treating skills as tools.** Skills don't auto-execute — they tell the agent how to use available tools (bash, read, write). They depend on the host agent having those primitives.
- **Mixing in agent-specific frontmatter.** Adds friction to cross-agent compatibility; keep it to `name` + `description`.

## When to Use This Mode

- Picking pi-coding-agent for a new workflow and wanting to know how its packages, extensions, skills, and prompts compose
- Sharing the same skill set across pi-coding-agent, Codex CLI, Amp, Droid, and Claude Code
- Resolving "skill not found" or "command not found" issues at the scope/discovery level
- Driving the agent at runtime (model swaps, thinking levels, active tools, steered messages, compaction)

## Sources

- https://pi.dev/docs/latest/extensions
- https://pi.dev/docs/latest/prompt-templates
- https://pi.dev/docs/latest/packages
- https://github.com/badlogic/pi-skills
- https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent
