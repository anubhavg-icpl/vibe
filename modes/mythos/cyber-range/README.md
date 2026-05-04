# Mythos Cyber-Range Modes — "The Last Ones" (AISI)

Nine vibe modes that mirror the nine milestones of "The Last Ones," the 32-step corporate-network cyber range from the AI Security Institute UK paper [Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios](https://arxiv.org/abs/2603.11214v3) (arXiv 2603.11214v3, March 2026).

Every mode here is **defense-focused**. The persona is a blue-team engineer, cyber-range designer, or AISI-style evaluator who detects, defends against, and instruments detection for AI agents executing the milestone. None of these modes produce live-fire offensive payloads; they produce Sigma rules, SPL/KQL/EQL hunts, and range-build guidance.

Per the paper, complete human-expert traversal of the chain is approximately **14 hours**. Per-milestone effort estimates below are the consensus expert split derived from the paper's Figure 4 commentary on per-step difficulty (the paper publishes a total budget rather than a per-milestone breakdown, so these are working estimates intended for range planners; tune to your environment).

## The Nine Modes

| # | Mode | Steps | Focus | Est. expert time |
|---|------|-------|-------|------------------|
| 1 | [mythos-m1-recon-entry-mode.md](./mythos-m1-recon-entry-mode.md) | 1.1-1.4 | External nmap, HTTP fingerprint, default-cred login, `.ovpn` download | ~1 hour |
| 2 | [mythos-m2-kerberos-lateral-mode.md](./mythos-m2-kerberos-lateral-mode.md) | 2.1-2.3 | SMB enumeration, AS-REP roasting, internal workstation foothold | ~1 hour |
| 3 | [mythos-m3-browser-cred-theft-mode.md](./mythos-m3-browser-cred-theft-mode.md) | 3.1-3.2 | DCOM lateral movement, Chrome/DPAPI credential extraction | ~1 hour |
| 4 | [mythos-m4-csrf-ntlm-relay-mode.md](./mythos-m4-csrf-ntlm-relay-mode.md) | 4.1-4.4 | Wiki CSRF, forced auth, NTLM relay, KeePass password-DB cracking | ~2 hours |
| 5 | [mythos-m5-webapp-privesc-mode.md](./mythos-m5-webapp-privesc-mode.md) | 5.1-5.6 | ViewState, SQLMap, SQL+relay RCE, delegation enum, Kerberos S4U, LAPS+GPO | ~3 hours |
| 6 | [mythos-m6-binary-re-key-recovery-mode.md](./mythos-m6-binary-re-key-recovery-mode.md) | 6.1-6.3 | Windows service binary RE, pass-the-hash, AES key recovery | ~2 hours |
| 7 | [mythos-m7-c2-cicd-harvest-mode.md](./mythos-m7-c2-cicd-harvest-mode.md) | 7.1-7.5 | HardHat C2, Git enum, PowerShell history, GitLab + TeamCity creds | ~2 hours |
| 8 | [mythos-m8-supply-chain-compromise-mode.md](./mythos-m8-supply-chain-compromise-mode.md) | 8.1 | C# build-runner backdoor, pipeline-delivered domain admin | ~1 hour |
| 9 | [mythos-m9-data-exfil-sqli-mode.md](./mythos-m9-data-exfil-sqli-mode.md) | 9.1-9.4 | Layered SQLi: script entry, stored-proc injection, CALL injection, UNION-in-proc exfil | ~1 hour |

Total: 32 steps, ~14 hours of expert effort, end-to-end domain compromise plus data exfiltration.

## Common Structure

Every mode contains:

- A defensive persona introduction with the dual-use disclaimer
- An **Authorization Gate** including the verbatim refusal sentence: "I refuse to operate on systems I am not authorized to test."
- Milestone context derived from Appendix C of the paper
- MITRE ATT&CK mapping with verified TTP IDs
- At least one Sigma / KQL / SPL / EQL detection block
- Real-world incident analogues with citation-ready URLs (CISA, MSRC, CWE, OWASP, Mandiant)
- Range-designer notes for cyber-range builders
- Evaluator notes for AISI-style scoring
- Explicit refusal triggers
- Source list with real URLs only

## Use Cases

- **Blue teams** stress-testing detection coverage against AI-driven attack chains.
- **Cyber-range builders** seeking a milestone-level blueprint for "The Last Ones"-style scenarios.
- **AI agent evaluators** building scoring rubrics aligned with AISI's published methodology.
- **Security trainers** teaching the modern AD + CI/CD + supply-chain attack lifecycle from a defender's perspective.

## What These Modes Do NOT Do

- Generate weaponized exploits for production targets.
- Provide reusable offensive tooling for unrestricted distribution.
- Enable attacks on systems outside an authorized engagement.
- Cover the second AISI cyber range ("Cooling Tower," 7 steps, ICS-focused) — that is a separate scope.

## Source Material

- [arXiv 2603.11214v3 — Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios](https://arxiv.org/abs/2603.11214v3)
- [MITRE ATT&CK Enterprise](https://attack.mitre.org/)
- [CISA Cybersecurity Advisories](https://www.cisa.gov/news-events/cybersecurity-advisories)
- [OWASP CICD-SEC Top 10](https://owasp.org/www-project-top-10-ci-cd-security-risks/)
- [SLSA Supply-Chain Framework](https://slsa.dev/)
