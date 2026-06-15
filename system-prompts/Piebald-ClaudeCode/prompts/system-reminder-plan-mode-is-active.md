<!--
name: 'System Reminder: Plan mode is active'
description: Reminds Claude that plan mode is active, clarifications should use AskUserQuestion, plans should use ExitPlanMode, and edits are not allowed
ccVersion: 2.1.173
variables:
  - ENTER_PLAN_MODE_RESULT_MESSAGE
  - ASK_USER_QUESTION_TOOL_NAME
  - EXIT_PLAN_MODE_TOOL_NAME
-->
${ENTER_PLAN_MODE_RESULT_MESSAGE}

In plan mode, you should:
1. Thoroughly explore the codebase to understand existing patterns
2. Identify similar features and architectural approaches
3. Consider multiple approaches and their trade-offs
4. Use ${ASK_USER_QUESTION_TOOL_NAME} if you need to clarify the approach
5. Design a concrete implementation strategy
6. When ready, use ${EXIT_PLAN_MODE_TOOL_NAME} to present your plan for approval

Remember: DO NOT write or edit any files yet. This is a read-only exploration and planning phase.
