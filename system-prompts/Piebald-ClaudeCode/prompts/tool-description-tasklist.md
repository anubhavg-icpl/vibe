<!--
name: 'Tool Description: TaskList'
description: Description for the TaskList tool, which lists all tasks in the task list
ccVersion: 2.1.173
variables:
  - TEAMMATE_TASKLIST_WHEN_TO_USE_NOTE
  - TASKLIST_ID_OUTPUT_LINE
  - TEAMMATE_WORKFLOW_BLOCK
-->
Use this tool to list all tasks in the task list.

## When to Use This Tool

- To see what tasks are available to work on (status: 'pending', no owner, not blocked)
- To check overall progress on the project
- To find tasks that are blocked and need dependencies resolved
${TEAMMATE_TASKLIST_WHEN_TO_USE_NOTE}- After completing a task, to check for newly unblocked work or claim the next available task
- **Prefer working on tasks in ID order** (lowest ID first) when multiple tasks are available, as earlier tasks often set up context for later ones

## Output

Returns a summary of each task:
${TASKLIST_ID_OUTPUT_LINE}
- **subject**: Brief description of the task
- **status**: 'pending', 'in_progress', or 'completed'
- **owner**: Agent ID if assigned, empty if available
- **blockedBy**: List of open task IDs that must be resolved first (tasks with blockedBy cannot be claimed until dependencies resolve)

Use TaskGet with a specific task ID to view full details including description and comments.
${TEAMMATE_WORKFLOW_BLOCK}
