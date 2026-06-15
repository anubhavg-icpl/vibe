# System Prompts (Reference Collection)

Raw, leaked/extracted **system prompts** from production AI assistants, kept as
read-only reference material. These are *not* VIBE modes/skills — they have no
frontmatter and are not indexed by `assets-index.json`. They live here purely so
you can study how shipping assistants are actually instructed.

> Distinct from the repo's [`prompts/`](../prompts) directory, which holds
> VIBE's own frontmatter'd prompt-engineering helpers.

## Layout

```
system-prompts/
  Anthropic/   OpenAI/   Google/   Meta/   Microsoft/   Mistral/
  Notion/   Perplexity/   Qwen/   xAI/   Cursor/   Misc/
    └─ raw vendor system prompts, organized by source
  Piebald-ClaudeCode/
    ├─ prompts/        versioned Claude Code system + agent + tool prompts
    ├─ CHANGELOG.md
    └─ updatePrompts.js
  UPSTREAM-asgeirtj-README.md   original README from the leaks source
  LICENSE                        license from the leaks source
```

- **Vendor folders** (Anthropic, OpenAI, …) — general AI-chatbot system prompt
  leaks across many products and model versions.
- **Piebald-ClaudeCode/** — a focused, version-tracked archive of Claude Code's
  own system, agent, and tool prompts.

## Sources & Attribution

| Source | Repo | Scope |
|--------|------|-------|
| asgeirtj/system_prompts_leaks | https://github.com/asgeirtj/system_prompts_leaks | Multi-vendor chatbot system prompt leaks |
| Piebald-AI/claude-code-system-prompts | https://github.com/Piebald-AI/claude-code-system-prompts | Claude Code system prompts (versioned) |

All credit to the original maintainers and contributors. Content reproduced here
for research/reference. See each upstream repo for licensing — `LICENSE` in this
directory is from the first source.

## Usage

Reference only. Read them to understand instruction patterns, tool definitions,
safety framing, and how vendors version their prompts. Do not treat any file as
official or current — system prompts change frequently.
