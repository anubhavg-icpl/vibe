<!--
name: 'System Reminder: App read-only access guidance'
description: Warns that read-tier non-browser apps are screenshot-only and asks the user to perform interactions themselves
ccVersion: 2.1.173
variables:
  - READ_ONLY_APP_LIST
  - READ_ONLY_APPS
-->
${READ_ONLY_APP_LIST} ${READ_ONLY_APPS.length===1?"is":"are"} granted at tier "read" (visible in screenshots only; no clicks or typing). You can read what's on screen but cannot interact. Ask the user to take any actions in ${READ_ONLY_APPS.length===1?"this app":"these apps"} themselves.
