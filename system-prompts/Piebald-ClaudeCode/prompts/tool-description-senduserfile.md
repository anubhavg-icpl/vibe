<!--
name: 'Tool Description: SendUserFile'
description: Describes the SendUserFile tool for surfacing generated deliverable files to the user, with optional captions and normal or proactive status
ccVersion: 2.1.169
-->
Send files to the user. Use this when the file *is* the deliverable — a generated diagram, a report, a screenshot, a built artifact — and you want it surfaced, not just mentioned. Paths can be absolute or relative to the current working directory.

Add a `caption` when a one-liner of context helps ("the failing case is row 42", "before vs after"). Skip it if the file speaks for itself.

Set `status` on every call. Use `proactive` when you're initiating — the user is away and you want this to reach their phone (build artifact ready, report generated). Use `normal` when replying to something the user just said.

Files must already exist on the local filesystem — the tool sends files, it doesn't fetch URLs or render content. When unsure of a path, verify with ls first; absolute paths avoid ambiguity about the working directory.
