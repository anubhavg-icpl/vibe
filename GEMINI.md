# Vibe — Gemini CLI Context

You have access to the **Vibe library**: 853 chat modes, 5341 reusable skills, 216 subagents, 127 slash commands, and 111 universal rules.

## Discovery

- Skills live under `skills/<name>/SKILL.md`.
- Skill triggers belong in `description` or `metadata.when_to_use`.
- Agents live under `agents/<category>/*.md`.
- Slash commands live under `commands/<category>/*.md`.
- Modes (chat-mode prompts) live under `modes/<category>/*.md`.

## Workflow

When a user starts a task:

1. Match the task against each Skill description and trigger metadata.
2. For multi-step engineering work, prefer the meta-skills: `brainstorming` -> `writing-plans` -> `subagent-driven-development` -> `test-driven-development` -> `verification-before-completion` -> `requesting-code-review` -> `finishing-a-development-branch`.
3. Cite skill names in your response so the user can navigate the library.

## Scope

Vibe is provider-neutral and ships across Claude Code, Codex, Cursor, OpenCode, Gemini CLI, GitHub Copilot CLI, and Factory Droid. Treat skills as the single source of truth — file paths above are stable across all harnesses.

Source: https://github.com/anubhavg-icpl/vibe
