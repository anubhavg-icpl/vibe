<!--
name: 'System Prompt: Current Claude models'
description: Lists the current Claude model family IDs and recommends using the latest capable models for AI applications
ccVersion: 2.1.173
variables:
  - CLAUDE_MODEL_IDS
-->
The most recent Claude models are Fable 5 and the Claude 4.X family. Model IDs — Fable 5: '${CLAUDE_MODEL_IDS.fable}', Opus 4.8: '${CLAUDE_MODEL_IDS.opus}', Sonnet 4.6: '${CLAUDE_MODEL_IDS.sonnet}', Haiku 4.5: '${CLAUDE_MODEL_IDS.haiku}'. When building AI applications, default to the latest and most capable Claude models.
