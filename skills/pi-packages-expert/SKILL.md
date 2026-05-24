---
name: pi-packages-expert
description: Authoring, publishing, installing, and filtering pi-coding-agent packages (npm, git, local)
risk: unknown
source: community
kind: mode
category: pi-dev
tags: [pi-dev, pi-coding-agent, packages, npm, distribution]
---

# Pi Packages Expert Mode

You are an expert in the pi package system. You author packages that bundle extensions, skills, prompt templates, and themes; you know the manifest format, the install/update/list commands, the source-spec syntax for npm/git/local, the filtering DSL in settings, and the security model.

## Core Concepts

Pi packages bundle four kinds of resources for sharing:

- **extensions** — TypeScript modules (see Pi Extensions Expert)
- **skills** — Markdown `SKILL.md` capability docs (see Pi Skill Author Expert)
- **prompts** — Markdown templates with frontmatter (see Pi Prompt Templates Expert)
- **themes** — JSON theme files

Resources are declared either explicitly via the `pi` key in `package.json`, or auto-discovered from convention directories.

## Installing & Managing Packages

### Commands

```bash
pi install npm:@foo/bar@1.0.0
pi install git:github.com/user/repo@v1
pi install https://github.com/user/repo
pi install /absolute/path/to/package
pi install ./relative/path/to/package

pi remove npm:@foo/bar
pi list
pi update                       # update all
pi update --extensions          # update extension packages only
pi update --self                # update pi itself
pi update --self --force
pi update npm:@foo/bar          # update one
```

`-l` writes to project settings (`.pi/settings.json`) instead of global (`~/.pi/agent/settings.json`).

Temporary install for testing:

```bash
pi -e npm:@foo/bar
pi -e git:github.com/user/repo
```

### Source Spec Formats

**npm**

```
npm:@scope/pkg@1.2.3
npm:pkg
```

- Versioned specs are pinned and skip `pi update`
- Global → `npm install -g`; project → installed under `.pi/npm/`
- Pin npm itself via settings: `{ "npmCommand": ["mise", "exec", "node@20", "--", "npm"] }`

**git**

```
git:github.com/user/repo@v1
git:git@github.com:user/repo@v1
https://github.com/user/repo@v1
ssh://git@github.com/user/repo@v1
```

- Without `git:` prefix, only protocol URLs accepted
- HTTPS and SSH both supported; SSH uses configured keys automatically
- For non-interactive: `GIT_TERMINAL_PROMPT=0` and `GIT_SSH_COMMAND`
- Refs (tags/branches/SHAs) pin the package
- Global clones → `~/.pi/agent/git/<host>/<path>`; project clones → `.pi/git/<host>/<path>`
- Runs `npm install` automatically if a `package.json` exists

**Local paths**

```
/absolute/path/to/package
./relative/path/to/package
```

Paths are added to settings without copying. Relative paths resolve against the settings file location. A file loads as a single extension; a directory loads using the package rules.

## Authoring Patterns

### Manifest in `package.json`

```json
{
  "name": "my-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

The `pi-package` keyword makes the package discoverable in the gallery. Paths are relative to the package root and support globs and `!exclusions`.

### Gallery metadata

```json
{
  "name": "my-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "video": "https://example.com/demo.mp4",
    "image": "https://example.com/screenshot.png"
  }
}
```

- `video`: MP4 only; autoplays on hover (desktop)
- `image`: PNG, JPEG, GIF, or WebP — static preview
- Video wins if both are set

### Convention Directories (Auto-Discovery)

Without a `pi` manifest, pi auto-loads from:

| Directory | What it picks up |
| --- | --- |
| `extensions/` | `.ts` and `.js` files |
| `skills/` | recursively finds `SKILL.md` folders + top-level `.md` files |
| `prompts/` | `.md` files (non-recursive) |
| `themes/` | `.json` files |

### Dependencies

Third-party runtime deps go in `dependencies`. **Core packages must NOT be bundled** — list them in `peerDependencies` with `"*"`:

- `@mariozechner/pi-ai`
- `@mariozechner/pi-agent-core`
- `@mariozechner/pi-coding-agent`
- `@mariozechner/pi-tui`
- `typebox`

Other pi packages **must** be bundled:

```json
{
  "dependencies": { "shitty-extensions": "^1.0.1" },
  "bundledDependencies": ["shitty-extensions"],
  "pi": {
    "extensions": ["extensions", "node_modules/shitty-extensions/extensions"],
    "skills":     ["skills",     "node_modules/shitty-extensions/skills"]
  }
}
```

## Filtering Packages

Use object form in settings to narrow what loads:

```json
{
  "packages": [
    "npm:simple-pkg",
    {
      "source": "npm:my-package",
      "extensions": ["extensions/*.ts", "!extensions/legacy.ts"],
      "skills": [],
      "prompts": ["prompts/review.md"],
      "themes": ["+themes/legacy.json"]
    }
  ]
}
```

Filter syntax:

- Omit a key → load all of that resource type
- `[]` → load none
- `!pattern` → exclude matches
- `+path` → force-include exact paths (override an exclude)
- `-path` → force-exclude exact paths
- Filters **narrow** what the manifest allows (cannot expand it)

### Enable/Disable Resources

Use `pi config` to toggle individual installed-package resources at global or project scope.

## Scope & Deduplication

Project entries beat global entries when both reference the same package. Identity:

- **npm** — package name
- **git** — repo URL (without ref)
- **local** — resolved absolute path

## Key Examples

A real user-shared collection: `https://github.com/badlogic/pi-skills`. It is structured for multiple agents (pi-coding-agent, Codex CLI, Amp, Droid, Claude Code) — see Pi Coding Agent Expert mode for the install paths each uses.

For a project-level skill set (no npm publishing needed):

```bash
git clone https://github.com/badlogic/pi-skills .pi/skills/pi-skills
```

For a published package:

```bash
pi install npm:@your-scope/your-pi-pack@1.0.0
pi list
pi update @your-scope/your-pi-pack
```

## Common Pitfalls

- **Bundling core packages.** Putting `@mariozechner/pi-coding-agent` in `dependencies` instead of `peerDependencies` causes version skew and double-loaded singletons. Always declare as peers.
- **Forgetting to bundle other pi packages.** Non-core pi packages your package depends on must be in `bundledDependencies` and explicitly referenced in `pi.extensions` / `pi.skills` paths.
- **Skipping the `pi-package` keyword.** Without it, your package won't show in the gallery.
- **Recursive `prompts/` expectations.** `prompts/` is non-recursive in auto-discovery. Use a manifest with explicit paths if you need subfolders.
- **Filter expanding the manifest.** Filters can only narrow — listing a path the manifest excludes won't make it load.
- **Treating local paths as copies.** `pi install ./local-pkg` adds the path to settings; edits in place affect runtime. That's a feature for development, a footgun for "release builds."
- **Version-pinned npm packages don't update.** `pi update` skips them by design. Bump the spec or remove the version pin.
- **Trusting unaudited packages.** Pi packages run with full system access. Extensions execute arbitrary code, and skills can instruct the model to perform any action, including running executables. Review source before installing.

## When to Use This Mode

- Publishing or consuming pi packages (npm, git, local)
- Writing the `package.json` `pi` manifest with the right peer/bundled deps
- Setting up filters to selectively enable subsets of a large package
- Diagnosing install/update issues, scope precedence, or deduplication
- Reviewing third-party packages for security before install

## Sources

- https://pi.dev/docs/latest/packages
- https://pi.dev/docs/latest/extensions
- https://pi.dev/docs/latest/prompt-templates
- https://github.com/badlogic/pi-skills
