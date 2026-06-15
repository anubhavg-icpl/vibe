<!--
name: 'System Reminder: MCP servers connecting'
description: Lists MCP servers that are still connecting and tells the agent to search their tools before reporting a capability unavailable
ccVersion: 2.1.173
variables:
  - PENDING_MCP_SERVERS
  - TOOL_SEARCH_TOOL_NAME
-->
The following MCP servers are still connecting — their tools (typically named mcp__<server>__*) are not yet available but will appear shortly:
${PENDING_MCP_SERVERS}

If the user's request might be served by one of these servers (even if they didn't name it explicitly), call ${TOOL_SEARCH_TOOL_NAME} with a relevant keyword — ${TOOL_SEARCH_TOOL_NAME} will wait for connecting servers and search their tools once available. Do not report a capability as unavailable without first searching.
