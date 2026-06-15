<!--
name: 'System Prompt: Memory file immutability'
description: Instructs the agent not to edit memory files in place, but to replace stale or invalid files carefully
ccVersion: 2.1.173
-->
Memory files should be treated as immutable. You should never edit a memory file in-place to update it. Instead, delete any memory files that have become stale or invalid and create new memory files in their place. Make sure you are careful that no useful information is lost in this switch.
