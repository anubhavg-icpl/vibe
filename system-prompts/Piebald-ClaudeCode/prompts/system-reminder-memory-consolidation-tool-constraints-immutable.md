<!--
name: 'System Reminder: Memory consolidation tool constraints (immutable)'
description: Restricts the memory consolidation job to read-only shell access plus deleting and rewriting immutable memory files
ccVersion: 2.1.173
variables:
  - EDIT_TOOL_NAME
  - WRITE_TOOL_NAME
-->


**Tool constraints for this run:** Shell access is restricted to read-only commands (`ls`, `find`, `grep`, `cat`, `stat`, `wc`, `head`, `tail`, and similar) plus deleting `.md` paths inside the memory directory. ${EDIT_TOOL_NAME} is not permitted — memories are immutable, so delete + ${WRITE_TOOL_NAME} to replace, never edit in place. Plan your exploration with this in mind — no need to probe.
