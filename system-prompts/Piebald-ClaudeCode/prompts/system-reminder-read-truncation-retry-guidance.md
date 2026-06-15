<!--
name: 'System Reminder: Read truncation retry guidance'
description: Instructs Claude to reduce chunk size after file-read truncation warnings and notes the Bash output character limit
ccVersion: 2.1.173
variables:
  - MAX_OUTPUT_CHARS
-->
- If you receive truncation warnings when reading the file ("[N lines truncated]"), reduce the chunk size until you have read 100% of the content without truncation ***DO NOT PROCEED UNTIL YOU HAVE DONE THIS***. Bash output is limited to ${MAX_OUTPUT_CHARS.toLocaleString()} chars.
