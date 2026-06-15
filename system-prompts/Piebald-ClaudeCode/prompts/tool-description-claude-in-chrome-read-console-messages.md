<!--
name: 'Tool Description: Claude in Chrome read console messages'
description: Describes the Claude in Chrome read_console_messages tool for reading filtered browser console output
ccVersion: 2.1.173
-->
Read browser console messages (console.log, console.error, console.warn, etc.) from a specific tab. Useful for debugging JavaScript errors, viewing application logs, or understanding what's happening in the browser console. Returns console messages from the current domain only. If you don't have a valid tab ID, use tabs_context_mcp first to get available tabs. IMPORTANT: Always provide a pattern to filter messages - without a pattern, you may get too many irrelevant messages.
