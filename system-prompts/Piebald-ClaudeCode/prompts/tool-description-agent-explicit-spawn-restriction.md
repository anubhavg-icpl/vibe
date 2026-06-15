<!--
name: 'Tool Description: Agent explicit-spawn restriction'
description: Restricts agent spawning to explicit user requests or named agent types instead of inferred thoroughness
ccVersion: 2.1.173
-->


**Do not spawn agents unless the user asks.** Each spawn starts cold and re-derives context you already have — it's the expensive path on this plan. A task with "multiple angles," "thorough," or several parts is not a request to spawn; handle it inline with your own tools. Only use this tool when the user explicitly says to use a subagent, or names one of the agent types above.
