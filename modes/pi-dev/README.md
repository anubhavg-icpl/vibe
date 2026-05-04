# pi-dev modes

Vibe modes for the pi-coding-agent ecosystem (`pi.dev`) by badlogic / Mario Zechner.
Sourced from the official pi.dev docs and the cross-tool `pi-skills` repo.

## Modes

| File | Focus |
| --- | --- |
| [pi-extensions-expert-mode.md](pi-extensions-expert-mode.md) | TypeScript extensions: lifecycle hooks, custom tools, UI, providers, full `ExtensionAPI`/`ExtensionContext` surface |
| [pi-prompt-templates-expert-mode.md](pi-prompt-templates-expert-mode.md) | Markdown `/command` templates: frontmatter, argument variables (`$1`, `$@`, `${@:N:L}`), discovery rules |
| [pi-packages-expert-mode.md](pi-packages-expert-mode.md) | Packaging extensions/skills/prompts/themes: `package.json` `pi` manifest, npm/git/local installs, filtering DSL, peer-dep rules |
| [pi-coding-agent-expert-mode.md](pi-coding-agent-expert-mode.md) | Pi-coding-agent overall: cross-tool skill format for Claude Code, Codex CLI, Amp, Droid, install paths per agent |
| [pi-skill-author-expert-mode.md](pi-skill-author-expert-mode.md) | Authoring portable `SKILL.md` capability docs with `{baseDir}/` helpers and setup walkthroughs |

## Sources

- https://pi.dev/docs/latest/extensions
- https://pi.dev/docs/latest/prompt-templates
- https://pi.dev/docs/latest/packages
- https://github.com/badlogic/pi-skills
- https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent
