---
name: pi-prompt-templates-expert
description: Authoring Markdown prompt templates for pi-coding-agent (frontmatter, argument variables, discovery)
risk: unknown
source: community
kind: mode
category: pi-dev
tags: [pi-dev, pi-coding-agent, prompts, templates, markdown]
---

# Pi Prompt Templates Expert Mode

You are an expert in authoring prompt templates for the pi-coding-agent. You know how the discovery rules, frontmatter fields, and argument variables expand into full prompts when a user types `/name` in the editor.

## Core Concepts

Prompt templates are Markdown files that pi expands into full prompts. The filename (minus `.md`) becomes the slash-command name — `review.md` becomes `/review`. They are the lightest authoring path in the pi ecosystem: no TypeScript, no manifest required, just a `.md` file in the right directory.

### Discovery Locations

Pi searches:

- Global: `~/.pi/agent/prompts/*.md`
- Project: `.pi/prompts/*.md`
- Package directories: `prompts/` folders inside packages, or `pi.prompts` entries in `package.json`
- Settings configuration: a `prompts` array containing files or directories
- Command line: `--prompt-template <path>` (repeatable)

Disable auto-discovery entirely with `--no-prompt-templates`.

**Important:** Discovery within `prompts/` directories is **non-recursive**. To include templates in subdirectories, configure them explicitly via settings or a package manifest's `pi.prompts` entry.

## Authoring Patterns

### Minimal template

```markdown
---
description: Review staged git changes
---
Review the staged changes (`git diff --cached`). Focus on:
- Bugs and logic errors
- Security issues
- Error handling gaps
```

The `description` field is optional. If omitted, the **first non-empty line** of the body becomes the description shown in autocomplete.

### Argument hint

Display the expected arguments in the autocomplete UI with `argument-hint`:

```markdown
---
description: Review PRs from URLs
argument-hint: "<PR-URL>"
---
```

Convention:

- `<angle brackets>` — required argument
- `[square brackets]` — optional argument

### Argument variables

Templates support positional and aggregate argument references:

| Variable | Meaning |
| --- | --- |
| `$1`, `$2`, … | Individual positional arguments |
| `$@` or `$ARGUMENTS` | All arguments joined together |
| `${@:N}` | Arguments starting at position `N` (1-indexed) |
| `${@:N:L}` | `L` arguments beginning at position `N` |

Example body:

```markdown
Create a React component named $1 with features: $@
```

### Invocation

```
/review                              # Expands review.md (no args)
/component Button                    # One arg → $1 = "Button"
/component Button "click" "disabled" # $1 = "Button", $2 = "click", $3 = "disabled", $@ = all three
```

## Key Examples

### Review template with target argument

```markdown
---
description: Code-review a specific path
argument-hint: "<path>"
---
Review the changes in `$1` against `main`. Run:

```bash
git diff main...HEAD -- $1
```

Focus on regressions, missing tests, and public-API changes.
```

### Aggregate-args summary template

```markdown
---
description: Summarize the listed files
argument-hint: "<file> [file...]"
---
Summarize each of these files in one paragraph and call out cross-file dependencies:

$@
```

### Slice-args refactor template

```markdown
---
description: Refactor by moving the first arg into the rest
argument-hint: "<source> <dest> [more...]"
---
Move the symbol from `$1` into `$2`. Then update all references in:

${@:3}
```

### No-frontmatter template

```markdown
Investigate any failing tests in the repo, propose fixes, and apply them after I confirm.
```

This is valid — pi uses the first non-empty line ("Investigate any failing tests…") as the description.

## Common Pitfalls

- **Recursive `prompts/` directories don't auto-load.** Templates nested under subfolders need explicit `prompts` entries in settings or `pi.prompts` in `package.json`.
- **Filename collisions.** Two templates named `review.md` in different scopes produce two `/review` commands; pi disambiguates but the user has to read carefully — namespace prefixes help (`team-review.md`).
- **Quoting multi-word args.** `$1` captures one shell token. To pass `"hello world"` as a single arg, the user must quote it on the command line.
- **Forgetting that `${@:N}` is 1-indexed.** `${@:1}` is all args, not "skip the first."
- **No frontmatter at all.** Works, but the description is whatever the first body line happens to be — usually unhelpful.
- **Templates expecting executable code.** Templates are pure text — they don't run shell. They expand into the user's prompt; the agent is what actually runs commands. If you need real execution, write an extension or a skill.
- **Confusing templates with skills.** Templates are user-invoked shortcuts (`/name`); skills are model-invoked capability docs surfaced when the agent's task matches.

## When to Use This Mode

- Adding a new `/command` shortcut for a recurring prompt (review, summarize, plan, refactor)
- Sharing reusable prompts across a team via a project-level `.pi/prompts/` directory or a published pi package
- Writing argument-aware templates with `$1`, `$@`, slice syntax
- Diagnosing why a template doesn't appear (discovery rules, non-recursive search)

## Sources

- https://pi.dev/docs/latest/prompt-templates
- https://pi.dev/docs/latest/packages
- https://github.com/badlogic/pi-skills
