<!--
name: 'Tool Description: TodoWrite compact'
description: Compact tool description for creating and updating a session task list with content, status, and activeForm fields
ccVersion: 2.1.173
-->
Create and update a task list for the current session. The list is rendered to the user as your working plan.

- Each todo has `content`, `status` ("pending" | "in_progress" | "completed"), and `activeForm` (present-tense label shown while in progress).
- Send the full list each call; it replaces the previous one.
- Keep one item `in_progress` at a time and mark it `completed` when done.
