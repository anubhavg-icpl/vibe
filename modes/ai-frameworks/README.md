# AI Frameworks Modes

Vibe modes for modern (2025-2026) AI agent frameworks, LLM SDKs, and inference tooling. Each mode is grounded in current, web-researched APIs — class names, imports, and patterns reflect what shipped, not what was trained on.

## Multi-Agent Orchestration

- [LangGraph Expert](./langgraph-expert-mode.md) — Stateful agent graphs with checkpointing, time-travel, human-in-the-loop
- [CrewAI Expert](./crewai-expert-mode.md) — Role-based agent crews with sequential and hierarchical processes
- [AutoGen Expert](./autogen-expert-mode.md) — Microsoft AutoGen v0.4+ event-driven actor model
- [OpenAI Agents SDK Expert](./openai-agents-sdk-expert-mode.md) — Agents, handoffs, guardrails, tracing (Swarm successor)
- [Inngest Agent Kit Expert](./inngest-agent-kit-expert-mode.md) — Durable multi-agent networks in TypeScript

## Typed Agent Frameworks

- [Pydantic AI Expert](./pydantic-ai-expert-mode.md) — Type-safe agents with RunContext and structured outputs
- [Mastra Expert](./mastra-expert-mode.md) — TypeScript framework for agents, workflows, tools, memory
- [LlamaIndex Expert](./llamaindex-expert-mode.md) — Document agents, RAG, agentic workflows

## LLM SDKs and UI

- [Anthropic SDK Expert](./anthropic-sdk-expert-mode.md) — Claude API, prompt caching, tool use, computer use
- [Vercel AI SDK Expert](./vercel-ai-sdk-expert-mode.md) — TypeScript streaming, useChat, generateObject

## Memory Layers

- [Mem0 Expert](./mem0-expert-mode.md) — Universal long-term memory layer for agents
- [Letta Expert](./letta-expert-mode.md) — Stateful agents with memory blocks (formerly MemGPT)

## Background Execution

- [Trigger.dev Expert](./trigger-dev-expert-mode.md) — Durable AI background jobs with realtime streaming

## Programmatic Prompting

- [DSPy Expert](./dspy-expert-mode.md) — Stanford's declarative LM programming with optimizers
- [Instructor Expert](./instructor-expert-mode.md) — Validated, typed extraction across 15+ LLM providers
- [Outlines Expert](./outlines-expert-mode.md) — Constrained generation with regex, JSON schema, grammars

## Inference Engines

- [vLLM Expert](./vllm-expert-mode.md) — High-throughput LLM serving with PagedAttention and speculative decoding
- [Ollama Expert](./ollama-expert-mode.md) — Local LLMs with Modelfiles and GGUF quantization

## Each mode includes

- Persona introduction
- Core competencies (concrete APIs, class names, imports)
- Approach (six-step opinionated workflow)
- Key patterns (real, runnable code samples)
- Common pitfalls
- When to use this mode (vs adjacent alternatives)
