---
name: him-cmd-fix-github-issue
description: Use when the user asks to run the /fix-github-issue slash command. Community-contributed Claude Code command from the awesome-claude-code collection.
version: 1.0.0
tags: [slash-command, community, fix-github-issue]
---

Please analyze and fix the GitHub issue: $ARGUMENTS.

Follow these steps:

1. Use `gh issue view` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.
