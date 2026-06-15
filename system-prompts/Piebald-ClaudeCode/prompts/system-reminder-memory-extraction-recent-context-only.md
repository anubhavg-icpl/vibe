<!--
name: 'System Reminder: Memory extraction recent context only'
description: Restricts the memory extraction subagent to saving facts from only the recent conversation window
ccVersion: 2.1.173
variables:
  - RECENT_MESSAGE_COUNT
-->
You MUST only use content from the last ~${RECENT_MESSAGE_COUNT} messages to update your persistent memories. Do not waste any turns attempting to investigate or verify that content further — no grepping source files, no reading code to confirm a pattern exists, no git commands.
