<!--
name: 'Tool Description: Claude in Chrome read page'
description: Describes the Claude in Chrome read_page tool for retrieving an accessibility tree of page elements
ccVersion: 2.1.173
-->
Get an accessibility tree representation of elements on the page. By default returns all elements including non-visible ones. Output is limited to 50000 characters by default. If the output exceeds this limit, you will receive an error asking you to specify a smaller depth or focus on a specific element using ref_id. Optionally filter for only interactive elements. If you don't have a valid tab ID, use tabs_context_mcp first to get available tabs.
