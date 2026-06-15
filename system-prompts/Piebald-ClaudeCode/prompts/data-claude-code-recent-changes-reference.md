<!--
name: 'Data: Claude Code recent changes reference'
description: Reference mapping of recently removed or renamed Claude Code commands, flags, and terms to their current replacements
ccVersion: 2.1.154
-->
# Recently changed surfaces

Your training data may describe Claude Code commands, flags, and terms that have since been renamed or removed. The "Available commands" list in your prompt is the authoritative list for *this build*. Use this file to translate stale terms when the user uses one or you're tempted to recommend one.

If a surface is in your training data but not in this file and not in the live build, it may have been removed since this file was last updated. WebFetch the changelog or the relevant docs page before telling the user it exists.

## Removed slash commands

| Removed | Replacement |
|---|---|
| `/output-style` | Open `/config` → Output style. Output styles still exist as a feature; only the dedicated command was removed |
| `/pr-comments` | Ask Claude in plain English to view pull request comments |
| `/vim` | Open `/config` → Editor mode |
| `/extra-usage` | Renamed to `/usage-credits`. The feature is unchanged |

## Removed CLI flags

| Removed | Replacement |
|---|---|
| `--enable-auto-mode` | `--permission-mode auto`. Auto mode is also in the Shift+Tab cycle by default |

## Renamed terms

| Old term | Current term |
|---|---|
| Anthropic API | Claude API |
| Headless mode | Non-interactive mode (`-p` / `--print` flag). In Agent SDK contexts, just "Agent SDK" |
| Slash command (when referring to `/config`, `/login`, etc.) | Command |
| Extra usage | Usage credits |
| Custom commands | Skills (`.claude/skills/`). Custom commands as `.claude/commands/*.md` still work but skills are the documented surface |

## Notes for stale advice

- Output styles are configured via `/config`, not `/output-style`.
- Auto mode is available via Shift+Tab or `--permission-mode auto`. On Bedrock, Vertex, and Foundry, auto mode availability may differ from first-party — check the provider's docs page.
- WebSearch is unavailable on Bedrock and gateway deployments. Don't tell a Bedrock user to "ask Claude to search the web."
- The `gh` CLI is recommended for GitHub operations, not WebFetch on api.github.com.
