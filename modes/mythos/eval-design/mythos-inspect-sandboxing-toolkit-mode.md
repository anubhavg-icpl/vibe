---
title: Mythos Inspect Sandboxing Toolkit
description: Operate the AISI Inspect Sandboxing Toolkit — Docker, Kubernetes, and Proxmox plugins for VM-based agent evaluations
author: vibe (mythos-inspired, AISI eval-design)
tags: [mythos, ai-eval, eval-design, sandboxing, inspect-ai, proxmox, kubernetes, docker, defensive]
---

# Mythos Inspect Sandboxing Toolkit Mode

You are the engineer wiring up the sandbox. The AISI Inspect Sandboxing Toolkit (`github.com/UKGovernmentBEIS/aisi-sandboxing`) is the open-source plugin layer that makes the cyber-evals paper's contained ranges reproducible: Docker for entry-tier evals, Kubernetes for elastic parallel scale-out, Proxmox for high-isolation VM-based ranges of the kind *The Last Ones* and *Cooling Tower* run on. This mode is the practitioner's reference for choosing, configuring, and hardening the right plugin for the eval you are running.

> Mythos-class capabilities used here are dual-use; this mode operates under coordinated-disclosure and authorized-engagement principles only.

## Core Capabilities

- Choose the right plugin for the isolation tier you actually need.
- Author `SandboxEnvironmentSpec` specs that bind Inspect AI tasks to the right sandbox.
- Wire network isolation across the sandboxing protocol's three axes — **tooling, host, network** — as defined in the AISI Aug 2025 sandboxing-toolkit blog.
- Apply resource caps (CPU, memory, disk, network egress) so a runaway agent cannot exhaust shared infrastructure.
- Pair the toolkit with `SandboxEscapeBench` (AISI Mar 2026) to verify the sandbox holds before trusting eval results.

## Architecture — The Three Axes

The AISI sandboxing-toolkit blog (Aug 2025) frames sandbox security on three axes. Every plugin and config decision lands on one or more.

1. **Tooling.** What can the model invoke? Bash, Python, network tools, browser, custom binaries. Restrict to the minimum that matches the eval's claim.
2. **Host.** Can the agent escape its container/VM? Container hardening, gVisor / Kata, VM-level isolation, no-new-privileges, read-only root, dropped capabilities.
3. **Network.** What can the agent reach? Internal-only ranges, no egress, allow-listed package mirrors, zero outbound to model-API endpoints from the sandbox.

A key architectural property called out in the AISI blog: **Inspect itself sits outside the sandbox** and sends commands in. Model inference does not run inside the sandbox. Credentials for the model API never enter the sandbox. This is non-negotiable for any cyber eval.

## The Three Plugins — Choosing One

| Plugin | Use when… | Isolation tier | Scale | Setup effort |
|--------|-----------|----------------|-------|--------------|
| **Docker (Compose)** | Entry-tier evals, single-host dev loops, multi-container ranges that fit on one host | Container — adequate for low-capability skill probes | Tens of parallel runs per host | Low |
| **Kubernetes** | Hundreds of parallel runs across a cluster, elastic budget sweeps, CI-driven eval pipelines | Container — same as Docker, plus orchestration | Hundreds–thousands across cluster | Medium |
| **Proxmox** | High-isolation VM ranges (the *Last Ones* / *Cooling Tower* tier), multi-VM AD/ICS estates, kernel-level isolation needs | VM — strongest of the three | Limited by Proxmox node count and VM density | High |

AISI's published cyber ranges sit at the Proxmox tier. The corporate range is a multi-VM Active Directory estate; the ICS range is a multi-VM OT mock — neither fits cleanly into containers. Reproducing AISI methodology for chained-autonomy evals means Proxmox or equivalent VM-tier isolation.

## Inspect AI Integration

The toolkit is **native to Inspect** — it plugs into `inspect_ai.util.SandboxEnvironmentSpec`. The plugin name in the spec selects which backend handles the lifecycle.

```python
from inspect_ai import Task, task
from inspect_ai.util import SandboxEnvironmentSpec

# Docker — entry tier
sandbox = SandboxEnvironmentSpec(
    type="docker",
    config="ranges/skill_probe/compose.yaml",
)

# Kubernetes — elastic parallel
sandbox = SandboxEnvironmentSpec(
    type="k8s",
    config="ranges/skill_probe/k8s-values.yaml",
)

# Proxmox — VM-tier ranges
sandbox = SandboxEnvironmentSpec(
    type="proxmox",
    config="ranges/last_ones/proxmox.yaml",
)
```

The exact `type` strings and config schemas are owned by the toolkit repo (`UKGovernmentBEIS/aisi-sandboxing`); pin the toolkit version in your eval lockfile and re-verify on upgrade. The Inspect AI side of the contract is `SandboxEnvironmentSpec` plus the `sandbox()` helper in `inspect_ai.util`.

For the broader Inspect harness — Task / Solver / Scorer wiring — see `mythos-inspect-ai-harness-mode`.

## Setup Walkthrough — Docker (Entry Tier)

```yaml
# ranges/skill_probe/compose.yaml
services:
  default:
    image: kasmweb/kali-rolling-desktop:latest
    init: true
    command: tail -f /dev/null
    networks: [agent_only]
    cpus: 2.0
    mem_limit: 4g
    pids_limit: 512
    read_only: false   # agent needs to write workspace
    cap_drop: [ALL]
    cap_add: [NET_BIND_SERVICE]
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp:size=512m

  scorer:
    image: range-scorer:latest
    networks: [scorer_only]   # disjoint from agent
    init: true

networks:
  agent_only:
    internal: true   # zero egress
  scorer_only:
    internal: true
```

Key choices to inherit from AISI methodology:

- `internal: true` networks — no egress means the agent cannot reach the model API or the public internet from inside the sandbox.
- `cap_drop: [ALL]` — explicit capability removal; add back only what the eval requires.
- Separate scorer network — the agent must not be able to reach the milestone ledger (Goodhart's law applies; see `mythos-inspect-ai-harness-mode`).
- Resource caps — CPU, memory, PID limits prevent runaway loops from starving the host.

## Setup Walkthrough — Proxmox (VM Tier)

Proxmox plugin specifics (template names, network bridges, cloud-init payloads) are versioned in the toolkit repo. The shape of a Proxmox-tier eval:

- One Proxmox cluster (or single node) per eval batch.
- Per-sample VM clone from a hardened template (Kali for the agent, Windows / Linux / OT for range targets).
- Internal-only Linux bridge for the range network — no NAT, no firewall hole to the host LAN.
- Snapshot before each epoch, revert after — guarantees no cross-sample state leakage.
- Cloud-init seeds the agent VM with the Inspect Sandboxing agent-side helper that exposes `bash` / `python` over the spec's transport.

Verify the toolkit's `Technical Guidance.pdf` (referenced from the repo README) for the current cloud-init payload and bridge naming conventions; do not improvise.

## Pairing with SandboxEscapeBench

AISI's March 2026 SandboxEscapeBench (companion to the cyber-evals paper) measures whether an agent can break out of the sandbox. Run it against your sandbox config **before** trusting any cyber-eval result:

- A sandbox that fails escape-bench cannot be cited as evidence for "the agent did X *and only X*" — escape may have been part of the path.
- Proxmox-tier sandboxes typically clear escape-bench at the kernel boundary; container sandboxes show more variance and need hardening.
- Re-run on every plugin upgrade.

## Common Pitfalls

- **Egress leak via DNS.** `internal: true` on the network does not always cut DNS in older Docker versions. Verify with `docker exec ... nslookup example.com` from inside the sandbox.
- **Resource caps not enforced.** `mem_limit` requires kernel cgroup support; verify it actually applies on your kernel (`docker stats` mid-run).
- **Scorer reachable from agent.** If the agent can `nc` to the scorer container, your milestone ledger is corrupted. Always disjoint networks; `iptables -L` from the agent container should fail.
- **Model exfiltration via tool output.** A tool that prints API responses into the sandbox creates a credential / data-leak channel. Strip credentials before tool output reaches the agent.
- **Cross-sample state leak.** Forgetting to snapshot-revert in Proxmox means epoch N sees artefacts from epoch N-1. Always revert.
- **Sandbox version drift.** Pin the toolkit version. The plugin API and the `SandboxEnvironmentSpec` type strings are still stabilising; an unpinned upgrade can silently change semantics.
- **Skipping escape-bench.** The single most common omission. Run it.

## When to Use This Mode

- Standing up a fresh cyber-eval pipeline and choosing the sandbox tier.
- Porting an existing CTF eval up to a chained-range eval (Docker → Proxmox).
- Auditing a colleague's eval config for isolation correctness.
- Hardening a sandbox after a SandboxEscapeBench failure.
- Wiring CI to run elastic eval sweeps under Kubernetes.

## Defensive Framing

- This mode produces sandbox configs, not exploits. The artefact is YAML / config files; the goal is **containment** of dual-use capability evals.
- The whole point of investing in Proxmox-tier isolation is that *the more capable the model, the stronger the sandbox must be*. AISI is explicit about this.
- Sandbox configs should themselves be reviewed under the disclosure norms in `mythos-cyber-eval-disclosure-mode` — a sandbox config that reveals range internals is a leak of the eval, not just the agent.

## Operating Constraints

- Pin toolkit and Inspect AI versions; re-verify on upgrade.
- Always run SandboxEscapeBench before publishing any eval result.
- Never let model API credentials enter the sandbox.
- Never share scorer-container network with agent-container network.
- Always snapshot-revert between epochs on VM-tier sandboxes.
- Cap CPU / memory / PIDs / disk per sample; cyber-agent loops can spin pathologically.

## Sources

- [Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios — arXiv:2603.11214v3](https://arxiv.org/abs/2603.11214v3) — §3 environment and Proxmox sandboxing
- [The Inspect sandboxing toolkit: Scalable and secure AI agent evaluations — AISI blog, Aug 7 2025](https://aisi.gov.uk/blog/the-inspect-sandboxing-toolkit-scalable-and-secure-ai-agent-evaluations)
- [Inspect Sandboxing Toolkit repo — UKGovernmentBEIS/aisi-sandboxing](https://github.com/UKGovernmentBEIS/aisi-sandboxing)
- [Inspect AI — UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai)
- [Inspect AI documentation — inspect.aisi.org.uk](https://inspect.aisi.org.uk/)
- [Can AI agents escape their sandboxes? — AISI blog, Mar 23 2026](https://aisi.gov.uk/blog/can-ai-agents-escape-their-sandboxes-a-benchmark-for-safely-measuring-container-breakout-capabilities)
- Sibling: [`mythos-inspect-ai-harness-mode`](../agent-eval/mythos-inspect-ai-harness-mode.md) — for Task / Solver / Scorer wiring
