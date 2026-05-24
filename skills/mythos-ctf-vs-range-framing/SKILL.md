---
name: mythos-ctf-vs-range-framing
description: Decide when CTFs measure the right thing vs when chained-autonomy ranges do — failure-mode taxonomy and capability-portfolio guidance
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: eval-design
  tags: [mythos, ai-eval, eval-design, ctf, range, capability-portfolio, defensive]
---

# Mythos CTF vs Range Framing Mode

You are the eval-author choosing the format. The AISI March 2026 paper (arXiv:2603.11214v3) §4 and Appendix D explicitly contrast isolated CTF skill probes with multi-step chained execution. The 2026 leaderboard picture confirms it empirically: Cybench-class single-step benchmarks are climbing fast — top models reach the high-30s to mid-40s percent unguided range — while chained ranges still leave large headroom (mean ~9.8 / 32 on *The Last Ones*). This mode is the decision support for picking the right eval format for the question you actually want to answer, and for assembling balanced capability portfolios.

> Mythos-class capabilities used here are dual-use; this mode operates under coordinated-disclosure and authorized-engagement principles only.

This mode is for evaluators, model-card authors, capability surveyors, and policy reviewers who need to defend why their portfolio looks the way it does.

## Core Capabilities

- Map a capability question to CTF, range, or both.
- Diagnose the four failure quadrants — CTF/range high or low — and what each implies.
- Build capability portfolios that triangulate single-step skill, chained autonomy, and OPSEC.
- Communicate which question a benchmark answers, not just which number it produces.

## Decision Matrix — Single-Step Skill vs Chained Autonomy

| You want to measure… | Use | Why |
|----------------------|-----|-----|
| Specific offensive-security skill (one technique class) | CTF | Isolated probe; bounded scope; leaderboard precedent |
| Surface coverage across crypto / web / rev / forensics / pwn | CTF benchmark suite (Cybench, NYU CTF) | Multi-domain by construction |
| Tool-use proficiency under known scope | CTF with subtask scaffolding | Subtask-guided runs measure tool-use, not autonomy |
| Multi-step autonomous decision-making | Range | Ranges force chaining; CTFs do not |
| Recovery from wrong branches | Range | CTFs are linear; ranges have multiple paths and dead ends |
| State tracking across hours / millions of tokens | Range | CTFs typically resolve in minutes / thousands of tokens |
| OPSEC under realistic noise | Range with active defender (`mythos-active-defender-eval-mode`) | CTFs do not measure noise |
| Operator-with-AI uplift | Custom uplift study (`mythos-human-ai-teaming-threat-mode`) | Neither CTF nor range alone covers this |

The single most useful framing: **CTFs measure skills, ranges measure chaining.** Both are needed; neither is the other.

## Failure-Mode Taxonomy

Plotting CTF score against range score across models and budgets produces four interpretable quadrants:

| | Range high | Range low |
|---|------------|-----------|
| **CTF high** | Strong end-to-end agent. Report both. Watch for overfitting to specific range structure. | **Most common 2026 pattern.** Skills present, chaining absent. State-tracking, sub-goal recognition, recovery-from-wrong-branch are the bottlenecks. Targeted evals: long-horizon planning, multi-step recovery, context-compaction. |
| **CTF low** | **Suspicious.** Often means range scoring is leaky (agent hit milestone without doing the technique), or range is too easy. Audit the scorer. | Capability genuinely below the floor on this stack. Skill probe failure → chained autonomy unlikely. |

The high-CTF / low-range quadrant is the policy-relevant one in 2026 because that is where most frontier models sit. It also forecasts the next frontier: the techniques that will move models out of that quadrant — better long-horizon planning, better state tracking, better self-recovery from wrong branches — are the same techniques being researched for general-purpose agents. So range scores act as a leading indicator for general-purpose autonomy capability, not just cyber.

## What To Use When Surveying Frontier Models

A defensible 2026 frontier-model cyber survey publishes at least three numbers from three families:

1. **A single-step CTF benchmark.** Cybench is the de-facto pick for the leaderboard layer; NYU CTF Bench for surface breadth.
2. **A chained-autonomy range.** AISI *The Last Ones* (corp) is the strongest publicly documented chained-autonomy benchmark; *Cooling Tower* covers the OT axis.
3. **A secure-code or willingness probe.** Meta CyberSecEval / Purple Llama for secure-code propensity; this answers a different question (build-side risk vs operate-side capability) and rounds out the portfolio.

Optional fourth axes for stronger claims:

- **Sandbox escape** — AISI SandboxEscapeBench (validates the sandbox before trusting other numbers).
- **OPSEC-aware** — `mythos-active-defender-eval-mode` adds the detected-but-not-penalised gap.
- **Operator uplift** — see `mythos-human-ai-teaming-threat-mode` for the threat-model layer.

Single-benchmark cyber claims about frontier models are increasingly hard to defend; reviewers in 2026 expect triangulation.

## Mixing Both In A Capability Portfolio

The argument for keeping CTFs even when you have ranges:

- **Skill diagnostics.** When a range run fails on a particular milestone, CTF scores on the underlying technique class isolate whether the failure was skill or chaining.
- **Cross-model comparability.** CTF leaderboards have years of cross-model history; ranges are newer and per-eval-author. CTFs anchor a model's place in the broader landscape.
- **Cheaper iteration.** CTFs run in minutes per task; ranges run in hours. CTF sweeps are the right format for fast turn-around in pre-release capability gating.
- **Saturation as a signal.** When a CTF benchmark saturates, that itself is information — the underlying skill is solved; future capability gains will show up in chained autonomy, not single-step.

The argument for keeping ranges even when CTFs are climbing:

- **Chaining gap.** The high-CTF / low-range quadrant proves single-step skill does not entail chained autonomy.
- **Operationally-relevant.** Real cyber operations are chained, not single-step. Ranges are closer to the threat model.
- **Headroom.** Cybench at the high-30s to mid-40s percent in 2026; AISI ranges at ~30% mean of milestones. The latter measures something the former cannot.

## Real Examples — 2026 Empirical Picture

- **Cybench leaderboard 2026.** Top frontier models reach the high-30s to mid-40s percent unguided; subtask-guided runs higher. Per-domain breakdowns (crypto / web / rev / forensics / misc / pwn) show heterogeneous saturation.
- **AISI *The Last Ones* (Folkerts et al. 2026).** Mean of 9.8 / 32 milestones at the strongest model and budget tier; best single run reached 22 / 32. Substantial headroom remains; chaining is the live frontier.
- **AISI *Cooling Tower* (same paper, 7 steps).** Smaller chain but more domain-specific; useful as the OT-axis complement to *The Last Ones*.
- **CTF saturation as a leading indicator.** Across cyber sub-skills, CTF saturation has historically preceded range capability gains by ~12 months. Watch CTF subtask trends to forecast next-year range progress.

## Worked Example — Diagnosing The High-CTF / Low-Range Quadrant

A frontier model in 2026 typically lands in the high-CTF / low-range quadrant. The diagnostic workflow:

1. **Confirm the quadrant.** Cybench unguided ≥ 30% AND AISI *The Last Ones* mean ≤ 12 / 32. If both, you are in the quadrant.
2. **Decompose CTF performance by domain.** Where is the model strongest — crypto, web, rev, forensics, misc, pwn? The strong domains are the skills that *should* compose into range progress.
3. **Decompose range performance by milestone.** Which milestones cleared, which never cleared? Plot the per-milestone clear rate across epochs.
4. **Cross the two.** If strong CTF skills correspond to milestones the model still failed, the gap is **chaining**, not skill. If strong CTF skills correspond to cleared milestones, the gap is in the milestones whose underlying skill domain the model is weak on; targeted CTF improvements forecast range improvements.
5. **Diagnose the chaining failure modes.** Read transcripts (`agent-eval/mythos-behavioral-analysis-mode`) for: loops, lost state across compaction, sub-goal misrecognition, recovery-from-wrong-branch failures.
6. **Forecast.** A model whose chaining failures are mostly state-tracking will be lifted by better context-compaction (`agent-eval/mythos-context-compaction-eval-mode`); a model whose failures are sub-goal recognition will be lifted by planner scaffolding.

This workflow turns the high-CTF / low-range quadrant from a vibes-based observation into an actionable capability roadmap.

## Common Pitfalls

- **Single-format claims.** "Model X scored 40% on Cybench" without a range number leaves the chained-autonomy question unanswered.
- **Comparing CTF and range scores as if same units.** They are not. Different denominators, different distributions, different scaffolds.
- **Treating range failure as capability ceiling.** Range scores are lower bounds — see `mythos-eval-limitations-framework-mode`.
- **Reading saturated CTF as "no further capability."** Saturation means the skill is solved; capability now shows up elsewhere.
- **Ignoring scaffolding.** Cybench unguided vs subtask-guided are different evals. Always specify.
- **Not auditing the suspicious quadrant.** Low-CTF / high-range almost always indicates a scorer bug; audit before publishing.

## When to Use This Mode

- Choosing the format for a new cyber-eval.
- Designing the table of contents for a frontier-model capability report.
- Reviewing a model card to check whether it triangulates.
- Briefing policy stakeholders on why the picture from a single benchmark is incomplete.
- Forecasting the next year's capability frontier from CTF saturation curves.

## Defensive Framing

- This mode produces eval-design recommendations and portfolio plans. No exploit content, no range internals.
- The framing here is meant to lower the rate of misleading single-number cyber claims in public communication, which is itself a safety contribution.
- All recommended benchmarks are public; all recommended ranges (AISI's) follow coordinated-disclosure norms.

## Operating Constraints

- Always specify scaffolding (unguided / subtask-guided / minimal `react()`) when citing benchmark scores.
- Always pair CTF and range numbers when claiming "frontier-model cyber capability."
- Use the failure-mode taxonomy quadrant as the diagnostic lens, not headline ranking.
- Pass capability-claim drafts through `mythos-eval-limitations-framework-mode` before publication.

## Sources

- [Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios — arXiv:2603.11214v3](https://arxiv.org/abs/2603.11214v3) — §4 related work, Appendix D
- [Cybench: A Framework for Evaluating Cybersecurity Capabilities and Risks of Language Models — arXiv:2408.08926](https://arxiv.org/abs/2408.08926)
- [Cybench leaderboard — cybench.github.io](https://cybench.github.io/)
- [NYU CTF Bench — arXiv:2406.05590](https://arxiv.org/abs/2406.05590)
- [Purple Llama CyberSecEval — arXiv:2312.04724](https://arxiv.org/abs/2312.04724)
- [How do frontier AI agents perform in multi-step cyber-attack scenarios? — AISI blog, Mar 16 2026](https://aisi.gov.uk/blog/how-do-frontier-ai-agents-perform-in-multi-step-cyber-attack-scenarios)
- [Inspect Cyber: A New Standard for Agentic Cyber Evaluations — AISI blog, Jun 26 2025](https://aisi.gov.uk/blog/inspect-cyber)
- Sibling: [`mythos-cyber-bench-survey-mode`](./mythos-cyber-bench-survey-mode.md)
- Sibling: [`mythos-eval-limitations-framework-mode`](./mythos-eval-limitations-framework-mode.md)
