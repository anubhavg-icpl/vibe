# Engineer Personas

Vibe modes that emulate the engineering style, opinions, and design instincts of well-known software engineers. Each mode is grounded in the engineer's actual public writing, talks, and code — no invented quotes, no hallucinated opinions. Where a stance could not be verified from a real source, it was omitted.

Use these when you want Claude to think and respond in the spirit of a particular practitioner — to push back on a design the way they would, to recommend the tools they would, and to apply the heuristics they have publicly defended.

## Personas

| Mode | Engineer | Defining Style |
|---|---|---|
| `dhh-style-mode.md` | David Heinemeier Hansson | Majestic monoliths, Rails, contrarian convictions |
| `carmack-style-mode.md` | John Carmack | Performance-first, inline what's called once, minimize area-under-ifs |
| `torvalds-style-mode.md` | Linus Torvalds | Taste, no special cases, brutal directness, "show me the code" |
| `muratori-style-mode.md` | Casey Muratori | Anti-OOP-by-default, data-oriented design, "Clean Code Horrible Performance" |
| `mitchell-hashimoto-style-mode.md` | Mitchell Hashimoto | Infra-as-code, single static binaries, terminal craft, Zig |
| `antirez-style-mode.md` | Salvatore Sanfilippo | Single-author C, simplicity through small POCs, comments matter |
| `fabrice-bellard-style-mode.md` | Fabrice Bellard | Solo author of FFmpeg/QEMU/QuickJS; small, fast, complete |
| `rich-hickey-style-mode.md` | Rich Hickey | Simple ≠ Easy, hammock-driven design, decomplecting, immutability |
| `kernighan-style-mode.md` | Brian Kernighan | Unix philosophy, small composable tools, clarity over cleverness |
| `rob-pike-style-mode.md` | Rob Pike | "Less is exponentially more," composition over inheritance, Go pragmatism |
| `cantrill-style-mode.md` | Bryan Cantrill | DTrace-grade observability, Rust at Oxide, toolmaking as craft |
| `hillel-wayne-style-mode.md` | Hillel Wayne | Formal methods, TLA+, "an hour of modeling beats days of tests" |
| `aphyr-style-mode.md` | Kyle Kingsbury | Jepsen, distributed-systems testing, vendor claims meet network partitions |
| `gergely-orosz-style-mode.md` | Gergely Orosz | Pragmatic Engineer; sourced reporting on Big Tech engineering, scaling teams |
| `simon-willison-style-mode.md` | Simon Willison | Datasette, LLM CLI, plugins, building in public, daily practical AI |
| `tj-holowaychuk-style-mode.md` | TJ Holowaychuk | Express/Koa, minimal cores, prolific small modules |
| `dan-abramov-style-mode.md` | Dan Abramov | React, RSC, "Just JavaScript," teach the mental model |
| `steve-yegge-style-mode.md` | Steve Yegge | Long-form essays, polyglot generalist, Kingdom of Nouns |
| `martin-kleppmann-style-mode.md` | Martin Kleppmann | Designing Data-Intensive Applications, CRDTs, local-first software |

## How each mode is built

Every mode follows the same structure:

1. **Persona Intro** — who the engineer is and why they're known
2. **Core Beliefs** — 5–10 stances grounded in their actual public writing, with inline source URLs
3. **Characteristic Patterns** — the design moves, code style, and decisions they consistently push
4. **What This Mode Will Do** — the kinds of recommendations and pushback Claude will produce in this mode
5. **What This Mode Will NOT Do** — the things this engineer would object to or refuse
6. **Voice** — how they communicate
7. **Sources** — the URLs that were actually fetched/searched to ground the persona

## Usage

Activate one of these modes when you want a specific opinionated voice on a design question:

- *"DHH mode: are we sure we need to split this into services?"*
- *"Carmack mode: review this game-loop code."*
- *"Hillel Wayne mode: should we model this protocol in TLA+ first?"*
- *"Aphyr mode: how do I test this distributed counter under partition?"*

Combine modes for a panel review:

- *"Get DHH, Carmack, and Rich Hickey to weigh in on this architecture."*

## A note on accuracy

These modes are **approximations of public engineering style**, not impersonations of the people themselves. Engineers change their minds — Carmack on functional programming, Dan Abramov on hooks/RSC, DHH on the cloud — and these documents capture a snapshot. When in doubt, go read the original sources cited at the bottom of each mode.

No mode invents quotes. Where a phrasing appears in quotes, it is paraphrased from one of the cited sources or is a documented direct quote from that source.
