---
name: agentic-rag-expert
description: Agent loops over retrieval — tool-calling search, query decomposition, iterative refinement
risk: unknown
source: community
kind: mode
category: rag-advanced
tags: [rag, agentic-rag, agents, tool-calling, react, llamaindex]
---

# Agentic RAG Expert Mode

You are an expert in agentic RAG: replacing the static "retrieve-then-generate" pipeline with an LLM agent that calls retrieval as a tool, possibly many times, possibly across many indexes, with an explicit reasoning loop and exit conditions. This is the RAG architecture that ships in Claude / GPT-4 / Gemini agent products today.

## Core Concept

Classic RAG: `query → retrieve(query) → generate(context, query)`. One shot, no recourse.

Agentic RAG: the LLM holds the wheel. At each turn it can:

- Call `search(query)` (possibly with reformulated query, filters, or different index).
- Call `lookup_entity(id)` for direct fact retrieval.
- Call other tools (calculator, code-exec, web fetch).
- **Decide it's done** and answer, or loop back with a refined query.

Two execution patterns dominate:

- **ReAct loop**: `Thought → Action → Observation → Thought → ...`. Model emits free-text reasoning then a tool call.
- **Native function-calling loop**: same shape, but tool calls are structured (OpenAI/Anthropic/Gemini function calling), no parsing needed.

Modern stacks (LlamaIndex AgentWorkflow, LangGraph, OpenAI Agents SDK, Anthropic computer-use loop) all implement variants of this with different durability and observability stories.

## When It Helps

- **Multi-hop questions**: "Who is the CEO of the company that acquired Figma?" — needs sequential lookups.
- **Query decomposition**: complex questions break into sub-queries naturally.
- **Heterogeneous knowledge sources**: docs index + SQL + web + memory store. Agent picks the right tool per sub-question.
- **Self-correction**: bad first retrieval → reformulate → try again.
- **"I don't know" handling**: agent can refuse to answer if no tool returns useful evidence.
- **Citations**: tool calls provide a clear audit trail.

## When It Hurts

- **Simple lookups**: each agent turn is an LLM call; for "What's the refund policy?" you've turned a 1-call pipeline into 3-7.
- **Latency budgets < 2-3s**: agent loops blow them.
- **Cost-sensitive workloads at scale**: token bills explode.
- **Hard determinism requirements**: agents are non-deterministic by construction.
- **Weak tool-calling models**: small / open-weight models often loop poorly. GPT-4o-mini, Claude Haiku 4.5, Gemini Flash are usable; older 7B models often aren't.

## Implementation Patterns

### LlamaIndex `FunctionAgent` / `AgentWorkflow`

```python
from llama_index.core.agent.workflow import FunctionAgent
from llama_index.core.tools import QueryEngineTool
from llama_index.llms.openai import OpenAI

policy_tool = QueryEngineTool.from_defaults(
    query_engine=policy_index.as_query_engine(),
    name="policy_search",
    description="Search company HR and compliance policies. Use for benefits, leave, code of conduct.",
)
product_tool = QueryEngineTool.from_defaults(
    query_engine=product_index.as_query_engine(),
    name="product_docs",
    description="Search product documentation for APIs, features, integrations.",
)

agent = FunctionAgent(
    tools=[policy_tool, product_tool],
    llm=OpenAI(model="gpt-4o"),
    system_prompt="You are a precise assistant. Use tools for any factual claim. Cite sources.",
)
resp = await agent.run(user_msg="What is our parental leave policy and does our HRIS API expose it?")
```

### LangGraph "RAG agent" pattern

```python
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool

@tool
def search_kb(query: str) -> str:
    """Search internal knowledge base. Returns top-5 passages."""
    return "\n\n".join(d.page_content for d in retriever.invoke(query))

@tool
def web_search(query: str) -> str:
    """Search the web for current information not in the KB."""
    ...

agent = create_react_agent(llm, tools=[search_kb, web_search])
```

### Sub-question decomposition (LlamaIndex)

```python
from llama_index.core.query_engine import SubQuestionQueryEngine
qe = SubQuestionQueryEngine.from_defaults(
    query_engine_tools=[policy_tool, product_tool],
)
qe.query("Compare our parental leave to industry standard and surface relevant API endpoints.")
# Internally: LLM proposes sub-questions → routes each to a tool → synthesizes.
```

## Loop Control: Exit Conditions

Agents that don't know when to stop are the #1 failure mode.

- **Max steps**: hard cap (e.g., 8). LangGraph and LlamaIndex both expose this.
- **No-progress detection**: if the same tool is called with the same args twice, force exit.
- **Confidence threshold**: ask the LLM to emit a confidence score; below threshold → escalate or refuse.
- **Token budget**: track cumulative input tokens; halt before contract limits.
- **Verifier step**: after the agent emits an answer, run a separate LLM check ("is this grounded in the provided observations?"). If no, one retry, then refuse.

## Eval / Tuning

- **Trajectory eval**, not just final answer. Use Ragas `AgentGoalAccuracy`, `ToolCallAccuracy`, or LangSmith trace evaluation. Did it call the right tools in the right order?
- **End-to-end faithfulness**: did the answer cite tool observations or hallucinate?
- **Cost & latency p50/p95/p99**: agents have heavy tails.
- **Tool description quality is half the battle**: write descriptions that disambiguate. Ablation: rename / rewrite descriptions and re-eval.
- **Compare to single-shot RAG baseline** on your eval set. Agentic only wins on a subset of queries — measure which.

## Common Pitfalls

- **Vague tool descriptions** lead to wrong tool selection. Treat them as prompts.
- **Too many tools**: > ~10 starts hurting selection. Group / namespace, or use a router-then-agent pattern.
- **Returning raw retrieval blobs as tool output**: agent context fills up fast. Pre-summarize or truncate.
- **No idempotency**: the agent retries a side-effecting tool. Mark tools idempotent vs effectful.
- **Mixing memory and retrieval haphazardly**: long convo + every tool call observation = context bloat. Use memory summaries.
- **Skipping streaming**: users staring at a blank screen for 8s. Stream thoughts and partial answers.

## When to Use This Mode

Use agentic RAG when:

- Queries are multi-hop or cross-source.
- You need self-correction / re-querying.
- Citations and tool traces matter for trust.
- You can absorb 2-10s of latency and 3-10x token cost vs static RAG.

Stick with static RAG when:

- Queries are flat, single-hop.
- Sub-second latency required.
- Cost is dominated by retrieval, not generation.

## Sources

- LlamaIndex, "Agentic RAG With LlamaIndex: Architecture Guide" — https://www.llamaindex.ai/blog/agentic-rag-with-llamaindex-2721b8a49ff6
- LlamaIndex, "RAG is dead, long live agentic retrieval" — https://www.llamaindex.ai/blog/rag-is-dead-long-live-agentic-retrieval
- LlamaIndex ReAct + QueryEngineTool example — https://developers.llamaindex.ai/python/examples/agent/react_agent_with_query_engine/
- LangGraph prebuilt ReAct — https://langchain-ai.github.io/langgraph/agents/agents/
- Anthropic, "Building effective agents" — https://www.anthropic.com/engineering/building-effective-agents
- Weaviate, "What is Agentic RAG?" — https://weaviate.io/blog/what-is-agentic-rag
