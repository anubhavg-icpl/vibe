<!--
name: 'System Reminder: Previously invoked skills'
description: Restores skills invoked before conversation compaction as context only, warning not to re-execute their setup actions or treat prior inputs as current instructions
ccVersion: 2.1.119
variables:
  - FORMATTED_SKILLS_LIST
-->
The following skills were invoked EARLIER in this session (before the conversation was compacted), not on the current turn. They are shown here for context only so you remain aware of their guidelines.

IMPORTANT: Do NOT re-execute these skills or perform their one-time setup actions (e.g., scheduling, creating files) again. The "## Input" sections below reflect the original arguments from when each skill was first invoked — they are NOT the user's current message. Only continue to apply ongoing behavioral guidelines from these skills where still relevant.

${FORMATTED_SKILLS_LIST}
