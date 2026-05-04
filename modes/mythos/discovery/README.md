---
title: Mythos Discovery Modes
description: Defensive vulnerability-discovery modes inspired by Anthropic's Claude Mythos Preview and Project Glasswing
author: vibe (mythos-inspired)
tags: [mythos, security, glasswing, vulnerability-research, defensive]
---

# Mythos Discovery Modes

A set of vibe modes that emulate the *vulnerability discovery* capabilities described for Anthropic's Claude Mythos Preview (announced April 2026 alongside Project Glasswing). Each mode covers one leg of the Mythos methodology — fuzzing, commit archeology, pattern matching, algorithm-aware reading, taint analysis, PoC construction, and coordinated disclosure — so a defender can compose them into a real workflow.

> **Defensive-first.** Mythos-class capabilities are dual-use. Every mode in this directory operates under coordinated-disclosure principles only and is intended for OSS maintainers, internal security teams, and Project Glasswing partners. None of these modes endorse offensive use, weaponization, or live-target testing outside an authorized scope.

## Modes in this directory

| File | Purpose |
|------|---------|
| `mythos-zero-day-hunter-mode.md` | Out-of-the-box vulnerability discovery in mature codebases — find bugs that survived decades of fuzzing. References OpenBSD 27-year SACK bug, FFmpeg 16-year H.264 bug, FreeBSD NFS RCE. |
| `mythos-memory-corruption-auditor-mode.md` | Sanitizer-aware audit for buffer overflows, use-after-free, double-free, type confusion, integer-overflow-into-allocation. References OpenSC `strcat`. |
| `mythos-commit-archeologist-mode.md` | Read git history for security-relevant commits and find sibling call sites that did not receive the same fix. References the GhostScript pattern from the Frontier Red Team writeup. |
| `mythos-fuzzing-strategist-mode.md` | Choose between libFuzzer / AFL++ / Honggfuzz / syzkaller, build harnesses, design corpora, and know when fuzzing is the wrong tool (logic bugs, algorithm bugs, race conditions). |
| `mythos-proof-of-concept-builder-mode.md` | Construct minimal, deterministic PoC inputs (file formats, network packets, syscall sequences). References the CGIF LZW PoC and the FreeBSD NFS ROP-chain demo. |
| `mythos-data-flow-tracer-mode.md` | Cross-file taint tracking from sources (network, file, env, IPC) to sinks (`exec`, SQL, deserialize, template render). Identifies sanitizer gaps. |
| `mythos-pattern-vuln-finder-mode.md` | Wide-net sweep for known dangerous patterns (`strcat` w/o bounds, `gets`, format strings, `pickle.loads` of network data, integer overflow before alloc) with exploitability triage. |
| `mythos-algorithm-bug-hunter-mode.md` | Bugs that require understanding the underlying algorithm (LZW, parsers, crypto, consensus, TCP state). References CGIF LZW dictionary-reset overflow, OpenBSD SACK arithmetic, FFmpeg sentinel collision. |
| `mythos-coordinated-disclosure-mode.md` | Validate, score (CVSS), dedupe, contact the maintainer, embargo, CVE-assign, publish. Mirrors the validation pipeline Anthropic describes for Mythos Preview reports. |

## Suggested workflow

The Frontier Red Team Zero-Days post describes the Mythos methodology as roughly: fuzz first, then read commit history, then read code by hand. A practical defender's loop using these modes:

1. `mythos-pattern-vuln-finder-mode` — wide sweep, deduplicate, triage.
2. `mythos-fuzzing-strategist-mode` — set up sanitized libFuzzer/AFL++ runs on the highest-value parsers.
3. `mythos-commit-archeologist-mode` — mine the project's own history; check sibling call sites of past fixes.
4. `mythos-zero-day-hunter-mode` — deep manual reading of the highest-risk subsystems.
5. `mythos-memory-corruption-auditor-mode` — sanitizer-aware drill-down on unsafe code.
6. `mythos-data-flow-tracer-mode` — cross-file taint analysis with Semgrep / CodeQL.
7. `mythos-algorithm-bug-hunter-mode` — for parsers, codecs, crypto, consensus, network state machines.
8. `mythos-proof-of-concept-builder-mode` — package a minimal, deterministic PoC for any confirmed finding.
9. `mythos-coordinated-disclosure-mode` — validate, score, contact maintainer, embargo, CVE, publish.

## Calibration: what Mythos Preview actually did

Anthropic's Frontier Red Team described Mythos Preview's results publicly in April 2026. The modes here use only publicly disclosed examples for grounding:

- **27-year-old OpenBSD TCP SACK bug** — signed-integer overflow in sequence-number arithmetic, found by deep code reading, missed by fuzzers because triggering required reasoning about kernel state.
- **16-year-old FFmpeg H.264 bug** — slice-number / sentinel collision causing OOB write. Anthropic notes this is "ultimately not a critical severity vulnerability" but illustrates depth.
- **FreeBSD NFS RCE (CVE-2026-4747)** — autonomously discovered and exploited by Mythos with a 20-instruction ROP chain across multiple packets.
- **GhostScript sibling caller** — Mythos read the commit history for bounds-check additions, then located similar unpatched code paths in other files.
- **OpenSC `strcat`** — found by pattern recognition of unsafe C function calls.
- **CGIF LZW dictionary-reset overflow** — required understanding that LZW output can exceed input length when the dictionary resets.

On benchmarks, Mythos Preview is reported at 83.1% on CyberGym (vs. Opus 4.6's 66.6%) and 93.9% on SWE-bench Verified.

## Operating constraints (apply to every mode)

- **Coordinated disclosure only.** 90-day default embargo. Maintainer first. Public after patch.
- **No invented CVE numbers.** Wait for MITRE / CNA assignment.
- **No exploitation against systems you do not own** or have written authorization for.
- **Honest severity.** Use CVSS 3.1 with the full vector string. Do not inflate.
- **Push fixes upstream**, including fuzzing harnesses and Semgrep rules, so the project gains long-term coverage.
- **Respect maintainer capacity.** Don't dump 200 raw pattern hits at once. Triage first.
- **No bragging during embargo.** No tweets, no draft blog posts that telegraph the bug.
- **Project Glasswing posture.** Defensive-first, dual-use-aware, coordinated-disclosure-bound.

## Sources

- [Claude Mythos Preview — red.anthropic.com](https://red.anthropic.com/2026/mythos-preview/)
- [Frontier Red Team: 0-Days — red.anthropic.com](https://red.anthropic.com/2026/zero-days/)
- [Project Glasswing — anthropic.com](https://www.anthropic.com/glasswing)
- [CyberGym benchmark — cybergym.io](https://www.cybergym.io/)
- [Schneier on Mythos and Glasswing](https://www.schneier.com/blog/archives/2026/04/on-anthropics-mythos-preview-and-project-glasswing.html)
