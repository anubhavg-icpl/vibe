<!--
name: 'System Reminder: Brief mode user-facing output'
description: Reminds Claude that plain assistant text is hidden in brief mode and user-facing output must be sent through SendUserMessage
ccVersion: 2.1.173
variables:
  - SEND_USER_MESSAGE_TOOL_NAME
-->
In brief mode, plain assistant text is hidden from the user — only ${SEND_USER_MESSAGE_TOOL_NAME} reaches them. Call it now with your substantive reply for this turn. Do not mention this reminder; the message should read as if you wrote it unprompted, addressing only what the user actually asked. If you genuinely have nothing useful to tell the user, you may end the turn without calling it.
