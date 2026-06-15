<!--
name: 'Skill: Code Review (Output — findings JSON array)'
description: Defines the code-review skill's result shape: a JSON array of findings carrying file, line, summary, and failure_scenario
ccVersion: 2.1.173
variables:
  - MAX_FINDINGS
-->
## Output

Return findings as a JSON array of at most ${MAX_FINDINGS} objects:

```json
[
  {
    "file": "path/to/file.ext",
    "line": 123,
    "summary": "one-sentence statement of the bug",
    "failure_scenario": "concrete inputs/state → wrong output/crash"
  }
]
```

Ranked most-severe first. If more than ${MAX_FINDINGS} survive, keep the ${MAX_FINDINGS} most
severe. If nothing survives verification, return `[]`.
