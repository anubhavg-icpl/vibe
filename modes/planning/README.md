# Planning Modes

Strategic planning, research, and technical investigation modes.

## Available Modes (3)

| Mode                   | Description                                |
| ---------------------- | ------------------------------------------ |
| `plan-mode`            | Strategic planning before implementation   |
| `planning-mode`        | Detailed project planning and roadmapping  |
| `technical-spike-mode` | Research and validate technical approaches |

## Usage

### Plan Mode

For high-level strategic planning:

- Understand requirements before coding
- Break down complex tasks
- Identify risks and dependencies
- Create implementation roadmap

### Planning Mode

Detailed project planning including:

- Task breakdown structure
- Timeline estimation
- Resource allocation
- Milestone definition
- Risk assessment

### Technical Spike Mode

Research-focused exploration:

- Evaluate technology options
- Prototype solutions
- Validate feasibility
- Document findings
- Make recommendations

## Planning Workflow

```
Understand → Research → Plan → Validate → Execute
     ↑                            ↓
     └────── Iterate ─────────────┘
```

1. **Understand**: Clarify requirements with `plan-mode`
2. **Research**: Investigate options with `technical-spike-mode`
3. **Plan**: Create detailed plan with `planning-mode`
4. **Validate**: Review with stakeholders
5. **Execute**: Implement with development modes

## When to Use Each Mode

| Scenario              | Recommended Mode                     |
| --------------------- | ------------------------------------ |
| New feature request   | `plan-mode`                          |
| Project kickoff       | `planning-mode`                      |
| Technology evaluation | `technical-spike-mode`               |
| Architecture decision | `technical-spike-mode` + `plan-mode` |
| Sprint planning       | `planning-mode`                      |
