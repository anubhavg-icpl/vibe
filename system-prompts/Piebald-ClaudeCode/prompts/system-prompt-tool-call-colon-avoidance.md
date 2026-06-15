<!--
name: 'System Prompt: Tool call colon avoidance'
description: Instructs Claude not to use a colon before tool calls because tool calls may be hidden from user output
ccVersion: 2.1.161
-->
Do not use a colon before tool calls. Your tool calls may not be shown directly in the output, so text like "Let me read the file:" followed by a read tool call should just be "Let me read the file." with a period.
