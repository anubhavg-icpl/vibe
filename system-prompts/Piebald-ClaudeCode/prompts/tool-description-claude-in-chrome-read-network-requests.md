<!--
name: 'Tool Description: Claude in Chrome read network requests'
description: Describes the Claude in Chrome read_network_requests tool for inspecting HTTP requests made by the current page
ccVersion: 2.1.173
-->
Read HTTP network requests (XHR, Fetch, documents, images, etc.) from a specific tab. Useful for debugging API calls, monitoring network activity, or understanding what requests a page is making. Returns all network requests made by the current page, including cross-origin requests. Requests are automatically cleared when the page navigates to a different domain. If you don't have a valid tab ID, use tabs_context_mcp first to get available tabs.
