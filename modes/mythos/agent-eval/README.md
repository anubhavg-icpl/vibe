---
title: Mythos Agent Eval Modes
description: AI agent evaluation methodology modes inspired by AISI's "Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios" (arXiv:2603.11214v3)
author: vibe (mythos-inspired, AISI eval methodology)
tags: [mythos, ai-eval, frontier-model, ai-safety, aisi, glasswing, defensive]
---

# Mythos Agent Eval Modes

Evaluation-engineering modes for measuring autonomous AI agents on multi-step cyber-attack scenarios. These modes are modeled on the methodology of UK AISI's March 2026 paper [**"Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios"** (arXiv:2603.11214v3)](https://arxiv.org/abs/2603.11214v3) and the surrounding AISI eval program — including the **Inspect AI** framework, the **Inspect Sandboxing Toolkit**, and the public AISI cyber-eval blog series.

The audience is AI safety researchers, frontier-model red-teamers, eval-framework authors, and Project Glasswing / AISI-style evaluators. **These modes measure capability so we can govern it**; they are not attacker uplift. The disclosure mode is the safety wrapper around all the others.

## Mode Index

| # | Mode | What it does |
|---|------|--------------|
| 1 | [mythos-cyber-range-designer](./mythos-cyber-range-designer-mode.md) | Design multi-step, milestone-graded cyber ranges modeled on AISI's "The Last Ones" (32-step corp) and "Cooling Tower" (7-step ICS). |
| 2 | [mythos-inference-scaling-eval](./mythos-inference-scaling-eval-mode.md) | Token-budget sweeps (10M → 1B) measuring log-linear inference-time compute scaling, replicating the paper's no-plateau finding. |
| 3 | [mythos-token-efficiency-vs-depth](./mythos-token-efficiency-vs-depth-mode.md) | Two-axis capability decomposition: token-efficiency (progress/token) vs capability depth (specialist-knowledge clearance). |
| 4 | [mythos-inspect-ai-harness](./mythos-inspect-ai-harness-mode.md) | Build evaluations on the real Inspect AI API — `@task`, `react()`, `SandboxEnvironmentSpec`, custom `@scorer`. |
| 5 | [mythos-context-compaction-eval](./mythos-context-compaction-eval-mode.md) | Audit Anthropic's `compact_20260112` context compaction — fidelity, credential survival, paired on/off comparisons. |
| 6 | [mythos-opsec-alert-scoring](./mythos-opsec-alert-scoring-mode.md) | OPSEC vector via Elastic Defend / Wazuh / Falco — completed loudly vs. completed stealthily. |
| 7 | [mythos-behavioral-analysis](./mythos-behavioral-analysis-mode.md) | Automated transcript analysis — unique services, exploit/exploration ratio, credential reuse, loops, cost-per-milestone. |
| 8 | [mythos-cyber-eval-disclosure](./mythos-cyber-eval-disclosure-mode.md) | Responsible disclosure norms: methodology without exploit recipes, hash-then-reveal, developer + government coordination. |

## How These Compose

```text
        ┌────────────────────────────────────────┐
        │ mythos-cyber-eval-disclosure           │  ◄── safety wrapper for all results
        └─────────────────┬──────────────────────┘
                          │
        ┌─────────────────┴──────────────────────┐
        │ mythos-inspect-ai-harness              │  ◄── the eval-runner backbone
        └─┬───────────────┬──────────────────┬───┘
          │               │                  │
          ▼               ▼                  ▼
 ┌──────────────────┐ ┌──────────────────┐ ┌────────────────────┐
 │ mythos-cyber-    │ │ mythos-inference-│ │ mythos-context-    │
 │ range-designer   │ │ scaling-eval     │ │ compaction-eval    │
 └─────┬────────────┘ └────────┬─────────┘ └──────────┬─────────┘
       │                       │                      │
       │              ┌────────┴──────────────┐       │
       │              ▼                       ▼       ▼
       │  ┌─────────────────────────┐ ┌──────────────────────┐
       │  │ mythos-token-efficiency-│ │ mythos-behavioral-   │
       │  │ vs-depth                │ │ analysis             │
       │  └─────────────────────────┘ └──────────────────────┘
       │              │                       │
       └──────────────┴───────────────────────┘
                      │
                      ▼
         ┌──────────────────────────────┐
         │ mythos-opsec-alert-scoring   │  ◄── instrumented EDR side-channel
         └──────────────────────────────┘
```

Typical sequence:

1. **Range design** (`mythos-cyber-range-designer`) — sketch a 7-32 milestone range with public-knowledge vulns, side-channel flag scanner, instrumented hosts.
2. **Range build** — using `mythos-cyber-range/` (corp/AD/CI/CD) and `mythos-ics-range/` (OT subrange) modes from the parent `mythos/` directory for the actual VM/topology craft.
3. **Harness wiring** (`mythos-inspect-ai-harness`) — Inspect AI task with `react()` agent + Bash/Python tools + Sandboxing Toolkit Docker/k8s/Proxmox plugin.
4. **Compaction policy** (`mythos-context-compaction-eval`) — decide on/off, default 150K trigger, paired audit.
5. **Sweep** (`mythos-inference-scaling-eval`) — token budgets 1M → 1B, ≥5 seeds per cell, log-linear regression.
6. **Decompose** (`mythos-token-efficiency-vs-depth`) — separate "fast but shallow" from "slow but deep" capability profiles.
7. **Behavioral pass** (`mythos-behavioral-analysis`) — services, exploits, creds, loops on every transcript.
8. **OPSEC pass** (`mythos-opsec-alert-scoring`) — Elastic vectors per (model, budget, range).
9. **Disclosure** (`mythos-cyber-eval-disclosure`) — gate every artifact, ≥30-day developer notification, lower-bound caveat in every headline.

## How These Compose with Other mythos/ Categories

- **`mythos/cyber-range/`** — provides the actual range-construction craft (AD topology, DMZ, VPN, web tier). The agent-eval modes design *what* the range should contain; the cyber-range modes build it.
- **`mythos/ics-range/`** — for the OT subrange (Modbus, ladder logic, OT/IT bridge). The Cooling Tower scenario is built using these modes.
- **`mythos/offense/`** — the *capabilities being measured*. Models are scored against their ability to perform the techniques those modes describe (without a human red-teamer in the loop).
- **`mythos/defense/`** — the perspective of `mythos-opsec-alert-scoring`: detection rules, EDR coverage, SOC prioritization come from this directory's craft.
- **`mythos/discovery/`** — `mythos-zero-day-hunter` is the canonical out-of-the-box vulnerability research mode; if an eval run *discovers* a novel exploit in a planted vuln, the disclosure handoff goes through that mode's CVE process.

## Universal Constraints

Every mode in this directory enforces:

- **Methodology, not exploit recipes.** Public output is reproducible-as-eval, not reproducible-as-attack.
- **Lower-bound caveat.** Every published number carries the AISI paper's caveat — minimal scaffolding, no active defenders, elevated vuln density, public-knowledge vulns.
- **Sandboxing Toolkit isolation.** Inspect Sandboxing (Docker/k8s/Proxmox) is mandatory; never against live targets.
- **Side-channel scoring.** Milestone scanner runs in a container the agent cannot reach.
- **Paired comparisons.** Causal claims (compaction, scaffolding, model generation) require A/B runs with seeds.
- **Pre-publication review.** Every artifact passes the disclosure gate before any external surface.

## Provenance

These modes are inspired by — but not produced by — UK AISI or Anthropic. They reference public material from the AISI cyber-evals research program, the Inspect AI / Inspect Sandboxing open-source projects, the Anthropic Compaction API documentation, and the Project Glasswing partner program. They are not affiliated with or endorsed by AISI, Anthropic, or any Project Glasswing partner.

## Primary Sources

- [Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios — arXiv:2603.11214v3](https://arxiv.org/abs/2603.11214v3)
- [How do frontier AI agents perform in multi-step cyber-attack scenarios? — AISI blog, Mar 16 2026](https://aisi.gov.uk/blog/how-do-frontier-ai-agents-perform-in-multi-step-cyber-attack-scenarios)
- [Evidence for inference scaling in AI cyber tasks — AISI blog, Mar 5 2026](https://aisi.gov.uk/blog/evidence-for-inference-scaling-in-ai-cyber-tasks-increased-evaluation-budgets-reveal-higher-success-rates)
- [The Inspect Sandboxing Toolkit — AISI blog, Aug 7 2025](https://aisi.gov.uk/blog/the-inspect-sandboxing-toolkit-scalable-and-secure-ai-agent-evaluations)
- [Our evaluation of Claude Mythos Preview's cyber capabilities — AISI blog, Apr 13 2026](https://aisi.gov.uk/blog/our-evaluation-of-claude-mythos-previews-cyber-capabilities)
- [Our evaluation of OpenAI's GPT-5.5 cyber capabilities — AISI blog, Apr 30 2026](https://aisi.gov.uk/blog/our-evaluation-of-openais-gpt-5-5-cyber-capabilities)
- [Inspect AI — UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai)
- [Inspect AI documentation — inspect.aisi.org.uk](https://inspect.aisi.org.uk/)
- [Inspect Sandboxing — UKGovernmentBEIS/aisi-sandboxing](https://github.com/UKGovernmentBEIS/aisi-sandboxing)
- [Anthropic Compaction docs](https://platform.claude.com/docs/en/build-with-claude/compaction)
- [Project Glasswing — anthropic.com](https://www.anthropic.com/glasswing)
- [Claude Mythos Preview — red.anthropic.com](https://red.anthropic.com/2026/mythos-preview/)
- [AISI cyber program — aisi.gov.uk/work/cyber](https://aisi.gov.uk/work/cyber)
