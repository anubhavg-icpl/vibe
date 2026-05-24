---
name: references
description: references
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: ebpf
---

## External References

Use these when they directly help the user go deeper or unblock a specific issue.

### Core Documentation

- [ebpf.io docs](https://docs.ebpf.io/) — community eBPF documentation covering concepts, syscall API, and program/map types
- [kernel.org BPF docs](https://www.kernel.org/doc/html/latest/bpf/index.html) — authoritative kernel BPF documentation
- [libbpf API docs](https://libbpf.readthedocs.io/) — libbpf function reference
- [cilium/ebpf docs](https://pkg.go.dev/github.com/cilium/ebpf) — ebpf-go package reference
- [bpftrace reference guide](https://github.com/bpftrace/bpftrace/blob/master/docs/reference_guide.md) — full bpftrace probe and built-in reference

### CO-RE and Portability

- [BPF CO-RE reference guide](https://nakryiko.com/posts/bpf-core-reference-guide/) — Andrii Nakryiko's canonical CO-RE guide
- [BPF portability and CO-RE](https://nakryiko.com/posts/bpf-portability-and-co-re/) — background on why CO-RE exists and how it works
- [vmlinux.h and BTF-powered apps](https://nakryiko.com/posts/bpf-tips-printk/) — practical tips including `bpf_printk`

### Tooling

- [bpftool releases](https://github.com/libbpf/bpftool/releases) — standalone builds for environments where the distro package is unavailable or outdated
- [bpftop](https://github.com/Netflix/bpftop) — live view of loaded BPF program overhead and hit counts
- [bpf2go usage](https://pkg.go.dev/github.com/cilium/ebpf/cmd/bpf2go) — code-generation tool for embedding BPF objects in Go binaries
- [cilium/ebpf examples](https://github.com/cilium/ebpf/tree/main/examples) — working ebpf-go examples covering kprobe, tracepoint, XDP, TC, and more

### Verifier and Debugging

- [BPF verifier internals](https://www.kernel.org/doc/html/latest/bpf/verifier.html) — kernel docs on verifier design and register state tracking
- [BPF tracing tools (Brendan Gregg)](https://www.brendangregg.com/bpf-performance-tools-book.html) — reference for BPF observability patterns and tool usage

### Program and Map Type References

- [BPF program types (kernel)](https://www.kernel.org/doc/html/latest/bpf/libbpf/program_types.html) — libbpf program type and ELF section name mapping
- [BPF map types (kernel)](https://www.kernel.org/doc/html/latest/bpf/maps.html) — kernel map type documentation
