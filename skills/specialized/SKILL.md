---
name: specialized
description: specialized
risk: unknown
source: community
kind: mode
category: map-types
---

# Specialized Maps

Maps used for redirection, observability, object-lifetime state, and advanced shared memory patterns.

## Related Guidance

- For cross-kernel compatibility checks, see `workflows/testing.md`.
- These maps often interact directly with kernel objects such as sockets, tasks, inodes, cgroups, and device state. If their semantics are unclear, check Linux kernel source and kernel docs directly.

## Scope

This file is the canonical home for:
- stack trace maps
- `USER_RINGBUF`
- XDP redirect maps such as `CPUMAP`, `DEVMAP`, and `XSKMAP`
- per-object storage maps
- `ARENA`

`LPM_TRIE` intentionally lives in `map-types/key-value.md`.

---

## BPF_MAP_TYPE_STACK_TRACE

Stores captured kernel or userspace stack traces indexed by a stack ID.

**When to use it:**
- flame graphs
- lock contention profiling
- event streams that need deferred userspace symbolization

```c
struct {
    __uint(type, BPF_MAP_TYPE_STACK_TRACE);
    __uint(max_entries, 1024);   // number of distinct stack traces to store
    __uint(key_size, sizeof(u32));
    __uint(value_size, PERF_MAX_STACK_DEPTH * sizeof(u64));
} stack_traces SEC(".maps");
```

### Kernel Usage

```c
// Capture kernel stack — returns a stack ID (positive) or negative on error
u32 stack_id = bpf_get_stackid(ctx, &stack_traces, 0);
if ((int)stack_id < 0) stack_id = 0;  // error — treat as missing

// Capture user stack
u32 user_stack_id = bpf_get_stackid(ctx, &stack_traces,
    BPF_F_USER_STACK |          // capture userspace stack instead of kernel
    BPF_F_FAST_STACK_CMP |      // use top-of-stack hash for faster dedup
    BPF_F_REUSE_STACKID         // overwrite existing entry if hash collides
);

// Typical event struct — store both IDs, look up frames in userspace
struct event {
    u32 pid;
    u32 kern_stack_id;
    u32 user_stack_id;
};
```

**`bpf_get_stackid` flags:**
| Flag | Effect |
|------|--------|
| `BPF_F_USER_STACK` | Capture userspace call stack (default: kernel) |
| `BPF_F_FAST_STACK_CMP` | Hash only the top frame for fast dedup — less accurate |
| `BPF_F_REUSE_STACKID` | Overwrite on hash collision instead of returning `-EEXIST` |
| `BPF_F_USER_BUILD_ID` | Store build IDs instead of raw IPs (for stripped binaries) |

### Userspace — Symbolize

```c
u64 ip[PERF_MAX_STACK_DEPTH];
bpf_map_lookup_elem(stack_fd, &stack_id, ip);
// ip[] is an array of instruction pointers — symbolize with:
//   addr2line -e binary 0x<ip>
//   blazesym (Rust library, supports DWARF + build IDs)
//   libunwind
```

**Notes:**
- Available since kernel 4.6
- `bpf_get_stack` (helper, kernel ≥ 4.18) is an alternative — writes raw IPs directly into a buffer instead of a map; useful when you don't want to manage a map
- Negative stack ID means error (e.g. stack too deep, hash table full) — always check `(int)stack_id < 0`
- Typical use: CPU flame graphs, memory leak tracking, lock contention profiling

---

## BPF_MAP_TYPE_USER_RINGBUF

A ring buffer writable from **userspace** and readable from eBPF programs. The reverse of `RINGBUF`.

**When to use it:**
- low-latency userspace-to-kernel messages
- pushing commands or config without one syscall per message

**Avoid it when:**
- a normal map update is simpler and message ordering is unimportant
- the kernel is older than 6.2

```c
struct {
    __uint(type, BPF_MAP_TYPE_USER_RINGBUF);
    __uint(max_entries, 1 << 12);  // bytes, power of 2
} user_rb SEC(".maps");
```

### Kernel Usage

```c
// Consume messages written by userspace
struct bpf_dynptr ptr;
// bpf_user_ringbuf_drain drains all pending messages, calling the callback for each
long callback(struct bpf_dynptr *dynptr, void *ctx) {
    // read message via bpf_dynptr_read
    return 0;
}
bpf_user_ringbuf_drain(&user_rb, callback, NULL, 0);
```

### Userspace — Write

```c
// Use the user_ring_buffer API from libbpf
struct user_ring_buffer *urb = user_ring_buffer__new(map_fd, NULL);
void *sample = user_ring_buffer__reserve(urb, sizeof(struct my_msg));
// fill sample...
user_ring_buffer__submit(urb, sample);
```

**Notes:**
- Available since kernel 6.2
- Requires `bpf_dynptr` to read in kernel space — the dynptr abstracts the ring buffer pointer
- Use case: passing configuration or commands from userspace to a running eBPF program without a syscall round-trip per message

---

## BPF_MAP_TYPE_CPUMAP

Redirects XDP packets to a specific CPU's RX queue for processing. Used for CPU-level load balancing.

**When to use it:**
- XDP fan-out across CPUs
- steering packet work to dedicated processing cores

```c
struct {
    __uint(type, BPF_MAP_TYPE_CPUMAP);
    __uint(max_entries, 8);   // number of CPUs
    __uint(key_size, sizeof(u32));
    __uint(value_size, sizeof(struct bpf_cpumap_val));
} cpu_map SEC(".maps");
```

### Kernel Usage

```c
SEC("xdp")
int xdp_lb(struct xdp_md *ctx) {
    u32 cpu = bpf_get_smp_processor_id() % 4;
    return bpf_redirect_map(&cpu_map, cpu, 0);
}
```

### Userspace — Configure

```c
struct bpf_cpumap_val val = {
    .qsize = 192,  // queue depth per CPU
};
u32 cpu = 2;
bpf_map_update_elem(fd, &cpu, &val, BPF_ANY);
```

**Notes:**
- Available since kernel 4.15
- The CPUMAP entry can optionally run a second XDP program on the target CPU after redirect
- Common use: RSS-like load balancing, isolating packet processing to dedicated CPUs

---

## BPF_MAP_TYPE_XSKMAP

Maps AF_XDP sockets (XSK). Enables XDP programs to redirect packets directly into zero-copy AF_XDP sockets.

**When to use it:**
- AF_XDP userspace packet processing
- zero-copy packet capture or forwarding pipelines

```c
struct {
    __uint(type, BPF_MAP_TYPE_XSKMAP);
    __uint(max_entries, 8);
    __uint(key_size, sizeof(int));
    __uint(value_size, sizeof(int));
} xsks_map SEC(".maps");
```

### Kernel Usage

```c
SEC("xdp")
int xdp_sock_redirect(struct xdp_md *ctx) {
    u32 index = ctx->rx_queue_index;
    if (bpf_map_lookup_elem(&xsks_map, &index))
        return bpf_redirect_map(&xsks_map, index, XDP_PASS);
    return XDP_PASS;
}
```

**Notes:**
- Available since kernel 4.18
- AF_XDP provides kernel-bypass packet I/O — packets go from NIC directly to userspace memory
- Userspace registers XSK sockets and inserts their FDs into this map
- Use case: DPDK-like performance without a kernel module; high-frequency trading, packet capture

---

## BPF_MAP_TYPE_DEVMAP / BPF_MAP_TYPE_DEVMAP_HASH

Maps network device ifindexes. Used by XDP programs to redirect packets to other network interfaces.

**When to use it:**
- XDP redirect to another NIC or veth
- device fan-out or chaining to an egress XDP program

```c
// DEVMAP — array-indexed by integer key
struct {
    __uint(type, BPF_MAP_TYPE_DEVMAP);
    __uint(max_entries, 256);
    __uint(key_size, sizeof(u32));
    __uint(value_size, sizeof(struct bpf_devmap_val));
} tx_ports SEC(".maps");

// DEVMAP_HASH — hash-indexed, for sparse ifindex sets
struct {
    __uint(type, BPF_MAP_TYPE_DEVMAP_HASH);
    __uint(max_entries, 32);
    __uint(key_size, sizeof(u32));
    __uint(value_size, sizeof(struct bpf_devmap_val));
} tx_ports_hash SEC(".maps");
```

### Kernel Usage

```c
SEC("xdp")
int xdp_redirect(struct xdp_md *ctx) {
    u32 ifindex = 5;
    return bpf_redirect_map(&tx_ports, ifindex, XDP_DROP);
}
```

### Userspace — Populate

```c
struct bpf_devmap_val val = {
    .ifindex = 5,
    // optional: .bpf_prog.fd = egress_prog_fd  (run XDP prog on egress)
};
u32 key = 5;
bpf_map_update_elem(fd, &key, &val, BPF_ANY);
```

**Notes:**
- Available since kernel 4.14 (DEVMAP), 5.4 (DEVMAP_HASH)
- A `bpf_prog.fd` in the value runs an additional XDP program on the egress device
- Use `DEVMAP_HASH` when ifindexes are sparse or unknown at compile time

---

## Per-Object Storage Maps

Attach arbitrary data to kernel objects (sockets, tasks, inodes, cgroups) without modifying kernel structs.

**When to use them:**
- state should be tied to object lifetime
- manual cleanup in a hash map would be error-prone
- pointer-keyed hash maps would be awkward or racy

```c
// Socket storage — data lives as long as the socket
struct {
    __uint(type, BPF_MAP_TYPE_SK_STORAGE);
    __uint(map_flags, BPF_F_NO_PREALLOC);
    __type(key, int);                  // key is always sock fd / pointer
    __type(value, struct my_sk_data);
} sk_store SEC(".maps");

// Task storage — data lives as long as the task_struct
struct {
    __uint(type, BPF_MAP_TYPE_TASK_STORAGE);
    __uint(map_flags, BPF_F_NO_PREALLOC);
    __type(key, int);
    __type(value, struct my_task_data);
} task_store SEC(".maps");

// Inode storage
struct {
    __uint(type, BPF_MAP_TYPE_INODE_STORAGE);
    __uint(map_flags, BPF_F_NO_PREALLOC);
    __type(key, int);
    __type(value, struct my_inode_data);
} inode_store SEC(".maps");

// Cgroup object storage (kernel ≥ 5.16)
struct {
    __uint(type, BPF_MAP_TYPE_CGRP_STORAGE);
    __uint(map_flags, BPF_F_NO_PREALLOC);
    __type(key, int);
    __type(value, struct my_cgrp_data);
} cgrp_store SEC(".maps");
```

### Kernel Usage

```c
// Get-or-create storage for the current socket
struct my_sk_data *data = bpf_sk_storage_get(&sk_store, sk, NULL, BPF_SK_STORAGE_GET_F_CREATE);
if (!data)
    return 0;
data->bytes_sent += skb->len;

// Task storage
struct my_task_data *td = bpf_task_storage_get(&task_store, task, NULL, BPF_LOCAL_STORAGE_GET_F_CREATE);

// Delete storage for an object
bpf_sk_storage_delete(&sk_store, sk);
```

### Real Pattern: Per-Socket Throttled Monitoring

A common production idiom — use SK_STORAGE to rate-limit stats collection per socket rather than sampling on every event:

```c
struct dump_state {
    __u64 next_dump_ns;   // timestamp after which we'll dump again
    __u64 bytes_sent;
};

struct {
    __uint(type, BPF_MAP_TYPE_SK_STORAGE);
    __uint(map_flags, BPF_F_NO_PREALLOC);
    __type(key, int);
    __type(value, struct dump_state);
} sock_stats SEC(".maps");

SEC("sockops")
int track_socket(struct bpf_sock_ops *ctx) {
    struct dump_state *s = bpf_sk_storage_get(&sock_stats, ctx->sk, NULL,
                                               BPF_SK_STORAGE_GET_F_CREATE);
    if (!s) return 1;

    __u64 now = bpf_ktime_get_ns();
    if (now < s->next_dump_ns)
        return 1;  // throttle: too soon since last dump

    s->next_dump_ns = now + 1000000000ULL;  // next dump in 1 second
    // ... emit stats to ring buffer
    return 1;
}
```

**Notes:**
- `BPF_F_NO_PREALLOC` is required for all per-object storage maps
- Storage is automatically freed when the kernel object (socket/task/inode/cgroup) is destroyed — no GC needed
- Much more ergonomic than a HASH map keyed by socket pointer (no manual cleanup, no lock contention)
- Kernel version minimums: SK_STORAGE ≥ 5.2, TASK_STORAGE ≥ 5.11, INODE_STORAGE ≥ 5.10, CGRP_STORAGE ≥ 5.16

---

## BPF_MAP_TYPE_ARENA (kernel ≥ 6.8)

A large, virtually-addressed memory region shared between eBPF programs and userspace. Enables pointer-based data structures (linked lists, trees) in BPF.

**When to use it:**
- shared pointer-rich structures really are required
- both userspace and BPF need zero-copy access to the same memory graph

**Avoid it when:**
- a normal map is sufficient
- broad kernel compatibility matters

```c
struct {
    __uint(type, BPF_MAP_TYPE_ARENA);
    __uint(map_flags, BPF_F_MMAPABLE);
    __uint(max_entries, 1 << 20);  // virtual address space size in bytes
} arena SEC(".maps");
```

### Usage

```c
// Allocate from the arena via bpf_arena_alloc_pages kfunc
void *ptr = bpf_arena_alloc_pages(&arena, NULL, 1, NUMA_NO_NODE, 0);

// In userspace: mmap the arena to access the same memory
void *base = mmap(NULL, size, PROT_READ|PROT_WRITE, MAP_SHARED,
                  bpf_map__fd(skel->maps.arena), 0);
```

**Notes:**
- Available since kernel 6.8 — cutting edge, not widely deployed
- Enables pointer-rich data structures that were impossible with flat maps
- Both BPF programs and userspace see the same virtual addresses — zero-copy sharing
- Use case: high-performance shared state, custom allocators, graph structures in BPF
