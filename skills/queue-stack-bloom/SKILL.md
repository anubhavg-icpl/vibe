---
name: queue-stack-bloom
description: queue-stack-bloom. Use when you need help with queue stack bloom.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: map-types
---

# Queue, Stack, and Bloom Filter Maps

## Related Guidance

- For cross-kernel compatibility checks, see `workflows/testing.md`.
- If you need to understand the kernel-side object or API semantics behind a map interaction, refer to Linux kernel source and kernel docs.

## Quick Choice

- Use `QUEUE` when you need FIFO ordering and do not need keys.
- Use `STACK` when you need LIFO ordering and do not need keys.
- Use `BLOOM_FILTER` only as a probabilistic pre-filter ahead of a real source of truth.

---

## BPF_MAP_TYPE_QUEUE

FIFO queue. No keys — push to the tail, pop from the head.

**When to use it:**
- deferred work IDs
- FIFO work handoff
- small ordered buffers where keyed lookup is not needed

```c
struct {
    __uint(type, BPF_MAP_TYPE_QUEUE);
    __type(value, u64);
    __uint(max_entries, 128);
} work_queue SEC(".maps");
```

### Kernel Operations

```c
// Push to tail (enqueue)
u64 val = 42;
bpf_map_push_elem(&work_queue, &val, BPF_ANY);
// BPF_ANY   — push, evict oldest if full
// BPF_EXIST — push, fail if full (returns -E2BIG)

// Pop from head (dequeue) — removes the element
u64 out;
int ret = bpf_map_pop_elem(&work_queue, &out);
if (ret < 0)
    return 0;  // queue was empty

// Peek at head without removing
ret = bpf_map_peek_elem(&work_queue, &out);
```

### Userspace Operations

```c
// Same helpers via syscall
bpf_map_update_elem(fd, NULL, &val, BPF_ANY);  // push
bpf_map_lookup_elem(fd, NULL, &out);            // peek
bpf_map_lookup_and_delete_elem(fd, NULL, &out); // pop
```

**Notes:**
- No key — pass `NULL` as the key argument in userspace helpers
- Common use: work items, pending packet IDs, deferred tasks

---

## BPF_MAP_TYPE_STACK

LIFO stack. Same API as queue — push adds to top, pop removes from top.

**When to use it:**
- LIFO work or frame-style state
- undo-like stacks
- explicit top-of-stack semantics

```c
struct {
    __uint(type, BPF_MAP_TYPE_STACK);
    __type(value, u32);
    __uint(max_entries, 64);
} frame_stack SEC(".maps");
```

### Kernel Operations

```c
// Push
u32 frame_id = 7;
bpf_map_push_elem(&frame_stack, &frame_id, BPF_ANY);

// Pop (removes from top)
u32 out;
bpf_map_pop_elem(&frame_stack, &out);

// Peek (top without removing)
bpf_map_peek_elem(&frame_stack, &out);
```

**Notes:**
- Identical API to QUEUE — only the ordering differs (LIFO vs FIFO)
- Common use: call stacks, undo history, recursive state

---

## BPF_MAP_TYPE_BLOOM_FILTER

Probabilistic membership test. Extremely space-efficient. No false negatives; small probability of false positives.

**When to use it:**
- cheap "definitely not present" checks
- front-running an expensive hash lookup
- approximate admission filters where rare false positives are acceptable

```c
struct {
    __uint(type, BPF_MAP_TYPE_BLOOM_FILTER);
    __type(value, u64);       // type of elements being tested
    __uint(max_entries, 1000); // expected number of elements
} seen_ips SEC(".maps");
```

### Kernel Operations

```c
// Add an element
u64 ip = 0xC0A80001;  // 192.168.0.1
bpf_map_push_elem(&seen_ips, &ip, BPF_ANY);

// Test membership — returns 0 if definitely NOT present, -ENOENT if possibly present
int ret = bpf_map_peek_elem(&seen_ips, &ip);
if (ret == 0) {
    // definitely not seen before — safe to proceed
} else {
    // might have been seen — do a more expensive lookup to confirm
}
```

**Notes:**
- Cannot delete individual elements — the filter is append-only
- Tune `max_entries` to expected cardinality; false positive rate grows as the filter fills
- Set number of hash functions with `BPF_F_BLOOM_FILTER_HASH_FUNC` flag (default: auto-tuned)
- Available since kernel 5.16
- Typical use: pre-filter before an expensive hash map lookup (avoid the lookup if definitely not present)
