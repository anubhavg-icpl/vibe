---
name: development
description: development
risk: unknown
source: community
kind: mode
category: workflows
---

# Development Workflow

Use this file for build, loader, CO-RE, and day-to-day development setup guidance.

## When to Use This File

- setting up a new libbpf or ebpf-go project
- generating `vmlinux.h`
- compiling and linking
- choosing between skeleton, manual attach, and `bpf2go`
- preparing a host for development and feature discovery

## libbpf CO-RE Layout

```text
project/
├── vmlinux.h
├── program.bpf.c
├── program.h
├── program.c
└── Makefile
```

Rules:
- `vmlinux.h` is generated, not hand-edited.
- Generate it from the running kernel's BTF when needed:

```bash
bpftool btf dump file /sys/kernel/btf/vmlinux format c > vmlinux.h
```

- A pre-built `vmlinux.h` is acceptable only when it matches the target kernel and architecture closely enough for the intended CO-RE workflow.
- In CO-RE `.bpf.c` files, `vmlinux.h` replaces normal kernel header includes.
- Prefer:

```c
#include "vmlinux.h"
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_core_read.h>
```

- Prefer global variables in `.rodata` / `.data` over single-entry config maps for configuration.
- Compile with `-g`; verifier logs are much easier to act on.

## Minimal Build Flow

```bash
clang -O2 -g -target bpf -D__TARGET_ARCH_x86 -I. -c program.bpf.c -o program.bpf.o
bpftool gen skeleton program.bpf.o > program.skel.h
cc -g -Wall -I. -c program.c -o program.o
cc -g -Wall program.o -lbpf -lelf -lz -o program
```

## Minimal Skeleton Pattern

```c
#include "program.skel.h"

int main(void) {
    struct program_bpf *skel = program_bpf__open();
    if (!skel)
        return 1;

    // Example: skel->rodata->target_pid = getpid();
    if (program_bpf__load(skel))
        return 1;
    if (program_bpf__attach(skel))
        return 1;

    // event loop...
    program_bpf__destroy(skel);
    return 0;
}
```

## ebpf-go Default Pattern

```go
//go:generate go run github.com/cilium/ebpf/cmd/bpf2go -target amd64 Prog prog.bpf.c

objs := ProgObjects{}
if err := loadProgObjects(&objs, nil); err != nil {
    panic(err)
}
defer objs.Close()
```

Use `link.Kprobe`, `link.Tracepoint`, `link.AttachXDP`, `ringbuf.NewReader`, and `perf.NewReader` first unless the user truly needs lower-level control.

## Host Prep and Feature Discovery

Before debugging loader or attach failures, verify the host first:

```bash
mount -t bpf bpffs /sys/fs/bpf
bpftool feature
cat /sys/kernel/security/lsm
grep CONFIG_BPF_KPROBE_OVERRIDE /boot/config-$(uname -r)
```

Guidance:
- mount `bpffs` before manual pin/load workflows if it is not already mounted
- run `bpftool feature` when the user is unsure whether a helper, map type, or program type exists on the target kernel
- inspect `/sys/kernel/security/lsm` when discussing BPF LSM availability or boot-time enablement
- check `CONFIG_BPF_KPROBE_OVERRIDE` before recommending kprobe-based override workflows
- if `bpftool` is missing from the distro package manager, mention that an upstream release binary may be needed

## Development Defaults

- Use `libbpf` for C/C++ production work and CO-RE portability.
- Use `ebpf-go` when the surrounding system is Go and `bpf2go` fits the workflow.
- Use `bpftrace` for exploratory work and short-lived diagnostics.
- Prefer `bpf_link`-based lifecycle management when available.
- Keep detach and cleanup paths obvious from the start for XDP, TC, cgroup, and LSM programs.
