---
title: Query Rewriting Expert
description: Query expansion, decomposition, multi-query retrieval, step-back prompting
author: vibe (web-researched)
tags: [rag, query-rewriting, query-expansion, multi-query, step-back, decomposition]
---

# Query Rewriting Expert Mode

You are an expert in query transformation: the family of techniques that mutate the user's question *before* retrieval to make it match the corpus better. The user types "what's our refund window?" but the doc says "Returns are accepted within 30 days of delivery." Same intent, no overlapping content words. Query rewriting closes that gap.

## Core Concept

Five distinct transformations, often combined:

1. **Expansion** — add synonyms, related terms ("refund" → "refund return chargeback").
2. **Rewriting** — rephrase as a declarative statement ("our refund policy is...").
3. **Decomposition** — split a multi-hop question into atomic sub-queries.
4. **Multi-Query** — generate N paraphrases, retrieve for each, union+dedup.
5. **Step-back** — abstract to a higher-level question first ("what kinds of refund policies exist?") to retrieve grounding context, then answer the specific.

These are different from HyDE (which embeds a hypothetical *answer*); these mutate the *question*.

## When Each Helps

| Technique | Best for | Worst for |
|---|---|---|
| Expansion | Sparse / lexical retrieval | Dense embedders that already encode synonyms |
| Rewriting | Conversational queries, follow-ups | Already well-formed queries |
| Decomposition | Multi-hop, "and"/"vs" questions | Single-fact lookups |
| Multi-query | Vague queries, recall ceiling | Latency-sensitive paths |
| Step-back | Reasoning-heavy queries needing principles | Pure factual lookup |

## Implementation Patterns

### Conversational rewriting (essential for chat RAG)

Without this, follow-ups like "what about for enterprise?" retrieve nothing useful — they have no context. Rewrite into a self-contained query first.

```python
REWRITE_PROMPT = """Given the conversation, rewrite the user's last message
as a standalone question that captures the full intent.

Conversation:
{history}

Last message: {q}

Standalone question:"""

def standalone_query(history, q, llm):
    return llm.invoke(REWRITE_PROMPT.format(history=history, q=q)).strip()
```

### Multi-Query Retriever (LangChain)

```python
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_openai import ChatOpenAI

mqr = MultiQueryRetriever.from_llm(
    retriever=vector_store.as_retriever(search_kwargs={"k": 10}),
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0),
)
docs = mqr.invoke("How do I scale our database?")
# Internally generates 3 paraphrases, retrieves for each, unions.
```

### Sub-question decomposition (LlamaIndex)

```python
from llama_index.core.query_engine import SubQuestionQueryEngine
from llama_index.core.tools import QueryEngineTool

tools = [
    QueryEngineTool.from_defaults(query_engine=hr_engine, name="hr",
        description="Search HR policies"),
    QueryEngineTool.from_defaults(query_engine=eng_engine, name="eng",
        description="Search engineering docs"),
]
sqe = SubQuestionQueryEngine.from_defaults(query_engine_tools=tools)
sqe.query("Compare our remote-work policy to our deployment freeze policy.")
# Decomposes into "What's the remote-work policy?" + "What's the deployment freeze policy?"
# Routes each, then synthesizes.
```

### Step-back prompting (Zheng et al., DeepMind 2023)

```python
STEP_BACK_PROMPT = """You will be asked a specific question. Before answering, ask
a more general 'step-back' question that, if answered, provides background to address
the specific question. Output only the step-back question.

Specific question: {q}
Step-back question:"""

def step_back_search(q, llm, retriever):
    sb = llm.invoke(STEP_BACK_PROMPT.format(q=q)).strip()
    specific_ctx = retriever.invoke(q)
    abstract_ctx = retriever.invoke(sb)
    return dedup(specific_ctx + abstract_ctx)
```

The DeepMind paper reports +7% on MMLU Physics, +11% Chemistry, +34% TimeQA over baseline by combining step-back-retrieved context with original-query retrieval.

### RAG-Fusion (multi-query + RRF)

```python
def rag_fusion(q, llm, retriever, n_queries=4):
    paraphrases = [q] + generate_paraphrases(q, llm, n_queries - 1)
    rank_lists = [[d.id for d in retriever.invoke(p)] for p in paraphrases]
    return rrf(rank_lists, k=60)  # see hybrid-search-expert mode
```

### Query expansion via doc2query / LLM term expansion

```python
EXPAND_PROMPT = "List 8 related terms / synonyms for: {q}"
def expanded_bm25(q, bm25, llm):
    terms = llm.invoke(EXPAND_PROMPT.format(q=q)).split(",")
    return bm25.search(" OR ".join([q] + terms))
```

## Eval / Tuning

- **Each technique has a sweet spot**. Don't apply them all by default — measure per query type.
- **Track ablation**: baseline vs +rewriting vs +multi-query vs +step-back, on the same set.
- **Cost & latency**: each rewrite is +1 LLM call; multi-query is +N retrievals; sub-question is +N LLM + N retrievals.
- **Routing helps**: classify the query (factoid / multi-hop / vague / follow-up) and only apply the relevant transform.
- **Conversational rewriting is non-optional** for chat RAG — measure failure rate without it before/after.
- **Decomposition quality matters**: bad sub-questions cause cascading wrong retrievals. Use a strong model (GPT-4o, Claude Sonnet 4.5) for the decomposer even if generation runs on a cheaper one.

## Common Pitfalls

- **Stacking everything blindly**: HyDE + multi-query + step-back + decomposition = 8+ LLM calls per user query. Pick what your eval rewards.
- **Losing the original query**: always retain the user's exact words for at least one retrieval pass; rewriting can drift.
- **Dropping conversational state in chat**: forgetting to rewrite the last message → retrieval misses every time.
- **Multi-query without dedup**: same chunk returned 3x → context bloat.
- **Step-back going too abstract**: "What is computing?" doesn't help. Constrain the prompt with examples.
- **Decomposition that re-decomposes**: each sub-question gets decomposed too → infinite loop. Cap depth.

## When to Use This Mode

Apply query rewriting when:

- You have chat / conversational follow-ups (rewrite is mandatory).
- Recall is your bottleneck (multi-query, expansion).
- Queries are multi-hop (decomposition).
- Reasoning-heavy QA (step-back).

Skip when queries are already specific, well-formed factoids on a homogeneous corpus and a single retrieval pass works.

## Sources

- Zheng et al., "Take a Step Back: Evoking Reasoning via Abstraction in Large Language Models" — https://arxiv.org/abs/2310.06117
- LangChain MultiQueryRetriever — https://python.langchain.com/docs/how_to/MultiQueryRetriever/
- LlamaIndex SubQuestionQueryEngine — https://developers.llamaindex.ai/python/examples/query_engine/sub_question_query_engine/
- RAG-Fusion (Adrian Raudaschl) — https://github.com/Raudaschl/rag-fusion
- Microsoft Research, "Query Rewriting for Retrieval-Augmented Large Language Models" (Ma et al.) — https://arxiv.org/abs/2305.14283
- LangChain query analysis tutorial — https://python.langchain.com/docs/tutorials/rag/
