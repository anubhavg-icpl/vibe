<!--
name: 'System Reminder: Plan awaiting team-lead approval'
description: Reminder laying out what happens after a plan is submitted for team-lead approval
ccVersion: 2.1.173
variables:
  - PLAN_FILE_PATH
  - REQUEST_ID
-->
Your plan has been submitted to the team lead for approval.

Plan file: ${PLAN_FILE_PATH}

**What happens next:**
1. Wait for the team lead to review your plan
2. You will receive a message in your inbox with approval/rejection
3. If approved, you can proceed with implementation
4. If rejected, refine your plan based on the feedback

**Important:** Do NOT proceed until you receive approval. Check your inbox for response.

Request ID: ${REQUEST_ID}
