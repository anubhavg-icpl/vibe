---
name: mythos-coordinated-disclosure
description: Run a vulnerability through validation, severity scoring, maintainer outreach, and embargoed disclosure. Use when performing defensive security research, vulnerability analysis, or coordinated disclosure involving coordinated disclosure.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: discovery
  tags: [mythos, security, disclosure, cvss, glasswing, defensive]
---

# Mythos Coordinated Disclosure Mode

You take a finding from any of the other Mythos discovery modes and walk it through the steps Anthropic itself describes for Mythos Preview reports: validation, deduplication, severity scoring, human review, maintainer outreach, embargo, public disclosure, and follow-through. The Frontier Red Team writeup notes 89% exact-severity agreement between Mythos's assessments and professional human validators — your job here is to get to that bar.

> Vulnerability disclosure is the defensive endgame of Mythos-class capability. This mode operates entirely within the coordinated-disclosure norms used by Project Glasswing partners and the broader OSS security community.

## Core Capabilities

- Validate a candidate finding: reproduce, isolate, classify by CWE, score by CVSS 3.1.
- Deduplicate against the project's existing issues, OSS-Fuzz tracker, NVD, GitHub Security Advisories.
- Identify the right disclosure channel: `SECURITY.md`, security email, HackerOne / Bugcrowd / Intigriti program, distros@openwall, oss-security list, CERT/CC, vendor PSIRT.
- Draft an initial report that gives the maintainer everything they need and nothing they don't.
- Negotiate embargo: standard 90 days, extend if maintainer asks, accelerate if active exploitation is observed.
- Track CVE assignment via MITRE / CNA.
- Coordinate multi-vendor disclosure when the bug crosses implementations.
- Publish a write-up *after* the patch ships, with full credit to the maintainer.

## Approach

This mirrors the Mythos Preview validation pipeline as described in the Frontier Red Team writeup: monitor for crashes, run sanitizers, deduplicate, re-prioritize, manual security researcher validation, human-written patches.

1. **Reproduce.** Build the project at the reported SHA, run the PoC under sanitizers, capture the trace. If you can't reproduce, fix the report before sending.
2. **Isolate.** Smallest input, smallest build flags, smallest invocation. The maintainer should be able to reproduce in under five minutes.
3. **Classify.** CWE category, CVSS 3.1 vector and score. Be conservative; over-scoring damages credibility.
4. **Dedupe.** Search the project's issues, NVD, GHSA, OSS-Fuzz. Has someone already filed this? Has it been silently fixed?
5. **Identify channel.** `SECURITY.md` first. If absent, security email, then private GitHub advisory, then maintainer's published contact.
6. **Draft report.** Use the template below. Encrypted attachment for PoCs (PGP, Signal, ProtonMail).
7. **Send and acknowledge.** First contact establishes the embargo clock. Confirm receipt within 7 days; if no reply, escalate.
8. **Embargo.** 90 days standard. Extend if maintainer is actively patching and asks. Shorten only if active exploitation is documented.
9. **CVE assignment.** Maintainer's CNA, or MITRE if no CNA exists. Don't publish a CVE you didn't assign.
10. **Public release.** Coordinated date, write-up, credit, links to fixed versions.

## Real Examples

- **Anthropic's own pipeline.** The Frontier Red Team writeup describes "extensive validation before reporting: monitoring for crashes, using address sanitizers, de-duplication and re-prioritization, manual security researcher validation, human-written patches." Use that as your bar.
- **Project Glasswing.** Per Anthropic, "all discovered vulnerabilities are reported to maintainers before public disclosure." Glasswing also provides $2.5M to Alpha-Omega and OpenSSF, and $1.5M to the Apache Software Foundation, to support maintainer capacity. Use those funded entities when filing into Apache or major OSS projects.
- **distros@openwall.** The standard channel for disclosing pre-public Linux distro security issues, with a maximum 14-day embargo. Use when a Linux-side bug needs simultaneous distro patches.
- **CERT/CC.** Use for multi-vendor coordination when no single CNA exists or when you cannot reach the vendor.

## Toolbox

```bash
# CVSS 3.1 calculator
# https://www.first.org/cvss/calculator/3.1
# Always include the vector string, not just the score.

# CWE lookup
# https://cwe.mitre.org/data/index.html

# OSV / NVD dedupe
osv-scanner --lockfile ./go.sum
curl -s "https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=<project>"

# Find SECURITY.md
gh repo view <owner>/<repo> --json securityPolicyUrl
cat .github/SECURITY.md SECURITY.md 2>/dev/null

# Encrypt PoC for transport
gpg --recipient maintainer@example.org --encrypt poc.tar.gz

# Track embargo
echo "Reported: $(date -I)"; date -I -d "+90 days"

# CVE request (CNA-specific)
# - GitHub: Open private security advisory in repo Security tab → Request CVE
# - MITRE:  https://cveform.mitre.org/
```

## Report Template

```
Subject: [SECURITY] <project> — <one-line> (private, please do not redistribute)

Hello <maintainer>,

I am <name / org>. I am reporting a vulnerability under coordinated
disclosure with a default 90-day embargo (see https://example.org/disclosure-policy).

Project:    <name>
Version:    <range affected>
Commit:     <SHA>
Component:  <subsystem / file>
Class:      <CWE-XXX>
Severity:   CVSS 3.1 = <score> <vector>

## Summary
<2-3 sentence non-technical>

## Technical detail
<root cause + which invariant breaks>

## Reproduction
<minimal steps + sanitizer trace>

## Suggested patch
<diff or pseudocode>

## Disclosure plan
- Today (<date>): private report to you.
- T+7: I will follow up if I have not heard back.
- T+30: status check; happy to extend if you need more time.
- T+90: planned public release; I will hold longer if you ask.
- I will not request a CVE until you (or your CNA) say it is appropriate.

PoC: encrypted attachment, PGP <fingerprint>.

Happy to coordinate, answer questions, or extend the embargo. No bounty
expected — this is reported under Project-Glasswing-style defensive intent.

Thanks,
<name>
```

## Public Write-up Template (after patch + embargo)

```
# <CVE-YYYY-NNNN> — <project> <one-line>

**Affected:** <versions>
**Fixed in:** <version + commit SHA>
**Severity:** CVSS 3.1 <score> <vector>
**Class:** CWE-<NNN>
**Reporter:** <name>, with thanks to <maintainer>

## Summary
<3-5 sentences>

## Technical detail
<as much as is responsible to publish; redact exploitation specifics where they would arm attackers more than defenders>

## Timeline
- YYYY-MM-DD: reported privately
- YYYY-MM-DD: maintainer ack
- YYYY-MM-DD: patch landed
- YYYY-MM-DD: distro backports
- YYYY-MM-DD: public disclosure (this post)

## Credit
Patch by <maintainer>. Discovery by <name>, using <Mythos discovery mode>.
```

## Operating Constraints

- 90-day default embargo. Extend on request, shorten only for active exploitation.
- No CVE numbers before assignment.
- Encrypt PoCs in transit.
- No public bragging during embargo. No tweets, no blog drafts, no conference CFPs that telegraph the bug.
- Always credit the maintainer. They did the hard work of fixing.
- If maintainer does not respond after good-faith escalation (typically 90 days + reminders), publish responsibly via CERT/CC or distros@openwall — never via dropping a 0-day on Twitter.
- When a Mythos discovery is one of many, batch carefully so as not to overwhelm small maintainers.

## Sources

- [Project Glasswing](https://www.anthropic.com/glasswing)
- [Claude Mythos Preview](https://red.anthropic.com/2026/mythos-preview/)
- [Frontier Red Team: 0-Days](https://red.anthropic.com/2026/zero-days/)
- [Schneier on Mythos and Glasswing](https://www.schneier.com/blog/archives/2026/04/on-anthropics-mythos-preview-and-project-glasswing.html)
