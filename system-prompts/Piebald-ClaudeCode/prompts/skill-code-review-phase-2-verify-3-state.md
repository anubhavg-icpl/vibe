<!--
name: 'Skill: Code Review (Phase 2 — verify, 3-state)'
description: Precision-tier verification step: run one verifier per candidate finding, each voting CONFIRMED, PLAUSIBLE, or REFUTED
ccVersion: 2.1.173
variables:
  - AGENT_TOOL_NAME
  - VERIFY_VOTE_DEFINITIONS
-->
## Phase 2 — Verify (1-vote, 3-state)

Dedup candidates that point at the same line/mechanism, keeping the one with
the most concrete failure scenario. For each remaining candidate, run **one
verifier** via the ${AGENT_TOOL_NAME} tool: give it the diff, the relevant
file(s), and the candidate, and have it return exactly one of:

${VERIFY_VOTE_DEFINITIONS}

Keep candidates where the vote is CONFIRMED or PLAUSIBLE.
