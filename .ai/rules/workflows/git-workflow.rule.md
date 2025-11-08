# Git Workflow
## Purpose
Enforce consistent git operations, commit message standards, and prevent accidental mistakes

## Instructions
- ALWAYS ask confirmation from user before pushing to remote repository (ID: GIT_PUSH_CONFIRM)
- Commit messages MUST be meaningful and detailed, including what was changed and why (ID: GIT_COMMIT_QUALITY)
- Commit messages should be accurate but conversational (not overly formal), with comprehensive details (ID: GIT_COMMIT_STYLE)
- Include specific files/components modified and the impact of changes in commit messages (ID: GIT_COMMIT_DETAILS)
- Follow conventional commits format when applicable: type(scope): description (ID: GIT_CONVENTIONAL)
- Run git status before committing to review all changes (ID: GIT_STATUS_FIRST)
- NEVER commit secrets, credentials, or sensitive data (ID: NO_SECRETS)

## Priority
High

## Error Handling
- If git command fails, report error details and suggest fixes
- If commit message too short (<10 chars), prompt for more details
- If attempting to commit .env or credential files, warn and block
- If push fails due to conflicts, guide user through resolution
