<!--
name: 'Tool Description: ListMcpResourcesTool prompt'
description: Tool prompt for listing MCP resources and explaining the optional server parameter
ccVersion: 2.1.173
-->

List available resources from configured MCP servers.
Each returned resource will include all standard MCP resource fields plus a 'server' field 
indicating which server the resource belongs to.

Parameters:
- server (optional): The name of a specific MCP server to get resources from. If not provided,
  resources from all servers will be returned.
