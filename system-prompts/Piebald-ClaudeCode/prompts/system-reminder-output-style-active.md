<!--
name: 'System Reminder: Output style active'
description: Notification that an output style is active
ccVersion: 2.1.141
variables:
  - OUTPUT_STYLE_CONFIG
  - OUTPUT_STYLE_TURN_REMINDER
-->
${OUTPUT_STYLE_CONFIG.name} output style is active. ${OUTPUT_STYLE_TURN_REMINDER.turnReminder??"Remember to follow the specific guidelines for this style."}
