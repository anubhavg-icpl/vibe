---
title: Mythos Eval-Design Modes
description: Cyber-eval design methodology modes that close the AISI 2026 paper's §5 limitations — honest claims, benchmark portfolios, sandboxing, defender-aware scoring, and the operator-with-AI threat model
author: vibe (mythos-inspired, AISI eval-design)
tags: [mythos, ai-eval, eval-design, ai-safety, aisi, defensive]
---

# Mythos Eval-Design Modes

Eval-design modes for AI safety researchers, frontier-model evaluators, blue-teamers building defender-aware ranges, and policy reviewers turning eval numbers into capability claims. These seven modes close the **remaining gaps** flagged in the AISI March 2026 paper [*Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios* (arXiv:2603.11214v3)](https://arxiv.org/abs/2603.11214v3) — gaps that the existing `agent-eval/` siblings deliberately did not cover so the eval-design layer could stay focused.

The audience is the same as `agent-eval/`: AI safety researchers, AISI-style evaluators, frontier-model red-teamers, and Project Glasswing-tier eval authors. **These modes design the measurement, not the attack.** They are the upstream methodology for the contained-range work in `cyber-range/` and `ics-range/`, and the policy-review wrapper around the harness work in `agent-eval/`.

## Mode Index

| # | Mode | What it does | Closes AISI gap |
|---|------|--------------|-----------------|
| 1 | [mythos-eval-limitations-framework](./mythos-eval-limitations-framework-mode.md) | Use the §5 limitations as a positive checklist for honest, lower-bound capability claims. | Overclaim/underclaim by omission of context. |
| 2 | [mythos-cyber-bench-survey](./mythos-cyber-bench-survey-mode.md) | Per-benchmark capability table, saturation curves, decision matrix across NYU CTF / InterCode-CTF / Cybench / CyberSecEval / AISI ranges. | Single-benchmark claims without triangulation. |
| 3 | [mythos-human-ai-teaming-threat](./mythos-human-ai-teaming-threat-mode.md) | The §5 closing threat model — operator-with-AI uplift methodology, bottleneck-intervention cases (M5 NTLM relay, M7-M8 CI/CD), teaming-aware eval design. | "No human-AI teaming" — the most operationally-relevant threat model. |
| 4 | [mythos-inspect-sandboxing-toolkit](./mythos-inspect-sandboxing-toolkit-mode.md) | The AISI Inspect Sandboxing Toolkit — Docker / Kubernetes / Proxmox plugins, three-axis isolation (tooling / host / network), `SandboxEnvironmentSpec` integration, escape-bench pairing. | Sandboxing as an unloved second-class concern in eval design. |
| 5 | [mythos-mythic-c2-detection](./mythos-mythic-c2-detection-mode.md) | **Defensive-only** identification of Mythic C2 (the framework AISI agents use in §3.3) — agent families, callback patterns, Sigma / Suricata / Zeek / KQL hunt skeletons. | Defenders who don't know what their own range telemetry should look for. |
| 6 | [mythos-active-defender-eval](./mythos-active-defender-eval-mode.md) | The §6 future-work item — adding active defenders, EDR + simulated SOC analyst loop, alert-volume penalty, evasion-success scoring, real Inspect AI scorer code. | "No active defenders" + "detections not penalised." |
| 7 | [mythos-ctf-vs-range-framing](./mythos-ctf-vs-range-framing-mode.md) | When CTFs measure the right thing vs when ranges do — failure-mode taxonomy (the high-CTF / low-range quadrant is where 2026 frontier sits) + capability-portfolio guidance. | Single-format cyber claims without chained-autonomy triangulation. |

## How These Compose With Sibling Mythos Categories

This `eval-design/` layer sits **upstream** of harness work and **downstream** of capability questions. It is the methodology layer for the rest of the mythos cyber stack.

```text
               POLICY / GOVERNANCE LAYER
   ┌───────────────────────────────────────────────────┐
   │  mythos-eval-limitations-framework                │  ◄── how to phrase the claim
   │  mythos-ctf-vs-range-framing                      │  ◄── what to include in the portfolio
   │  mythos-cyber-bench-survey                        │  ◄── which benchmarks exist
   │  mythos-human-ai-teaming-threat                   │  ◄── which threat model to name
   └─────────────────────┬─────────────────────────────┘
                         │ design decisions feed
                         ▼
              EVAL-DESIGN / MEASUREMENT LAYER
   ┌───────────────────────────────────────────────────┐
   │  mythos-active-defender-eval                      │  ◄── adds defender VMs + scorer penalty
   │  mythos-mythic-c2-detection (defensive)           │  ◄── feeds detection content into scorer
   │  mythos-inspect-sandboxing-toolkit                │  ◄── isolates the agent under test
   └─────────────────────┬─────────────────────────────┘
                         │ harness wiring feeds
                         ▼
                 AGENT-EVAL HARNESS LAYER
   ┌───────────────────────────────────────────────────┐
   │  agent-eval/mythos-inspect-ai-harness             │  ◄── Task / Solver / Scorer
   │  agent-eval/mythos-cyber-range-designer           │  ◄── milestone graph + side-channel ledger
   │  agent-eval/mythos-inference-scaling-eval         │  ◄── 10M → 1B token sweeps
   │  agent-eval/mythos-token-efficiency-vs-depth      │  ◄── two-axis decomposition
   │  agent-eval/mythos-context-compaction-eval        │  ◄── compaction fidelity
   │  agent-eval/mythos-opsec-alert-scoring            │  ◄── completed-loud vs completed-stealthy
   │  agent-eval/mythos-behavioral-analysis            │  ◄── post-hoc transcript analysis
   │  agent-eval/mythos-cyber-eval-disclosure          │  ◄── safety wrapper around all results
   └─────────────────────┬─────────────────────────────┘
                         │ ranges instantiate
                         ▼
                  RANGE INSTANCES
   ┌───────────────────────────────────────────────────┐
   │  cyber-range/  (9 milestones for "The Last Ones") │
   │  ics-range/    (7 steps for "Cooling Tower")      │
   └───────────────────────────────────────────────────┘

           OFFENSIVE / DEFENSIVE OPERATIONAL LAYER
   ┌───────────────────────────────────────────────────┐
   │  discovery/  offense/  defense/  specialty/       │  ◄── operator-side modes (in-scope only)
   └───────────────────────────────────────────────────┘
```

### Composition patterns

- **"Build a defender-aware range from scratch."** Start with `mythos-inspect-sandboxing-toolkit-mode` (sandbox tier) → `agent-eval/mythos-cyber-range-designer-mode` (milestone graph) → `mythos-active-defender-eval-mode` (defender layer + scorer) → `mythos-mythic-c2-detection-mode` (detection content) → `agent-eval/mythos-inspect-ai-harness-mode` (Task / Solver wiring).
- **"Publish frontier-model cyber capability numbers."** Start with `mythos-ctf-vs-range-framing-mode` (portfolio decision) → `mythos-cyber-bench-survey-mode` (benchmark choice) → run the harness → `mythos-eval-limitations-framework-mode` (claim phrasing) → `agent-eval/mythos-cyber-eval-disclosure-mode` (publication).
- **"Measure operator-with-AI uplift."** `mythos-human-ai-teaming-threat-mode` (study design) → `agent-eval/mythos-cyber-range-designer-mode` (the same range across arms) → `agent-eval/mythos-behavioral-analysis-mode` (per-arm transcript analysis) → `mythos-eval-limitations-framework-mode` (claim phrasing) → `agent-eval/mythos-cyber-eval-disclosure-mode`.
- **"Audit a colleague's eval report."** `mythos-eval-limitations-framework-mode` → `mythos-ctf-vs-range-framing-mode` → `mythos-cyber-bench-survey-mode` → cross-check against `mythos-human-ai-teaming-threat-mode` for missing threat-model framing.

### Relationship to operational mythos categories

`discovery/`, `offense/`, `defense/`, `specialty/` are operator-side modes for in-scope authorised engagements. The `eval-design/` layer is **about measuring** what those operator modes (and AI agents emulating them) can do — under what scaffolding, with what defenders, against what threat model. The eval-design modes do not invoke offensive operator modes; they design the contained ranges in which those capabilities are safely measured.

## Defensive Framing — Common Across All Seven Modes

Every mode in this directory carries the same disclaimer and operating constraints:

- **Dual-use disclaimer.** "Mythos-class capabilities used here are dual-use; this mode operates under coordinated-disclosure and authorized-engagement principles only."
- **Authorisation gate** on modes 3, 5, 6 with the verbatim refusal: "I refuse to operate on systems I am not authorized to test."
- **Coordinated disclosure handoff** — every result drafted through these modes passes through `agent-eval/mythos-cyber-eval-disclosure-mode` before publication.
- **Lower-bound framing** — every capability claim is a lower bound on a contained range, never a ceiling on operator-with-AI threat.
- **AISI methodology fidelity** — APIs (`SandboxEnvironmentSpec`, `@scorer`, `react()`), Sigma / KQL skeletons, and benchmark citations are real and verifiable; no invented APIs, fabricated paper claims, or invented CVEs.

## Sources Common To This Directory

- [Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios — arXiv:2603.11214v3](https://arxiv.org/abs/2603.11214v3) — the seed paper
- [How do frontier AI agents perform in multi-step cyber-attack scenarios? — AISI blog, Mar 16 2026](https://aisi.gov.uk/blog/how-do-frontier-ai-agents-perform-in-multi-step-cyber-attack-scenarios)
- [Inspect Cyber: A New Standard for Agentic Cyber Evaluations — AISI blog, Jun 26 2025](https://aisi.gov.uk/blog/inspect-cyber)
- [The Inspect sandboxing toolkit — AISI blog, Aug 7 2025](https://aisi.gov.uk/blog/the-inspect-sandboxing-toolkit-scalable-and-secure-ai-agent-evaluations)
- [Inspect AI — UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai)
- [Inspect Sandboxing Toolkit — UKGovernmentBEIS/aisi-sandboxing](https://github.com/UKGovernmentBEIS/aisi-sandboxing)
- [Cybench — arXiv:2408.08926](https://arxiv.org/abs/2408.08926) and [cybench.github.io](https://cybench.github.io/)
- [NYU CTF Bench — arXiv:2406.05590](https://arxiv.org/abs/2406.05590)
- [Purple Llama CyberSecEval — arXiv:2312.04724](https://arxiv.org/abs/2312.04724)
- [Mythic — github.com/its-a-feature/Mythic](https://github.com/its-a-feature/Mythic)
- [MITRE ATT&CK](https://attack.mitre.org/)
- [SigmaHQ/sigma](https://github.com/SigmaHQ/sigma)
- [Anthropic Responsible Scaling Policy](https://www.anthropic.com/responsible-scaling-policy)
- [OpenAI Preparedness Framework](https://openai.com/safety/preparedness/)
