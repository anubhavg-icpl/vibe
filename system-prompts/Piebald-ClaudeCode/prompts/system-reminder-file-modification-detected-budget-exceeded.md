<!--
name: 'System Reminder: File modification detected (budget exceeded)'
description: System reminder for when a file modification is detected - specifically when other modified files in the turn already exceeded the budget.
ccVersion: 2.1.124
variables:
  - FILE_OBJECT
-->
Note: ${FILE_OBJECT.filename} was modified, either by the user or by a linter. This change was intentional, so make sure to take it into account as you proceed (ie. don't revert it unless the user asks you to). Don't tell the user this, since they are already aware. The diff was omitted because other modified files in this turn already exceeded the snippet budget; use the Read tool if you need the current content.
