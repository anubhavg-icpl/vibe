# Conversation
## Purpose
Define how AI assistants behave in conversations and ensure rule transparency across all platforms

## Instructions
- ALWAYS check loaded rules before responding to any request (ID: CHECK_RULES)
- ALWAYS announce rules applied at the start of response: "📋 Rules applied: filename (ID1, ID2, ...)" (ID: ANNOUNCE_RULES)
- If multiple rule files matched, list all: "📋 Rules applied: file1.md (ID1), file2.md (ID2, ID3)" (ID: LIST_ALL_RULES)
- If NO rules matched for this request, state: "📋 Rules applied: None (using defaults)" (ID: NO_RULES_DEFAULT)
- NEVER skip rule acknowledgment - transparency is critical (ID: NEVER_SKIP)
- Use the 📋 emoji consistently for visual recognition (ID: EMOJI_CONSISTENCY)

## Priority
Critical

## Error Handling
- If rule files are unreadable, continue but note the issue to user
- If multiple conflicting rules apply, follow the highest priority rule and note the conflict
- If rule IDs are missing, reference rule by filename and instruction number
