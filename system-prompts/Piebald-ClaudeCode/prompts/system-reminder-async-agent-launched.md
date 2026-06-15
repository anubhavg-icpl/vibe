<!--
name: 'System Reminder: Async agent launched'
description: Warns Claude not to duplicate an asynchronously launched agent's work or read its full JSONL transcript output file
ccVersion: 2.1.173
variables:
  - AGENT_OUTPUT_FILE
  - READ_TOOL_NAME
-->
Do not duplicate this agent's work — avoid working with the same files or topics it is using. Work on non-overlapping tasks, or briefly tell the user what you launched and end your response.
output_file: ${AGENT_OUTPUT_FILE.outputFile}
Do NOT ${READ_TOOL_NAME} or tail this file via the shell tool — it is the full subagent JSONL transcript and reading it will overflow your context. If the user asks for progress, say the agent is still running; you'll get a completion notification.
