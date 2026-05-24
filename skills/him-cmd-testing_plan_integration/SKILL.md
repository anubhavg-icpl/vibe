---
name: him-cmd-testing_plan_integration
description: Use when the user asks to run the /testing_plan_integration slash command. Community-contributed Claude Code command from the awesome-claude-code collection.
license: CC-BY-NC-SA-4.0
metadata:
  version: 1.0.0
  tags: [slash-command, community, testing_plan_integration]
---

I need you to create an integration testing plan for $ARGUMENTS

These are integration tests and I want them to be inline in rust fashion.

If the code is difficult to test, you should suggest refactoring to make it easier to test.

Think really hard about the code, the tests, and the refactoring (if applicable).

Will you come up with test cases and let me review before you write the tests?

Feel free to ask clarifying questions.