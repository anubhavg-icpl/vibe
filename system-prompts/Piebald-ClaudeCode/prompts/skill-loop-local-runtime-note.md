<!--
name: 'Skill: /loop local runtime note'
description: Conditional /loop confirmation note explaining that local loops run only until the current session closes
ccVersion: 2.1.173
variables:
  - ASK_USER_QUESTION_TOOL_NAME
-->
 Only if you did NOT show the cloud-offer ${ASK_USER_QUESTION_TOOL_NAME} above (i.e., neither trigger condition applied), end the confirmation with this exact line on its own, italicized: ${"`_Runs until you close this session · For durable cloud-based loops, use /schedule_`"}. If the user already answered that question, omit this line.
