---
title: Mythos Offense Modes
description: Offensive-security vibe modes inspired by Anthropic Claude Mythos Preview / Project Glasswing
author: vibe (mythos-inspired)
tags: [mythos, red-team, defensive-purpose, project-glasswing, mitre-attack]
---

# Mythos Offense Modes

Offensive-security capabilities modeled on Anthropic's **Claude Mythos Preview** (announced April 2026) and the **Project Glasswing** partner program. These modes exist for one purpose: **defensive uplift**. Every mode is for authorized red teaming, CTFs, internal testing, vendor bug bounties, and Project Glasswing partner work — and every mode refuses to operate outside that envelope.

## The Authorization Rule

Every mode in this directory enforces the same gate, in the mode's own words:

> **"I refuse to operate on systems I am not authorized to test."**

Acceptable authorization artifacts vary by mode but generally include: a signed engagement letter / SOW, an internal change ticket from the asset owner, CTF rules of engagement, a public bug-bounty scope listing the target, or a Project Glasswing partner agreement. The ICS mode is stricter — it requires a CELR-class lab charter and refuses **all** live OT targets without exception.

## Mode Index

| # | Mode | What it does | Strictest authorization required |
|---|------|--------------|----------------------------------|
| 1 | [mythos-exploit-developer](./mythos-exploit-developer-mode.md) | Weaponize a confirmed vuln — ROP/JOP, heap grooming, info leaks, ASLR/DEP/CFI bypass | Engagement letter / CTF / bounty scope / Glasswing |
| 2 | [mythos-kernel-privesc](./mythos-kernel-privesc-mode.md) | Linux kernel LPE chains — KASLR bypass, slab UAF, Dirty-Pipe-class | Change ticket from host owner / kernelCTF / Glasswing |
| 3 | [mythos-adversary-emulator](./mythos-adversary-emulator-mode.md) | MITRE ATT&CK chains via Caldera + Atomic Red Team, modeled on PNNL ALOHA | Engagement letter / purple charter / lab |
| 4 | [mythos-ics-attack-chain](./mythos-ics-attack-chain-mode.md) | ICS/SCADA emulation against a digital twin (water, power, fuel, building) | **CELR/PNNL/INL or vendor lab charter — never live OT** |
| 5 | [mythos-binary-reverse-engineer](./mythos-binary-reverse-engineer-mode.md) | Black-box RE with Ghidra/IDA/Binja for in-scope binaries | Engagement / bounty / vendor scope / DFIR sample |
| 6 | [mythos-web-exploit-crafter](./mythos-web-exploit-crafter-mode.md) | OWASP Top 10 + 2025 chains: SSRF, prototype pollution, deserialization, JWT, ATO | Engagement / explicit bounty scope / lab |
| 7 | [mythos-uac-bypass-creative](./mythos-uac-bypass-creative-mode.md) | Adaptive Windows UAC bypass — pivot when primary technique fails (PNNL anecdote) | Engagement / change ticket / lab |
| 8 | [mythos-purple-team-evaluator](./mythos-purple-team-evaluator-mode.md) | Attack→detect→adjust→re-attack loop measuring EDR/SIEM coverage | Purple-team charter (red + blue both signed) |

## Universal Refusal Triggers

Every mode in this directory refuses to:

- Operate on a target without verifiable, written authorization for that specific target
- Mass-target hosts, tenants, sites, or identities
- Build ransomware, wipers, destructive payloads, or self-propagating worms
- Compromise a software supply chain (npm/pypi/crates/Go/container registry hijack, signed-update injection)
- Bundle exploits with persistent C2 implants for use outside an explicitly scoped engagement
- Fabricate or hallucinate CVE numbers, advisories, or vendor statements
- Touch live ICS / OT / safety-of-life systems (medical devices, vehicles, aviation, transit) — the ICS mode permits **simulated** environments only

## How These Modes Relate

```text
                    ┌──────────────────────────────┐
                    │ mythos-purple-team-evaluator │  ◄── orchestrates iterations
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │ mythos-adversary-emulator    │  ◄── chains the techniques
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
 ┌──────────────┐      ┌────────────────────┐      ┌────────────────────┐
 │ mythos-web   │      │ mythos-uac-bypass  │      │ mythos-ics-attack  │
 │ -exploit     │      │ -creative          │      │ -chain (lab only)  │
 └──────┬───────┘      └─────────┬──────────┘      └────────────────────┘
        │                        │
        ▼                        ▼
 ┌──────────────┐      ┌────────────────────┐
 │ mythos-      │      │ mythos-kernel-     │
 │ exploit-dev  │◄─────┤ privesc            │
 └──────┬───────┘      └────────────────────┘
        │
        ▼
 ┌──────────────────────────────┐
 │ mythos-binary-reverse-       │  ◄── feeds vuln intel back into exploit-dev
 │ engineer                     │
 └──────────────────────────────┘
```

## Provenance

These modes are inspired by, but not produced by, Anthropic. They reference public material from Project Glasswing, the Mythos Preview announcement, and the PNNL CELR water-treatment-plant ALOHA paper. They are not affiliated with or endorsed by Anthropic, PNNL, CISA, or any Project Glasswing partner.

## Primary Sources

- [Claude Mythos Preview](https://red.anthropic.com/2026/mythos-preview/)
- [Project Glasswing](https://www.anthropic.com/glasswing)
- [Project Glasswing — anthropic.com/project/glasswing](https://www.anthropic.com/project/glasswing)
- [Anthropic: AI for Critical Infrastructure Defense (PNNL water-plant test)](https://red.anthropic.com/2026/critical-infrastructure-defense/)
- [PNNL news release: Generative AI Speeds up Cybersecurity Defenses](https://www.pnnl.gov/news-media/generative-ai-speeds-cybersecurity-defenses)
- [CISA Control Environment Laboratory Resource (CELR)](https://www.cisa.gov/resources-tools/resources/celr)
- [MITRE ATT&CK](https://attack.mitre.org/)
- [MITRE Caldera](https://github.com/mitre/caldera)
- [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team)
- [Schneier on Security: On Anthropic's Mythos Preview and Project Glasswing](https://www.schneier.com/blog/archives/2026/04/on-anthropics-mythos-preview-and-project-glasswing.html)
- [Fortune: Anthropic's Claude Mythos for cybersecurity defenses](https://fortune.com/2026/04/07/anthropic-claude-mythos-model-project-glasswing-cybersecurity/)
- [The Hacker News: Mythos Finds Thousands of Zero-Day Flaws](https://thehackernews.com/2026/04/anthropics-claude-mythos-finds.html)
