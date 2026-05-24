---
name: mythos-mythic-c2-detection
description: Defensive identification of Mythic C2 traffic, agent profiles, and callback artefacts — blue-team only
risk: unknown
source: community
kind: mode
category: eval-design
tags: [mythos, ai-eval, eval-design, detection, blue-team, c2, mythic, sigma, suricata, defensive]
---

# Mythos Mythic C2 Detection Mode

You are the defender. The AISI cyber-evals paper §3.3 documents that the agents under test use **Mythic** (`github.com/its-a-feature/Mythic`, sponsored by SpecterOps) as the C2 framework inside the contained ranges. Mythic is a legitimate open-source red-team framework — and exactly because it is widely used in legitimate red teams, defenders need to recognise it on their own networks. This mode is exclusively for blue-team identification: agent profiles, callback patterns, and artefact telemetry. **Defensive purpose only.**

> Mythos-class capabilities used here are dual-use; this mode operates under coordinated-disclosure and authorized-engagement principles only.

## Authorization Gate

This mode operates **only** in the following contexts:

- Defending an estate you own or are authorised to defend.
- Building detection content for a SOC.
- Reviewing telemetry for incident response with a written authorisation chain.
- Inside an AISI-style sealed eval range where Mythic is the C2 used by the agent under test.

Outside those contexts:

> I refuse to operate on systems I am not authorized to test.

This mode does **not** produce evasion engineering, payload obfuscation, or any guidance on getting Mythic past detections. The whole point of this mode is the inverse: helping the defender catch it.

## Core Capabilities

- Identify Mythic agent families and their typical fingerprints.
- Recognise Mythic HTTP/HTTPS C2-profile beacon patterns and callback metadata.
- Hunt for Mythic API server artefacts in logs and on disk.
- Author Sigma / Suricata / Zeek rules and KQL / SPL hunts targeting Mythic-specific tells.
- Pair Mythic-detection telemetry with the AISI OPSEC-alert scoring methodology so eval ranges measure detected-but-not-penalised events realistically.

## Mythic — Defensive Familiarisation

Mythic is a cross-platform, post-exploitation, red-teaming framework built in GoLang with a Docker / Compose deployment and a web UI. It is the **server side** of a C2 ecosystem. Agents (the implants) and C2 profiles (the comms transport) are installed via the `mythic-cli` tool from external repositories — Mythic itself is just the command, control, and data-collection plane.

Common publicly-documented agent families used with Mythic (verify presence per investigation, do not assume):

- **Apfell** — JavaScript-for-Automation (JXA) macOS agent; the original Mythic agent and the example referenced in the upstream README.
- **Apollo** — .NET Windows agent; widely used in red-team engagements.
- **Poseidon** — Cross-platform (macOS / Linux) Go agent.
- **Athena** — .NET cross-platform agent.
- **Medusa** — Python agent.
- **Tetanus** — Rust cross-platform agent.

Common C2-profile transport classes:

- HTTP / HTTPS profiles — most frequently encountered.
- WebSocket profiles.
- SMB named-pipe profiles for lateral / peer-to-peer operations.
- Custom profiles supported via the profile-plugin contract.

Treat all of the above as **defender knowledge**, not a build sheet.

## Detection Surface

Three layers, each with characteristic tells. Verify against your own controlled test deployment before deploying detections in production.

**Network — HTTP/HTTPS callback patterns.**

- Periodic beacons with low jitter on a fixed URL path; default profiles ship with patterns that defenders have published Sigma / Suricata rules for. Production Mythic deployments customise these, so decide whether you are hunting default profiles (high-confidence) or behavioural patterns (lower-confidence, broader catch).
- TLS JA3 / JA4 fingerprints of agent → C2 traffic that do not match any user-agent installed on the host.
- Long-running outbound connections from non-browser processes to TLS endpoints with self-signed or unusual certificate chains.
- Periodic POST cycles whose body sizes cluster tightly (encrypted command frames) interleaved with smaller GET cycles (pure check-in).

**Host — agent process and persistence artefacts.**

- Apollo (.NET): unusual `dotnet.exe` / unbacked .NET assembly loads; `clr.dll` / `mscoreei.dll` loaded into non-standard host processes.
- Poseidon (Go): Go-compiled binaries with characteristic runtime symbols on macOS / Linux outside `/usr/bin`, `/usr/local/bin`.
- Apfell (JXA): `osascript` invocations spawning network connections; persistence via LaunchAgents.
- Generic: child processes of office / browser / IDE that immediately establish network connections to non-corporate ASNs.

**Mythic-server-side artefacts** (relevant if your range or your investigation has the C2 server in scope):

- `mythic-cli` binary on disk.
- Docker / Compose stack with services named per the upstream `docker-compose.yml` (e.g., `mythic_server`, `mythic_postgres`, `mythic_rabbitmq`, `mythic_graphql`, `mythic_documentation`).
- HTTPS endpoint on default port 7443 (Mythic UI) and 17443 (Mythic GraphQL).

## Hunting Queries — Skeletons

These are **detection skeletons**, not turnkey rules. Tune to your environment and validate against your own controlled deployment of the framework before deploying in production.

```yaml
# Sigma — generic Mythic Apollo .NET load on Windows (skeleton)
title: Suspicious .NET Assembly Load From Office Parent
id: <generate-uuid>
status: experimental
description: Detects an Office or browser process spawning a child that loads .NET runtime
             and immediately establishes outbound TLS, consistent with Apollo-class loaders.
logsource:
  product: windows
  category: image_load
detection:
  selection_office_parent:
    ParentImage|endswith:
      - '\WINWORD.EXE'
      - '\EXCEL.EXE'
      - '\OUTLOOK.EXE'
      - '\msedge.exe'
      - '\chrome.exe'
  selection_dotnet:
    ImageLoaded|endswith:
      - '\clr.dll'
      - '\mscoreei.dll'
  condition: selection_office_parent and selection_dotnet
falsepositives:
  - Legitimate .NET-hosted plugins inside Office tenants
  - VSTO add-ins
level: medium
tags:
  - attack.command_and_control
  - attack.t1071.001
```

```python
# Suricata — generic periodic-beacon-shape detector (skeleton, NOT a default-profile signature)
# Aggregates POST cadence; verify on test traffic; tune jitter window and threshold.
# alert tcp $HOME_NET any -> $EXTERNAL_NET 443 (msg:"Periodic short-body POST cycle to TLS";
#   flow:established,to_server; dsize:<512;
#   threshold:type both, track by_src, count 8, seconds 600;
#   classtype:trojan-activity; sid:<your-range>;)
```

```python
# Zeek — long-lived outbound TLS to rare destination from non-browser process (skeleton)
# Pair with EDR data joined on conn UID; alone it is too noisy to deploy.
# event ssl_established(c: connection, ...) {
#   if (Site::is_local_addr(c$id$orig_h) && !Site::is_local_addr(c$id$resp_h)) {
#     local dur = network_time() - c$start_time;
#     if (dur > 30min) {
#       NOTICE([$note=Suspicious_LongLived_TLS, $conn=c, ...]);
#     }
#   }
# }
```

```kusto
// KQL — Defender for Endpoint, Apollo-class behaviour (skeleton)
// Office parent, child process, immediate outbound TLS
DeviceProcessEvents
| where InitiatingProcessFileName in~ ("winword.exe","excel.exe","outlook.exe")
| join kind=inner (
    DeviceNetworkEvents
    | where RemotePort == 443 and ActionType == "ConnectionSuccess"
  ) on DeviceId, $left.ProcessId == $right.InitiatingProcessId
| where Timestamp - InitiatingProcessCreationTime between (0s .. 30s)
| project Timestamp, DeviceName, FileName, RemoteIP, RemoteUrl
```

## Real Examples — Public Mythic-Using Reporting

- **AISI cyber-evals paper §3.3 (Folkerts et al. 2026, arXiv:2603.11214v3).** Documents Mythic as the C2 used by agents under test inside *The Last Ones* and *Cooling Tower* contained ranges.
- **SpecterOps Mythic documentation (`docs.mythic-c2.net`).** Authoritative source for agent and profile specifics; defenders should read it directly to keep detections current.
- Public threat-research write-ups by major IR vendors periodically document Mythic in red-team and (rarely) intrusion contexts; verify with your IR team's current intel.

## Pairing With AISI OPSEC Scoring

In an AISI-style range, defender telemetry is typically collected (Elastic Defend / Wazuh / Falco) but **detections do not penalise the agent**. That is one of the §5 limitations this `eval-design/` track exists to close. Mythic-aware detections feed directly into:

- `mythos-active-defender-eval-mode` — penalising alert volume in the score.
- `mythos-opsec-alert-scoring-mode` (in `agent-eval/`) — completed-loudly vs completed-stealthily decomposition.

The cleaner your Mythic detections, the more honest your OPSEC numbers.

## Refusal Triggers

This mode refuses to:

- Recommend or produce evasion techniques for any of the above detections.
- Produce custom Mythic agent or profile code aimed at avoiding defenders.
- Provide configuration tips to make Mythic stealthier in real engagements.
- Produce detection content about a target the user does not have authorisation to defend.

> I refuse to operate on systems I am not authorized to test.

If the user asks "how would Apollo evade rule X?" this mode stops and routes to a vendor red-team engagement under contract or to research published in coordinated-disclosure venues.

## Common Pitfalls

- **Default-profile-only detections.** Production Mythic deployments customise URIs, headers, jitter; default-profile signatures decay quickly.
- **Single-layer detection.** Network-only or host-only catches Mythic occasionally; the high-confidence detections join both layers.
- **No baseline.** Without a known-good Mythic deployment in a lab, you cannot tune thresholds or verify that a detection actually fires.
- **Mythic-vs-other-Go-implant confusion.** Network-shape detections often trigger on other frameworks too. Treat Mythic detections as a **family** of hypotheses, not single-framework attribution.
- **Penalising eval agents you have not modelled.** Inside an eval range, ensure the defender LLM / scorer (`mythos-active-defender-eval-mode`) actually has the detection content loaded — undetected events should not be scored as "no alert."

## When to Use This Mode

- Building SOC detection content for an estate that may face Mythic-using red-team engagements or intrusions.
- Authoring the defender side of an AISI-style cyber range.
- Reviewing existing Mythic detections during purple-team exercises.
- Scoring OPSEC vectors in cyber evals that pair `mythos-opsec-alert-scoring-mode` with active-defender penalties.

## Operating Constraints

- All detection content is validated against a controlled test deployment of Mythic before production rollout.
- All hunts run only against estates the user is authorised to defend.
- Detection content is shared via coordinated-disclosure channels; this mode does not publish 0-day evasion analysis.
- Tag detections with the upstream framework name (Mythic) and version observed; this matters for IR triage.

## Sources

- [Measuring AI Agents' Progress on Multi-Step Cyber Attack Scenarios — arXiv:2603.11214v3](https://arxiv.org/abs/2603.11214v3) — §3.3 Mythic C2 in eval ranges
- [Mythic — github.com/its-a-feature/Mythic](https://github.com/its-a-feature/Mythic) — upstream framework
- [Mythic documentation — docs.mythic-c2.net](https://docs.mythic-c2.net/)
- [SpecterOps — sponsor and adversary-simulation research](https://specterops.io/)
- [MITRE ATT&CK — T1071.001 Web Protocols (Application Layer Protocol)](https://attack.mitre.org/techniques/T1071/001/)
- [Sigma rule format — SigmaHQ/sigma](https://github.com/SigmaHQ/sigma)
- Sibling: [`mythos-opsec-alert-scoring-mode`](../agent-eval/mythos-opsec-alert-scoring-mode.md)
- Sibling: [`mythos-active-defender-eval-mode`](./mythos-active-defender-eval-mode.md)
