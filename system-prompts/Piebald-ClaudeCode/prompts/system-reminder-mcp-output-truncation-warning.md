<!--
name: 'System Reminder: MCP output truncation warning'
description: Warns that MCP tool output exceeded the token limit and advises pagination, filtering, or noting incomplete results
ccVersion: 2.1.173
variables:
  - MAX_MCP_OUTPUT_TOKENS_FN
-->


[OUTPUT TRUNCATED - exceeded ${MAX_MCP_OUTPUT_TOKENS_FN()} token limit]

The tool output was truncated. If this MCP server provides pagination or filtering tools, use them to retrieve specific portions of the data. If pagination is not available, inform the user that you are working with truncated output and results may be incomplete.
