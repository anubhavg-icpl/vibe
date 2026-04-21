# Tail Calls and Map-in-Map

## Related Guidance

- For cross-kernel compatibility checks, see `workflows/testing.md`.
- If program context types, inner-map behavior, or related kernel objects are unclear, check Linux kernel source and kernel docs directly.

---

## BPF_MAP_TYPE_PROG_ARRAY (Tail Calls)

An array whose values are eBPF program file descriptors. Used to chain programs together via tail calls, splitting large programs that would exceed the instruction limit.

### Declaration

```c
struct {
    __uint(type, BPF_MAP_TYPE_PROG_ARRAY);
    __type(key, __u32);
    __uint(max_entries, 8);
    // Optionally initialize at load time with skeleton:
    __array(values, int(struct pt_regs *));
} tail_programs SEC(".maps") = {
    .values = {
        [0] = (void *)&handle_stage_0,
        [1] = (void *)&handle_stage_1,
    },
};
```

### Kernel Usage

```c
// Tail call — transfers execution to the program at index 2
// Does NOT return if successful. If the index is empty or invalid, execution continues here.
bpf_tail_call(ctx, &tail_programs, 2);

// Execution only reaches here if the tail call failed
bpf_printk("tail call index 2 not populated\n");
return 0;
```

### Userspace — Populate at Runtime

```c
int prog_fd = bpf_program__fd(skel->progs.handle_stage_2);
__u32 key   = 2;
bpf_map_update_elem(bpf_map__fd(skel->maps.tail_programs), &key, &prog_fd, BPF_ANY);
```

**Notes:**
- A tail call replaces the current stack frame — does not consume additional stack
- Max tail call chain: 33 (kernel default, configurable with `BPF_MAP_TYPE_PROG_ARRAY` depth limit)
- All programs in the array must be of the same type as the caller
- Common pattern: pipeline stages (parse → filter → action), or splitting a program that exceeds 1M instructions
- The caller and callee share the same maps — pass state via a per-CPU array or the map itself

---

## BPF_MAP_TYPE_ARRAY_OF_MAPS / BPF_MAP_TYPE_HASH_OF_MAPS

Outer maps whose values are inner map file descriptors. Enables dynamic, per-key map selection — e.g. per-CPU or per-container maps.

### Declaration

Inner map type must be defined first as a prototype:

```c
// Inner map prototype — defines the structure of each inner map
struct inner_map {
    __uint(type, BPF_MAP_TYPE_HASH);
    __type(key, u32);
    __type(value, u64);
    __uint(max_entries, 256);
} inner_map_proto SEC(".maps");

// Outer array-of-maps
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY_OF_MAPS);
    __uint(max_entries, 4);
    __type(key, u32);
    __array(values, struct inner_map);  // references the prototype
} outer_map SEC(".maps");

// Or outer hash-of-maps — arbitrary key type
struct {
    __uint(type, BPF_MAP_TYPE_HASH_OF_MAPS);
    __uint(max_entries, 64);
    __type(key, u64);
    __array(values, struct inner_map);
} outer_hash SEC(".maps");
```

### Kernel Usage

```c
// Look up the inner map for this CPU/container
u32 index = bpf_get_smp_processor_id();
void *inner = bpf_map_lookup_elem(&outer_map, &index);
if (!inner)
    return 0;

// Use the inner map normally
u32 key = 0;
u64 *val = bpf_map_lookup_elem(inner, &key);
```

### Userspace — Populate Inner Maps

```c
// Create a new inner map
int inner_fd = bpf_map_create(BPF_MAP_TYPE_HASH, NULL, sizeof(u32), sizeof(u64), 256, NULL);

// Insert it into the outer map
u32 key = 0;
bpf_map_update_elem(bpf_map__fd(skel->maps.outer_map), &key, &inner_fd, BPF_ANY);

// The kernel holds its own reference — safe to close your fd
close(inner_fd);
```

**Notes:**
- Inner map FDs in the outer map are kernel references — closing userspace FD after insertion is safe
- Each inner map can have different contents but must match the prototype's structure
- Common use: per-CPU maps, per-container/cgroup maps, dynamic policy tables
- `ARRAY_OF_MAPS`: integer keys `[0, max_entries)`, pre-allocated
- `HASH_OF_MAPS`: arbitrary keys, dynamic, can be deleted
