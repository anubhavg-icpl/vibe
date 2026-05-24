---
name: event-output
description: event-output. Use when you need help with event output.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: map-types
---

# Event Output Maps

Used to stream structured data from kernel-space to userspace.

## Related Guidance

- For cross-kernel compatibility checks, see `workflows/testing.md`.
- If a struct field, helper contract, or kernel object relationship is unclear, check Linux kernel source and kernel docs directly. They are the best reference for understanding the real shape and semantics of kernel objects.

## Quick Choice

- Use `RINGBUF` by default for new work.
- Use `PERF_EVENT_ARRAY` when targeting kernels older than 5.8 or when benchmarks show per-CPU perf buffers win for your workload.
- If the user needs userspace-to-kernel messaging, this is not the right file; use `USER_RINGBUF` in `map-types/specialized.md`.

---

## BPF_MAP_TYPE_RINGBUF

Single shared ring buffer across all CPUs. Ordered, efficient, and the preferred way to send events to userspace in modern eBPF programs.

**When to use it:**
- ordered event streams
- production tracing and observability
- one shared stream is easier than per-CPU fan-out

**Avoid it when:**
- kernel < 5.8
- you explicitly need per-CPU event channels and do not care about cross-CPU ordering

### Declaration

```c
struct {
    __uint(type, BPF_MAP_TYPE_RINGBUF);
    __uint(max_entries, 1 << 26);  // 64 MB — must be power of 2, multiple of page size
} events SEC(".maps");
```

### Kernel-side Usage

```c
// Reserve → fill → submit (zero-copy)
struct event *e = bpf_ringbuf_reserve(&events, sizeof(*e), 0);
if (!e)
    return 0;  // ring full — drop or count
e->pid  = bpf_get_current_pid_tgid() >> 32;
e->ts   = bpf_ktime_get_ns();
bpf_get_current_comm(&e->comm, sizeof(e->comm));
bpf_ringbuf_submit(e, 0);

// Discard instead of submit (e.g. after filtering)
bpf_ringbuf_discard(e, 0);

// Output without reserve (copies data)
bpf_ringbuf_output(&events, &data, sizeof(data), 0);
```

### Userspace Polling (libbpf)

```c
static int handle_event(void *ctx, void *data, size_t size) {
    struct event *e = data;
    printf("pid=%d comm=%s\n", e->pid, e->comm);
    return 0;
}

struct ring_buffer *rb = ring_buffer__new(
    bpf_map__fd(skel->maps.events), handle_event, NULL, NULL);

while (true)
    ring_buffer__poll(rb, 100 /* timeout ms */);

ring_buffer__free(rb);
```

### Userspace Polling (ebpf-go)

```go
rb, err := ringbuf.NewReader(objs.Events)
for {
    record, err := rb.Read()
    if err != nil { break }
    // parse record.RawSample
}
```

**Notes:**
- `max_entries` is bytes, not entries — size by expected throughput × acceptable latency
- `bpf_ringbuf_reserve` gives you a pointer into the ring directly — no copy on submit
- If the ring is full, `reserve` returns NULL — always check and handle gracefully
- Events are visible to userspace only after `submit`, not during fill
- Prefer over `PERF_EVENT_ARRAY` for new programs

---

## BPF_MAP_TYPE_PERF_EVENT_ARRAY

Per-CPU perf ring buffers. Lower per-event overhead at very high rates, but loses cross-CPU ordering.

**When to use it:**
- kernels older than 5.8
- very high-rate per-CPU event streams
- existing tooling already expects perf buffers

**Avoid it when:**
- global ordering matters
- you want the simplest modern default

### Declaration

```c
struct {
    __uint(type, BPF_MAP_TYPE_PERF_EVENT_ARRAY);
    __type(key, int);
    __type(value, int);  // value type is perf fd — int is conventional
} events SEC(".maps");
```

### Kernel-side Usage

```c
struct event e = {};
e.pid = bpf_get_current_pid_tgid() >> 32;
bpf_get_current_comm(&e.comm, sizeof(e.comm));

bpf_perf_event_output(ctx, &events, BPF_F_CURRENT_CPU, &e, sizeof(e));
```

### Userspace Polling (libbpf)

```c
static void handle_event(void *ctx, int cpu, void *data, __u32 size) {
    struct event *e = data;
    printf("cpu=%d pid=%d\n", cpu, e->pid);
}

static void handle_lost(void *ctx, int cpu, __u64 cnt) {
    fprintf(stderr, "lost %llu events on cpu %d\n", cnt, cpu);
}

struct perf_buffer *pb = perf_buffer__new(
    bpf_map__fd(skel->maps.events),
    8,              // pages per CPU ring
    handle_event, handle_lost, NULL, NULL);

while (true)
    perf_buffer__poll(pb, 100);

perf_buffer__free(pb);
```

**Notes:**
- Each CPU has its own ring — events from different CPUs may arrive out of order
- `handle_lost` fires when the per-CPU ring overflows — size rings accordingly
- Use `BPF_F_CURRENT_CPU` as the index in `bpf_perf_event_output` — don't hardcode CPU IDs
- Choose over ring buffer only when you need maximum per-CPU throughput and don't care about ordering

---

## Choosing Between the Two

| | RINGBUF | PERF_EVENT_ARRAY |
|-|---------|-----------------|
| Ordering | Global FIFO | Per-CPU only |
| Overhead | Lower (shared ring, no wakeup per event) | Higher at low rates |
| Throughput | High | Highest at very high rates |
| Lost event tracking | Built-in counter | `handle_lost` callback |
| Kernel version | ≥ 5.8 | ≥ 4.4 |
| API complexity | Simpler | Slightly more boilerplate |

**Default choice: ring buffer.** Fall back to perf event array only if targeting kernels < 5.8 or benchmarks show it's a bottleneck.
