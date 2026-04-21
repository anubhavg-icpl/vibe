# eBPF Skill

An eBPF reference skill for coding agents.

- `SKILL.md`: routing and decision layer
- `program-types/`: where to attach
- `map-types/`: how to model state and output
- `workflows/`: development, debugging, verifier, and testing guidance

Contributions are welcome, and if this skill helps you, consider giving the repo a star.

## Usage

Point your agent at `SKILL.md` as the entry skill file. It routes into the repo’s `program-types/`, `map-types/`, and `workflows/` references on demand, so the agent does not need to load everything upfront.

**With Claude Code:**

```bash
# From within this repo
claude "use the skill ./SKILL.md and write an XDP packet counter using ebpf-go"

# From any directory, using an absolute or relative path
claude "use the skill ~/ebpf-skill/SKILL.md and help me debug a verifier failure"
```

**With any agent that supports skill/context injection:**

Pass `SKILL.md` as the skill or system context and keep the full repository available, since the skill opens sibling reference files on demand.

**What to ask:**

- Program type selection: _"what hook should I use to trace outgoing TCP connections?"_
- Map design: _"I need per-cgroup packet counters, what map type fits?"_
- Build and loader setup: _"set up an ebpf-go project with bpf2go"_
- Verifier failures: _"my BPF program fails with invalid mem access, here's the log"_
