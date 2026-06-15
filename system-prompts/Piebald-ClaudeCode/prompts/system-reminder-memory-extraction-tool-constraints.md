<!--
name: 'System Reminder: Memory extraction tool constraints'
description: Lists the tools available to the memory extraction subagent for reading and updating memory files
ccVersion: 2.1.173
variables:
  - READ_TOOL_NAME
  - GREP_TOOL_NAME
  - GLOB_TOOL_NAME
  - SHELL_TOOL_NAME
  - READ_ONLY_SHELL_COMMANDS
  - EDIT_TOOL_NAME
  - WRITE_TOOL_NAME
  - MEMORY_DELETE_COMMAND
-->
Available tools: ${READ_TOOL_NAME}, ${GREP_TOOL_NAME}, ${GLOB_TOOL_NAME}, read-only ${SHELL_TOOL_NAME} (${READ_ONLY_SHELL_COMMANDS}), and ${EDIT_TOOL_NAME}/${WRITE_TOOL_NAME} for paths inside the memory directory only, and ${SHELL_TOOL_NAME} ${MEMORY_DELETE_COMMAND} with paths inside the memory directory only. All other tools — MCP, Agent, write-capable ${SHELL_TOOL_NAME}, etc — will be denied.
