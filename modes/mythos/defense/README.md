# Mythos Defense Modes

Defensive operations and patching modes inspired by Anthropic's **Project Glasswing** (April 2026), the **Claude Mythos Preview** research, and the **Claude Security** public beta (Opus 4.7) launched May 2026.

These modes are designed for **defenders, maintainers, and security teams**: people patching software, triaging scanner output, coordinating disclosures, and running incident response. None of them assist with offensive activity.

## Modes

| File | Purpose |
|---|---|
| [`mythos-patch-generator-mode.md`](./mythos-patch-generator-mode.md) | Given a confirmed vulnerability, generate a minimal patch that preserves project structure and style, ships with a regression test, updates CHANGELOG, and respects contribution norms |
| [`mythos-adversarial-validator-mode.md`](./mythos-adversarial-validator-mode.md) | Challenge proposed findings with counter-arguments before surfacing them to an analyst, reducing false positives |
| [`mythos-finding-triage-mode.md`](./mythos-finding-triage-mode.md) | Sort raw scanner output by exploitability and blast radius using CVSS v4.0, dedup, and chain detection |
| [`mythos-false-positive-hunter-mode.md`](./mythos-false-positive-hunter-mode.md) | Aggressively prune noise from Snyk, Trivy, Semgrep, CodeQL, and GitHub Dependabot output via reachability analysis |
| [`mythos-oss-maintainer-helper-mode.md`](./mythos-oss-maintainer-helper-mode.md) | Trusted sidekick for solo and small-team OSS maintainers — backlog triage, conventions-aware drafts, OpenSSF Scorecard wins |
| [`mythos-secure-code-reviewer-mode.md`](./mythos-secure-code-reviewer-mode.md) | Pre-commit / PR review focused on security regressions: dangerous functions, removed sanitisers, weakened crypto |
| [`mythos-vulnerability-disclosure-mode.md`](./mythos-vulnerability-disclosure-mode.md) | Coordinated disclosure workflow: CVE request, GHSA draft, vendor email, embargo timeline, MITRE coordination, adapted to LLM-discovery pace |
| [`mythos-incident-responder-mode.md`](./mythos-incident-responder-mode.md) | Active incident response: scope triage, containment, eradication, recovery, customer notification, regulator coordination per NIST SP 800-61r3 |

## Defensive framing

Project Glasswing is described by Anthropic as an effort to *"secure the world's most critical software for the AI era,"* with launch partners including AWS, Apple, Cisco, CrowdStrike, Google, JPMorganChase, the Linux Foundation, Microsoft, NVIDIA, and Palo Alto Networks. Of the announced commitments, **$2.5M went to Alpha-Omega and OpenSSF (via the Linux Foundation)** and **$1.5M went to the Apache Software Foundation** — both targeted at supporting maintainers. The Mythos Helper mode in particular is informed by Jim Zemlin's framing that maintainers *"have historically been left to figure out security on their own."*

Claude Security (the public beta on Opus 4.7, distinct from Mythos Preview) is positioned around two product claims that the validator and patch-generator modes operationalise:

- *"Every finding goes through an adversarial verification pass. Claude challenges its own results before surfacing them."*
- Suggested fixes that *"maintain your code's structure and style."*

The Claude Mythos Preview write-up notes that *"Over 99% of the vulnerabilities we've found have not yet been patched, so it would be irresponsible for us to disclose details about them"* and commits to publishing detail *"no later than 90 plus 45 days after we report the vulnerability to the affected party."* The disclosure-coordinator mode follows that same restraint.

## Sources cited across these modes

- Project Glasswing — https://www.anthropic.com/glasswing
- Claude Security product page — https://claude.com/product/claude-security
- Claude Security public beta (Help Net Security coverage) — https://www.helpnetsecurity.com/2026/05/04/anthropic-claude-security-public-beta/
- Claude Mythos Preview research write-up — https://red.anthropic.com/2026/mythos-preview/
- OpenSSF Alpha-Omega Project — https://openssf.org/press-release/2022/02/01/openssf-announces-the-alpha-omega-project-to-improve-software-supply-chain-security-for-10000-oss-projects/
- OpenSSF Scorecard — https://securityscorecards.dev/
- OSSF maintainer guide for vulnerability disclosure — https://github.com/ossf/oss-vulnerability-guide/blob/main/maintainer-guide.md
- OSS-Fuzz disclosure guidelines — https://google.github.io/oss-fuzz/getting-started/bug-disclosure-guidelines/
- CISA Coordinated Vulnerability Disclosure Program — https://www.cisa.gov/resources-tools/programs/coordinated-vulnerability-disclosure-program
- CISA Apache Log4j vulnerability guidance — https://www.cisa.gov/news-events/news/apache-log4j-vulnerability-guidance
- CVSS v4.0 specification — https://www.first.org/cvss/v4-0/cvss-v40-specification.pdf
- NIST SP 800-61r3 — https://csrc.nist.gov/pubs/sp/800/61/r3/final
- Semgrep reachability analysis whitepaper — https://semgrep.dev/assets/content/whitepapers/semgrep-reachabilityanalysis-whitepaper-1225.pdf
- GitHub repository security advisories docs — https://docs.github.com/code-security/security-advisories/repository-security-advisories/about-repository-security-advisories
- Log4Shell timeline — https://en.wikipedia.org/wiki/Log4Shell

## Verbatim quote audit

Quotes used in these modes were taken from the WebFetch extractions of the cited primary sources. Specifically:

- *"Suggested fixes that maintain your code's structure and style"* — Claude Security product page (paraphrased from extracted text "Suggested fixes that maintain your code's structure and style")
- *"Every finding goes through an adversarial verification pass. Claude challenges its own results before surfacing them."* — Claude Security product page
- *"More real issues get reported, and fewer false positives waste analyst time."* — Claude Security product page
- *"Over 99% of the vulnerabilities we've found have not yet been patched, so it would be irresponsible for us to disclose details about them."* — red.anthropic.com Mythos Preview write-up
- *"no later than 90 plus 45 days after we report the vulnerability to the affected party"* — red.anthropic.com Mythos Preview write-up
- *"have historically been left to figure out security on their own...Project Glasswing offers a credible path to changing that equation."* — Jim Zemlin, attributed via the Project Glasswing announcement page
- *"help [maintainers of the most critical open source projects] identify and fix security vulnerabilities"* — OpenSSF Alpha-Omega announcement

No CVE identifiers were invented. CVE-2021-44228 (Log4Shell) and CVE-2014-0160 (Heartbleed) are referenced as historical examples and are publicly verifiable.
