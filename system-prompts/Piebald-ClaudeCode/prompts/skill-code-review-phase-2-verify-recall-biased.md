<!--
name: 'Skill: Code Review (Phase 2 — verify, recall-biased)'
description: Recall-tier verification step: one verifier per candidate finding, biased toward keeping anything plausible
ccVersion: 2.1.173
variables:
  - AGENT_TOOL_NAME
  - RECALL_BIASED_RUBRIC
-->
## Phase 2 — Verify (1-vote, recall-biased)

Dedup near-duplicates (same defect, same location, same reason → keep one). For
each remaining candidate, run **one verifier** via the ${AGENT_TOOL_NAME} tool:
give it the diff, the relevant file(s), and the candidate; it returns exactly
one of **CONFIRMED / PLAUSIBLE / REFUTED**.

${RECALL_BIASED_RUBRIC}

Keep **CONFIRMED and PLAUSIBLE**. Drop REFUTED.
