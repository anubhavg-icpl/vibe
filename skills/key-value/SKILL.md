---
name: key-value
description: key-value
risk: unknown
source: community
kind: mode
category: map-types
---

# Key-Value Maps

General-purpose maps for storing state in eBPF programs.

## Related Guidance

- For cross-kernel compatibility checks, see `workflows/testing.md`.
- If a struct layout, map value shape, or referenced kernel object is unclear, check Linux kernel source and kernel docs directly to understand the underlying object semantics.

## Quick Choice

- Use `HASH` for ordinary key-value state with bounded size.
- Use `LRU_HASH` when the keyspace is effectively unbounded and eviction is preferable to insertion failure.
- Use `ARRAY` when keys are dense integers and the size is known in advance.
- Use `PERCPU_*` variants for counters and histograms that should avoid cross-CPU contention.
- Use `LPM_TRIE` for CIDR and prefix matching.

This file is the canonical home for `LPM_TRIE`.

---

## BPF_MAP_TYPE_HASH

Arbitrary key-value store. Keys are hashed — O(1) average lookup. Memory is dynamically allocated up to `max_entries`.

**When to use it:**
- bounded state tables
- connection or PID keyed state when you want explicit insert failure on exhaustion
- general-purpose state when no more specialized map is clearly better

```c
struct {
    __uint(type, BPF_MAP_TYPE_HASH);
    __type(key, u32);      // any fixed-size type
    __type(value, u64);
    __uint(max_entries, 10240);
} pid_map SEC(".maps");
```

### Kernel Operations

```c
// Lookup — returns NULL if key not found
u64 *val = bpf_map_lookup_elem(&pid_map, &pid);
if (!val)
    return 0;  // always check for NULL

// Insert or update
u64 count = 1;
bpf_map_update_elem(&pid_map, &pid, &count, BPF_ANY);
// BPF_ANY   — insert or update
// BPF_NOEXIST — insert only, fail if key exists
// BPF_EXIST   — update only, fail if key missing

// Delete
bpf_map_delete_elem(&pid_map, &pid);

// Atomic increment (no lock needed)
u64 *cnt = bpf_map_lookup_elem(&pid_map, &pid);
if (cnt)
    __sync_fetch_and_add(cnt, 1);
```

### Optional Flags

```c
// Don't pre-allocate all entries upfront — saves memory, but update can fail under pressure
__uint(map_flags, BPF_F_NO_PREALLOC);

// Pin to BPF filesystem — map persists after program exits, shareable between programs
__uint(pinning, LIBBPF_PIN_BY_NAME);
// Access pinned map: bpftool map dump pinned /sys/fs/bpf/pid_map
```

### Per-CPU Variant

```c
// Each CPU has its own copy — eliminates lock contention for counters
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_HASH);
    __type(key, u32);
    __type(value, u64);
    __uint(max_entries, 10240);
} percpu_map SEC(".maps");
```

Userspace reads all CPUs at once and aggregates:
```c
u64 values[libbpf_num_possible_cpus()];
bpf_map_lookup_elem(map_fd, &key, values);
u64 total = 0;
for (int i = 0; i < ncpus; i++) total += values[i];
```

---

## BPF_MAP_TYPE_LRU_HASH

Like HASH but automatically evicts the least-recently-used entry when full. Use when the keyspace is unbounded (e.g. per-connection, per-IP tracking).

**When to use it:**
- connection tracking
- IP or socket-cookie keyed state
- any table where old entries are less valuable than admission of new ones

```c
struct {
    __uint(type, BPF_MAP_TYPE_LRU_HASH);
    __type(key, u64);   // e.g. socket cookie, connection tuple
    __type(value, struct conn_state);
    __uint(max_entries, 65536);
} conn_map SEC(".maps");
```

Same kernel API as HASH (`bpf_map_lookup_elem`, `bpf_map_update_elem`, `bpf_map_delete_elem`).

**Notes:**
- LRU eviction happens automatically — you may lose entries you haven't accessed recently
- Per-CPU variant: `BPF_MAP_TYPE_LRU_PERCPU_HASH`
- Eviction is global across CPUs by default; use `BPF_F_NO_COMMON_LRU` for per-CPU LRU lists

---

## BPF_MAP_TYPE_ARRAY

Integer-indexed array. Keys are `[0, max_entries)`. All entries pre-allocated and zero-initialized at load time — lookups never return NULL.

**When to use it:**
- small fixed keyspaces
- global flags or compact indexed state
- fast counters, especially with `PERCPU_ARRAY`

```c
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __type(key, u32);
    __type(value, u64);
    __uint(max_entries, 256);
} counters SEC(".maps");
```

### Kernel Operations

```c
u32 key = 0;
u64 *val = bpf_map_lookup_elem(&counters, &key);
// val is NEVER NULL for array maps — no NULL check required
__sync_fetch_and_add(val, 1);
```

**Notes:**
- Cannot delete entries (key space is fixed)
- Faster than HASH for small, known key sets
- `BPF_MAP_TYPE_PERCPU_ARRAY` for lock-free per-CPU counters
- Often used for global config/flags readable from both kernel and userspace

### Per-CPU Array

```c
struct {
    __uint(type, BPF_MAP_TYPE_PERCPU_ARRAY);
    __type(key, u32);
    __type(value, u64);
    __uint(max_entries, 1);
} global_counter SEC(".maps");
```

---

## BPF_MAP_TYPE_LPM_TRIE

Longest Prefix Match trie. Looks up the most specific matching prefix. Essential for CIDR/subnet-based policy.

**When to use it:**
- IPv4 or IPv6 CIDR matching
- routing, firewall, and policy lookups
- longest-prefix semantics where exact hash matching is the wrong primitive

```c
struct lpm_key {
    __u32 prefixlen;   // significant bits (e.g. 24 for /24)
    __u8  data[4];     // IPv4; use data[16] for IPv6
};

struct {
    __uint(type, BPF_MAP_TYPE_LPM_TRIE);
    __type(key, struct lpm_key);
    __type(value, u32);             // e.g. policy ID
    __uint(max_entries, 4096);
    __uint(map_flags, BPF_F_NO_PREALLOC);  // required
} cidr_map SEC(".maps");
```

### Kernel Usage

```c
struct lpm_key k = { .prefixlen = 32, .data = { 10, 0, 0, 1 } };
u32 *policy = bpf_map_lookup_elem(&cidr_map, &k);
// Returns the longest-matching prefix entry, e.g. the /24 if 10.0.0.0/24 is in the map
```

**Notes:**
- `BPF_F_NO_PREALLOC` is mandatory
- Available since kernel 4.11
- Key must start with `__u32 prefixlen` — ABI requirement
- Lookups match the longest (most specific) prefix — 10.0.0.0/24 wins over 10.0.0.0/8

---

## Choosing Between Map Types

| | HASH | LRU_HASH | ARRAY | LPM_TRIE |
|-|------|----------|-------|----------|
| Key type | Any | Any | u32 integer | Prefixed byte array |
| Lookup miss | Returns NULL | Returns NULL | Never NULL | Returns NULL |
| Full behavior | Fails insert | Evicts LRU | N/A (fixed) | Fails insert |
| Memory | Dynamic | Dynamic | Pre-allocated | Dynamic (no prealloc) |
| Use when | Bounded keyspace | Unbounded keyspace | Small fixed key set | Subnet / prefix matching |
