# Mythos Specialty Security Modes

Specialty domain modes inspired by Anthropic's Claude Mythos Preview and **Project Glasswing** (April 2026). These modes apply Mythos-class reasoning - reading code with hypotheses, building mental models of algorithms, finding bugs that fuzzers cannot reach - to specific high-leverage security domains.

All modes are **defensive**. Where capability is dual-use, the operating constraints reflect coordinated disclosure, scope-of-authorization, and "do no harm" framing. Critical infrastructure work follows the PNNL + DOE Genesis Mission model: simulate, never touch live OT.

## Modes in this directory

| Mode | Domain | Core artifact |
|---|---|---|
| `mythos-crypto-protocol-auditor-mode.md` | TLS, JOSE, OAuth, OIDC, post-quantum migration | Protocol audit report with state-machine analysis |
| `mythos-supply-chain-auditor-mode.md` | SLSA, sigstore, SBOM, dependency confusion, typosquatting | SLSA gap analysis + signing posture report |
| `mythos-sandbox-escape-hunter-mode.md` | Browsers (V8/JSC/SpiderMonkey), WASM, containers (runc/containerd), hypervisors | Sandbox-escape vulnerability report |
| `mythos-ics-scada-defender-mode.md` | Purdue model, Modbus/DNP3/IEC-104/IEC-61850, safety-instrumented systems | ICS defense assessment, simulation-only adversary emulation |
| `mythos-mobile-app-auditor-mode.md` | iOS + Android per OWASP MASVS / MASTG, Frida-driven dynamic analysis | Mobile audit report mapped to MASVS / MASTG / MASWE |
| `mythos-ai-llm-probe-mode.md` | LLM safeguards: probes on activations, constitutional classifiers, prompt-injection / jailbreak detection | Safeguard design + eval report |
| `mythos-binary-fuzz-corpus-mode.md` | OSS-Fuzz, ClusterFuzzLite, libFuzzer corpus engineering, structure-aware grammars | Fuzzing campaign report + coverage gap analysis |
| `mythos-cti-threat-intel-mode.md` | STIX/TAXII, MITRE ATT&CK mapping, attribution-with-uncertainty, end-to-end detection generation per CTI-REALM | Intel report with deployable detection rules |

## How they relate to each other

- **Crypto + Sandbox + Mobile + Fuzz** = code-side defensive research (find the bug, fix it, ship it).
- **Supply chain + CTI** = trust-side defensive operations (verify the artifact, anticipate the adversary).
- **ICS** = cyber-physical defensive engineering (segment, monitor, simulate; never touch live OT).
- **AI/LLM Probe** = the meta-layer (build the safety system around models that build / break the others).

Mythos itself is dual-use. These modes are intended for vendor security teams, OSS maintainers, regulated-industry defenders, government partners (CISA / national labs), and academic researchers operating under coordinated disclosure.

## Sources used across this set

- [Project Glasswing (anthropic.com)](https://www.anthropic.com/glasswing)
- [Claude Mythos Preview (red.anthropic.com)](https://red.anthropic.com/2026/mythos-preview/)
- [Anthropic — AI for Critical Infrastructure Defense](https://red.anthropic.com/2026/critical-infrastructure-defense/)
- [Anthropic — Constitutional Classifiers](https://www.anthropic.com/research/constitutional-classifiers)
- [SLSA framework](https://slsa.dev/)
- [Sigstore docs](https://docs.sigstore.dev/)
- [OWASP MASVS](https://mas.owasp.org/MASVS/)
- [OWASP MASTG](https://mas.owasp.org/MASTG/)
- [NIST FIPS 203 / 204 (post-quantum)](https://csrc.nist.gov/pubs/fips/203/final)
- [MITRE ATT&CK](https://attack.mitre.org/)
- [Microsoft CTI-REALM (2026)](https://www.microsoft.com/en-us/security/blog/2026/03/20/cti-realm-a-new-benchmark-for-end-to-end-detection-rule-generation-with-ai-agents/)
- [PNNL — Generative AI Speeds up Cybersecurity Defenses](https://www.pnnl.gov/news-media/generative-ai-speeds-cybersecurity-defenses)
- [OSS-Fuzz](https://github.com/google/oss-fuzz)
- [CISA ICS Advisories](https://www.cisa.gov/news-events/cybersecurity-advisories/ics-advisories)

## Operating principles (apply to every mode here)

1. **Coordinated disclosure first.** Vendor / maintainer / asset owner before public.
2. **Scope discipline.** Test only what you own or have written authorization for.
3. **Honest severity.** Inflated severity erodes trust in the entire field.
4. **Layered defense.** No single control is sufficient; layer probes + classifiers + monitoring + IR.
5. **Defender uplift, not attacker uplift.** Public artifacts are detection, hunt queries, hardening guidance - not weaponized PoCs.
