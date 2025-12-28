# Debugging Modes

Troubleshooting and bug investigation modes.

## Available Modes (1)

| Mode | Description |
|------|-------------|
| `debugging-detective-mode` | Systematic debugging and root cause analysis |

## Usage

### Debugging Detective Mode
Systematic approach to debugging:
- Evidence gathering
- Hypothesis formation
- Systematic testing
- Root cause identification
- Fix verification

## Debugging Methodology

### 1. Reproduce
- Identify exact reproduction steps
- Determine consistency (always vs. intermittent)
- Document environment conditions

### 2. Isolate
- Narrow down the scope
- Binary search through code changes
- Eliminate variables

### 3. Identify
- Find the root cause
- Understand why it happens
- Document the chain of events

### 4. Fix
- Implement minimal fix
- Consider side effects
- Write regression test

### 5. Verify
- Confirm fix works
- Test related functionality
- Review for similar issues

## Common Bug Categories

| Type | Symptoms | Approach |
|------|----------|----------|
| Logic Error | Wrong output | Trace data flow |
| Race Condition | Intermittent | Add logging, review timing |
| Memory Leak | Gradual slowdown | Profile memory usage |
| Null Reference | Crashes | Check null handling |
| Off-by-One | Edge case failures | Review boundary conditions |

## Debugging Tools

- Debuggers (breakpoints, step-through)
- Logging and tracing
- Profilers (CPU, memory)
- Network inspectors
- Static analyzers
