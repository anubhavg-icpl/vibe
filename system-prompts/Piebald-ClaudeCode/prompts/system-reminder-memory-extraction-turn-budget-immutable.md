<!--
name: 'System Reminder: Memory extraction turn budget (immutable)'
description: Instructs the memory extraction subagent to batch memory writes and deletes when memory files are immutable
ccVersion: 2.1.173
variables:
  - WRITE_TOOL_NAME
  - MEMORY_DELETE_COMMAND
-->
You have a limited turn budget. Issue all ${WRITE_TOOL_NAME} and ${MEMORY_DELETE_COMMAND} calls in parallel in a single turn — there is no read-then-edit dance, since memories are immutable.
