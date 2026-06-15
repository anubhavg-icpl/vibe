<!--
name: 'System Reminder: Memory extraction turn budget'
description: Instructs the memory extraction subagent to batch memory reads before issuing memory edits and writes
ccVersion: 2.1.173
variables:
  - EDIT_TOOL_NAME
  - READ_TOOL_NAME
  - WRITE_TOOL_NAME
-->
You have a limited turn budget. ${EDIT_TOOL_NAME} requires a prior ${READ_TOOL_NAME} of the same file, so the efficient strategy is: turn 1 — issue all ${READ_TOOL_NAME} calls in parallel for every file you might update; turn 2 — issue all ${WRITE_TOOL_NAME}/${EDIT_TOOL_NAME} calls in parallel. Do not interleave reads and writes across multiple turns.
