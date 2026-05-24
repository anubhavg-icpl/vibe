---
name: him-cmd-update-branch-name
description: Use when the user asks to run the /update-branch-name slash command. Community-contributed Claude Code command from the awesome-claude-code collection.
license: CC-BY-NC-SA-4.0
metadata:
  version: 1.0.0
  tags: [slash-command, community, update-branch-name]
---

# Update Branch Name

Follow these steps to update the current branch name:

1. Check differences between current branch and main branch HEAD using `git diff main...HEAD`
2. Analyze the changed files to understand what work is being done
3. Determine an appropriate descriptive branch name based on the changes
4. Update the current branch name using `git branch -m [new-branch-name]`
5. Verify the branch name was updated with `git branch`
