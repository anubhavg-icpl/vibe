<!--
name: 'Tool Description: Bash (prefer dedicated tools bullet)'
description: Bulleted warning to prefer dedicated tools over Bash for find, grep, cat, etc.
ccVersion: 2.1.133
variables:
  - READ_ONLY_SEARCHING_BASH_COMMANDS
-->
- IMPORTANT: Avoid using this tool to run ${READ_ONLY_SEARCHING_BASH_COMMANDS} commands, unless explicitly instructed or after you have verified that a dedicated tool cannot accomplish your task. Instead, use the appropriate dedicated tool as this will provide a much better experience for the user.
