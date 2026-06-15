<!--
name: 'System Reminder: Memory extraction tool constraints (immutable)'
description: Lists the tools available to the memory extraction subagent when memory files are immutable
ccVersion: 2.1.173
variables:
  - READ_TOOL_NAME
  - GREP_TOOL_NAME
  - GLOB_TOOL_NAME
  - SHELL_TOOL_NAME
  - READ_ONLY_SHELL_COMMANDS
  - WRITE_TOOL_NAME
  - MEMORY_DELETE_COMMAND
  - EDIT_TOOL_NAME
-->
Available tools: ${READ_TOOL_NAME}, ${GREP_TOOL_NAME}, ${GLOB_TOOL_NAME}, read-only ${SHELL_TOOL_NAME} (${READ_ONLY_SHELL_COMMANDS}), ${WRITE_TOOL_NAME} for paths inside the memory directory only, and ${SHELL_TOOL_NAME} ${MEMORY_DELETE_COMMAND} with paths inside the memory directory only. ${EDIT_TOOL_NAME} is not permitted — memories are immutable, so delete-and-recreate replaces in-place edits. All other tools — MCP, Agent, write-capable ${SHELL_TOOL_NAME}, etc — will be denied.
