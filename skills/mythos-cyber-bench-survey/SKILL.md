---
name: mythos-cyber-bench-survey
description: Survey of cyber-eval benchmarks (NYU CTF, InterCode-CTF, Cybench, CyberSecEval, AISI ranges) with saturation curves and a "what to use when" decision matrix
risk: unknown
source: community
kind: mode
category: eval-design
tags: [mythos, ai-eval, eval-design, benchmarks, ctf, saturation, defensive]
---

# Mythos Cyber Bench Survey Mode

You are the eval-author choosing a cyber benchmark. As of 2026 there are at least seven distinct families — single-step CTFs, multi-step ranges, secure-code microbenchmarks, NLP-cyber probes, and capability mappings. Most teams default to whichever was in their last paper. Your mode is to map the field, name what each benchmark actually measures, surface saturation curves, and recommend the right tool for the question you are actually asking.

> Mythos-class capabilities used here are dual-use; this mode operates under coordinated-disclosure and authorized-engagement principles only.

This mode is for evaluators, model-card authors, AI safety researchers selecting capability surveys, and policy reviewers reading capability reports.

## Core Capabilities

- Map any frontier-model cyber question to one or more existing benchmarks.
- Distinguish **single-step skill** evals (CTFs) from **multi-step chained autonomy** evals (ranges).
- Recognise saturation: a 93%-of-ceiling benchmark answers a different question than a 30%-of-ceiling one.
- Recommend benchmark portfolios — most useful claims come from triangulating across families, not single scores.
- Read AISI §4 related-work as the canonical comparison table the paper itself published.

## Per-Benchmark Capability Table

| Benchmark | Authors / Year | Format | Tasks | What it measures | 2026 saturation status |
|-----------|----------------|--------|-------|-------------------|-------------------------|
| **NYU CTF Bench** | Shao et al. 2024 (arXiv:2406.05590) | Single-step CTFs, automated workflow with external tool calls | ~200 challenges from public competitions | LLM offensive-security skill with function-calling | Mid — frontier models clear most easy tiers; medium/hard remain open |
| **InterCode-CTF** | Yang et al. 2023 / 2024 | ReAct-style coding-agent CTF environment | ~100 picoCTF tasks | Interactive coding-agent CTF skill | Low–mid — useful as scaffolding-comparison surface |
| **Cybench** | Zhang et al. 2024 (arXiv:2408.08926, ICLR 2025) | Professional CTFs with subtasks across crypto / web / rev / forensics / misc / pwn | 40 professional CTFs, 4 competitions | Single-step capture-the-flag at professional difficulty | High — top frontier models in 2026 reach the high-30s to mid-40s percent unguided; subtask-guided runs higher; the headline number is climbing fast |
| **CyberBench** | Liu et al. 2024 | NLP-cyber tasks (classification, NER, summarisation) | Multi-task NLP suite | Cyber-domain NLP, not agentic skill | High — answers a different question than the others |
| **Meta CyberSecEval** (Purple Llama) | Bhatt et al. 2023 (arXiv:2312.04724) | Insecure-code generation + cyber-attack-helpfulness probes | Multi-prompt suite | Tendency to generate insecure code; willingness to assist | Stable — ongoing v2/v3 expansions |
| **Google DeepMind cyber capability mapping** | Rodriguez et al. 2025 | Capability-taxonomy mapping over real attack chains | Taxonomy + probes | Taxonomic coverage of attacker tradecraft | n/a (taxonomy, not leaderboard) |
| **AISI ranges** (*The Last Ones*, *Cooling Tower*) | Folkerts et al. 2026 (arXiv:2603.11214v3) | Multi-step chained autonomy on sealed VM ranges | 32-step corp + 7-step ICS | Chained multi-step autonomy under minimal scaffolding | Low — best run reached 22 / 32; mean ~9.8; large headroom |

## Saturation Curve — Why CTFs Stop Answering The Right Question

Cybench top-of-leaderboard score has climbed from the high-teens range at release toward the 40-percent band on unguided runs by 2026. Single-step CTFs *concentrate* a skill into one self-contained puzzle: parse, exploit, extract flag. They are excellent **skill probes** and bad **autonomy probes**.

The AISI paper §4 explicitly contrasts this with multi-step ranges: a model can clear a CTF crypto subtask in isolation but fail to chain that same skill into M14 of *The Last Ones* because the chaining itself — keeping state, recovering from a wrong branch, recognising a sub-goal — is the bottleneck.

The empirical signal in 2026:
- **CTFs are climbing fast.** Cybench, NYU CTF and InterCode-CTF all show year-over-year gains.
- **Ranges still show large headroom.** Mean 9.8 / 32 on *The Last Ones* with best-run 22 / 32; *Cooling Tower* (7 steps) similarly leaves room.
- **Implication.** Single-step CTFs increasingly answer "can the model do this skill?" with yes; multi-step ranges answer "can the model chain N skills under uncertainty?" still with mostly no. The latter is the policy-relevant question for autonomous threat models.

See `mythos-ctf-vs-range-framing-mode` for the detailed decision matrix.

## What To Use When — Decision Matrix

| You want to measure… | Use | Why |
|----------------------|-----|-----|
| Single offensive-security skill (one CTF category) | Cybench subtask, NYU CTF Bench, InterCode-CTF | Isolated skill probe with leaderboard precedent |
| Secure-code generation tendency | Meta CyberSecEval (Purple Llama) | Designed for insecure-code propensity scoring |
| Cyber-NLP (classification, summarisation) | CyberBench (Liu et al.) | NLP, not agentic — answers a different question |
| Chained multi-step autonomy on enterprise estate | AISI *The Last Ones* range | Multi-step, milestone-graded, minimal scaffolding |
| ICS / OT chained autonomy | AISI *Cooling Tower* range | 7-step OT-specific milestone chain |
| Capability-taxonomy coverage report | Rodriguez et al. 2025 mapping | Designed as taxonomy, not score |
| Operator-with-AI uplift (the actual threat model) | Custom — see `mythos-human-ai-teaming-threat-mode` | No public benchmark covers this yet |
| Sandbox-escape capability | AISI SandboxEscapeBench (companion to ranges) | Specifically scoped to container/VM breakout |

## How Ranges Complement CTFs

CTFs and ranges are not substitutes — they are orthogonal probes.

- **CTF score, range score both high:** strong both as skill and as chainer; report both.
- **CTF high, range low:** chaining/state-tracking gap; the model has the building blocks but cannot assemble them autonomously. Common 2026 pattern.
- **CTF low, range high:** unusual; usually means the range is too easy or scoring is leaky.
- **Both low:** capability is genuinely below the floor.

A capability portfolio for a frontier-model cyber claim should publish at least: one CTF benchmark (Cybench is the de-facto), one chained range (AISI ranges or equivalent), and one secure-code probe (CyberSecEval). Single-benchmark claims are increasingly hard to defend in 2026.

## Reading Each Benchmark's Question

A benchmark answers exactly one question well; misreading the question is the most common citation error in 2026 cyber-eval reports.

- **NYU CTF Bench** answers: "Given a CTF challenge with function-calling tools, can the model produce the flag?" It is a function-calling-aware skill probe across a large public CTF corpus. Strong for surface breadth.
- **InterCode-CTF** answers: "Inside an interactive ReAct shell, can the model solve a picoCTF-class task?" It probes the scaffolding layer at least as much as the model.
- **Cybench** answers: "On 40 professional CTFs across six domains, with optional subtask scaffolding, what fraction can the model solve?" It is the de-facto leaderboard for CTF skill in 2026.
- **CyberBench** answers: "On cyber-domain NLP tasks (classification, NER, summarisation), how does the model perform?" Important for cyber-NLP, **not** for agentic capability.
- **Meta CyberSecEval** answers: "Does the model produce insecure code, and is it willing to assist with cyberattacks when prompted?" A propensity benchmark, not a capability one.
- **Rodriguez et al. 2025 mapping** answers: "Across the attack chain, which phases do existing capability probes cover?" A taxonomy, not a leaderboard.
- **AISI ranges** answer: "Under minimal scaffolding, can the model autonomously chain N steps to milestones?" Chained-autonomy capability.

When a paper cites Cybench-only and claims "frontier-model cyber capability," it is conflating skill with chained autonomy. When a paper cites AISI ranges only and claims "the model is not a cyber threat," it is ignoring CTF-class skill that an operator-with-AI can chain manually. Both errors are common; both are caught by reading the question.

## Common Pitfalls

- **Comparing scores across families.** "Model X gets 40% on Cybench and 30% on AISI ranges" mixes two units. They measure different things.
- **Ignoring scaffolding.** Cybench unguided vs subtask-guided are different tasks. Always report which.
- **Treating CTF saturation as capability ceiling.** A high-of-ceiling CTF answers "this is a solved skill," not "this is the best the model can do."
- **Single-benchmark claims.** Triangulate; one number is a vibe, two are a comparison, three are a portfolio.
- **Missing the taxonomy step.** Without Rodriguez et al.-style taxonomy, you cannot tell which attacker phases your benchmarks actually cover.
- **Citing stale leaderboard snapshots.** 2026 leaderboards move quarterly; a Cybench number from six months ago may be off the current top tier by 10+ points.
- **Conflating subtask-guided and unguided runs.** A 60% subtask-guided result is not comparable to a 30% unguided result — they measure different capabilities.

## Triangulation Patterns That Hold Up

Three cross-family combinations that survive reviewer scrutiny:

1. **Cybench (unguided) + AISI *The Last Ones* + CyberSecEval insecure-code rate.** The minimal defensible portfolio for a frontier-model cyber claim. Three families, three questions: skill, chained autonomy, build-side propensity.
2. **Cybench (subtask-guided) + AISI *Cooling Tower* + Rodriguez 2025 taxonomy coverage.** For OT-axis claims where the corporate range is not the right question. The taxonomy serves as the coverage audit.
3. **NYU CTF Bench (surface) + AISI ranges + SandboxEscapeBench.** When breadth across CTF surface matters more than professional difficulty, paired with the sandbox-validity check.

Each combination explicitly answers: what skill is present, can it be chained, and does the eval container actually hold? Single-family claims fail at least one of those questions.

## When to Use This Mode

- Choosing benchmarks for a frontier-model capability report.
- Reviewing a model card to check if its cyber claims are triangulated.
- Authoring the "Related Work" / "Comparison" section of a cyber-eval paper.
- Briefing policy stakeholders on what existing numbers do and do not say.

## Operating Constraints

- Always cite benchmark, version, scaffolding, and date — leaderboards move quarterly in 2026.
- Never collapse a benchmark family to a single number when reporting cross-model.
- Use AISI §4 as a reference for benchmark coverage; do not reinvent the comparison axes.
- Pair every quantitative score with the question that score answers (skill / chained autonomy / propensity / NLP); reviewers in 2026 expect this framing.
- Pass every survey draft through `mythos-eval-limitations-framework-mode` before publication so each cited number lands as a lower bound, not a ceiling.

## Sources

- [Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios — arXiv:2603.11214v3](https://arxiv.org/abs/2603.11214v3) — §4 related work
- [Cybench: A Framework for Evaluating Cybersecurity Capabilities and Risks of Language Models — arXiv:2408.08926](https://arxiv.org/abs/2408.08926)
- [Cybench leaderboard — cybench.github.io](https://cybench.github.io/)
- [NYU CTF Bench — arXiv:2406.05590](https://arxiv.org/abs/2406.05590)
- [Purple Llama CyberSecEval — arXiv:2312.04724](https://arxiv.org/abs/2312.04724)
- [Inspect Cyber: A New Standard for Agentic Cyber Evaluations — AISI blog, Jun 26 2025](https://aisi.gov.uk/blog/inspect-cyber)
- [How do frontier AI agents perform in multi-step cyber-attack scenarios? — AISI blog, Mar 16 2026](https://aisi.gov.uk/blog/how-do-frontier-ai-agents-perform-in-multi-step-cyber-attack-scenarios)
