---
name: nasa-power-of-10
description: Use when writing safety-critical, mission-critical, or high-reliability code that must be statically verifiable. Use when the brief mentions "Power of 10", "NASA coding rules", "JPL rules", "safety-critical C", "mission-critical embedded", or "Holzmann rules".
license: CC-BY-NC-SA-4.0
metadata:
  version: 1.0.0
  tags: [safety-critical, embedded, c, static-analysis, misra, power-of-10, nasa, jpl]
---

# NASA Power of 10 Rules

## Overview

The Power of 10 is a set of strict coding rules developed by Gerard Holzmann at NASA's Jet Propulsion Laboratory. The goal: make code so constrained that it becomes fully statically analyzable. These rules eliminate entire classes of bugs by restricting language features to a provably safe subset.

Originally designed for C in spacecraft systems, the principles apply to any safety-critical or high-reliability codebase: medical devices, automotive, aviation, industrial control, financial infrastructure.

## The 10 Rules

### 1. Simple Control Flow

No `goto`, `setjmp`, `longjmp`, or recursion.

**Why:** These constructs create cyclic control flow graphs that defeat static analysis and make it impossible to prove termination. Recursion hides unbounded stack growth.

**Apply:** Use structured loops (`for`, `while`) with a single entry and single exit per block. Flatten recursive algorithms into iterative ones with explicit stacks.

### 2. Fixed Upper Bounds on Loops

Every loop must have a hard iteration limit, even when traversing dynamic structures like linked lists.

**Why:** Prevents infinite loops. Forces the developer to think about worst-case iteration counts and make them explicit.

**Apply:**
```c
// BAD: no bound
while (node != NULL) { node = node->next; }

// GOOD: explicit bound
#define MAX_NODES 1024
for (int i = 0; node != NULL && i < MAX_NODES; i++) { node = node->next; }
```

### 3. No Dynamic Memory Allocation

Use only stack memory with a predefined upper bound. No `malloc`, `calloc`, `realloc`, or `free`.

**Why:** Eliminates memory leaks, use-after-free, double-free, and heap fragmentation entirely. Stack usage is statically predictable.

**Apply:** Pre-allocate all buffers with maximum sizes at compile time. Use fixed-size arrays and pools instead of dynamic containers.

### 4. Short Functions

No function longer than approximately 60 lines (one printed page). Each function performs exactly one action.

**Why:** Short functions are readable, reviewable, and unit-testable in isolation. A function that does one thing is easier to prove correct.

**Apply:** If a function exceeds 60 lines, split it. The 60-line limit forces discipline around single-responsibility.

### 5. Minimal Scope (Hide Data)

Declare variables at the lowest possible scope. No global variables unless absolutely necessary.

**Why:** Reduces the surface area of code that can access and mutate state. Narrower scope = easier debugging = fewer surprise interactions.

**Apply:** Declare loop counters inside the loop. Declare temporaries inside the block that uses them. Pass data through parameters, not globals.

### 6. Check All Return Values

Every non-void function's return value must be checked. If intentionally ignored, cast to `void` explicitly.

**Why:** An unchecked return value is a silent failure waiting to happen. Explicit `(void)` casts signal intentional decisions to reviewers.

**Apply:**
```c
// BAD: return value ignored
fopen("data.txt", "r");

// GOOD: checked
FILE *f = fopen("data.txt", "r");
if (f == NULL) { handle_error(); }

// OK: explicitly discarded
(void)printf("status: %d\n", code);
```

### 7. Limit the C Preprocessor

Restrict the preprocessor to file inclusions (`#include`) and simple conditional macros. No macro-based code generation or complex conditional compilation.

**Why:** The preprocessor is a hidden code obfuscator. With N compile-time flags, you create 2^N compilation targets. Ten flags = 1,024 targets to test.

**Apply:** Replace macros with inline functions or enums. Avoid `#ifdef` chains that change behavior at compile time. Keep conditional compilation to platform-selection headers only.

### 8. Restrict Pointer Use

No pointer dereferencing more than one level deep. Limit function pointers.

**Why:** Multi-level dereferences (`**pp`, `***ppp`) are error-prone and obscure data ownership. Function pointers hide the control flow graph, making static analysis unreliable.

**Apply:**
```c
// BAD: double dereference
int **matrix = ...;
val = **matrix;

// GOOD: single dereference with named intermediate
int *row = matrix[i];
val = row[j];
```

Replace function pointer dispatch tables with explicit switch statements when safety trumps extensibility.

### 9. Compile Strictly

Compile with all warnings enabled and in pedantic mode. Treat every warning as an error.

**Why:** The compiler is your cheapest static analyzer. Pedantic mode catches undefined behavior, implicit conversions, and portability issues before runtime.

**Apply:**
```bash
# GCC / Clang
gcc -Wall -Wextra -Wpedantic -Werror -std=c11 -O2

# MSVC
cl /W4 /WX /permissive- /std:c11
```

Zero warnings. Zero exceptions.

### 10. Static Analysis and Unit Testing

Code must pass multiple static analyzers with different rule sets and be thoroughly unit tested.

**Why:** No single analyzer catches everything. Different analyzers use different formal methods and heuristics. Layering them maximizes coverage.

**Apply:**
- Run at least two static analyzers (e.g., Coverity + Clang Static Analyzer, or PC-lint + Polyspace)
- Achieve 100% statement coverage and 100% branch coverage on unit tests
- Run analyzers in CI, not just locally

## When to Apply

| Context | Apply Full Set | Apply Subset |
|---------|---------------|--------------|
| Spacecraft / avionics | All 10 | - |
| Medical devices (Class III) | All 10 | - |
| Automotive (ASIL-D) | All 10 | - |
| Financial trading systems | - | Rules 1-6, 9-10 |
| General backend services | - | Rules 4-6, 9-10 |
| Web applications | - | Rules 4-6, 9 |
| Prototyping / research | - | Rules 9-10 only |

## Quick Reference

| # | Rule | Key Constraint |
|---|------|---------------|
| 1 | Simple control flow | No goto, setjmp, longjmp, recursion |
| 2 | Loop bounds | Hard upper limit on every loop |
| 3 | No heap | Stack-only, pre-allocated |
| 4 | Short functions | Max ~60 lines, single purpose |
| 5 | Minimal scope | Lowest possible variable scope |
| 6 | Check returns | All return values checked or cast to void |
| 7 | Limited preprocessor | Include and simple macros only |
| 8 | Restrict pointers | Single dereference, limit function pointers |
| 9 | Strict compilation | All warnings, pedantic, warnings-as-errors |
| 10 | Analysis + testing | Multiple static analyzers, full unit test coverage |

## Common Mistakes

- **Treating these as guidelines, not rules.** The power comes from zero exceptions. One `goto` or one unchecked return invalidates the static analysis guarantee for the entire call chain.
- **Applying only at review time.** These must be enforced by CI, not by human memory. Automate with compiler flags, linters, and analyzers.
- **Skipping rule 10 because rules 1-9 "should be enough."** Rules 1-9 constrain the code so rule 10 (analysis) becomes tractable. You need both.
- **Using function pointers "for extensibility" in safety-critical paths.** Extensibility and verifiability trade off. In safety-critical code, verifiability wins.

## Sources

- Holzmann, G. J. (2006). "The Power of 10: Rules for Developing Safety-Critical Code." *IEEE Computer*, 39(6), 95-99.
- NASA JPL Laboratory for Reliable Software (LaRS)
