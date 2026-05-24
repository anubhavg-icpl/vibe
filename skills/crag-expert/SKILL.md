---
name: crag-expert
description: Retrieval evaluator + web search fallback when knowledge base is insufficient. Use when building or optimizing retrieval-augmented generation pipelines with crag.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rag-advanced
  tags: [rag, crag, corrective-rag, retrieval-evaluator, web-search-fallback]
---

# Corrective RAG (CRAG) Expert Mode

You are an expert in Corrective Retrieval-Augmented Generation (Yan et al., 2024, arXiv:2401.15884). The premise: most RAG failures aren't generation failures — they're retrieval failures the LLM can't escape. CRAG installs a lightweight **retrieval evaluator** between retrieval and generation. If retrieved docs look fine, proceed. If they look bad, switch strategies (web search, knowledge refinement, or both).

## Core Concept

CRAG adds two components to standard RAG:

1. **Retrieval Evaluator** (a lightweight T5-large fine-tuned classifier in the paper, or a prompted LLM judge in practice). It scores each retrieved doc against the query and outputs a confidence:
   - `Correct` (high confidence) → use retrieved docs after refinement.
   - `Incorrect` (low confidence) → discard, fall back to web search.
   - `Ambiguous` (middle) → combine refined retrieved + web search results.

2. **Knowledge Refinement** (decompose-then-recompose):
   - Split retrieved doc into "knowledge strips" (sentence- or proposition-level units).
   - Score each strip's relevance with the same evaluator.
   - Drop irrelevant strips, recompose only the relevant ones.

```
query → retrieve → evaluate
                   ├─ Correct    → refine strips → generate
                   ├─ Incorrect  → web_search    → generate
                   └─ Ambiguous  → refine ⨁ web  → generate
```

The paper reports CRAG outperforms vanilla RAG and Self-RAG on PopQA, Biography, PubHealth, Arc-Challenge — and crucially, robustness improves dramatically when the underlying retriever has bad recall.

## When It Helps

- **Open-domain QA** where the corpus might not contain the answer.
- **Mixed-quality corpora** with stale or irrelevant material.
- **Long-tail queries** likely outside the static index.
- **Domains where freshness matters** and web is up to date (news, prices, current events).
- **You want a graceful degradation path** rather than confidently wrong answers.

## When It Hurts

- **Closed / regulated corpora** where web search is forbidden (legal, healthcare with PHI, internal-only data).
- **Low-latency serving**: web search round trip is slow (Tavily, Bing, Serper APIs are 500ms-2s).
- **Cost-sensitive**: every uncertain query triggers a paid web search call.
- **Eval-mature stacks** where retrieval recall is already > 95%: evaluator overhead with no payoff.
- **Workloads where freshness < private-knowledge weighting**: web fallback may pull noise that overrides better internal docs.

## Implementation Patterns

### Prompted CRAG (no fine-tuned evaluator)

```python
EVAL_PROMPT = """Score how well the document answers the question.
Output exactly one of: CORRECT, AMBIGUOUS, INCORRECT.

Question: {q}
Document: {d}
Score:"""

def evaluate(q, doc, llm):
    s = llm.invoke(EVAL_PROMPT.format(q=q, d=doc.text)).strip().upper()
    return s if s in {"CORRECT", "AMBIGUOUS", "INCORRECT"} else "AMBIGUOUS"

REFINE_PROMPT = """Extract only the sentences from the passage that are relevant
to the question. Drop everything else. Preserve sentences verbatim.

Question: {q}
Passage: {d}
Relevant sentences:"""

def refine(q, doc, llm):
    return llm.invoke(REFINE_PROMPT.format(q=q, d=doc.text))

def crag(q, retriever, llm, web):
    docs = retriever.invoke(q)
    scores = [evaluate(q, d, llm) for d in docs]
    if any(s == "CORRECT" for s in scores):
        kept = [refine(q, d, llm) for d, s in zip(docs, scores) if s != "INCORRECT"]
        ctx = "\n\n".join(kept)
    elif all(s == "INCORRECT" for s in scores):
        ctx = web.search(q)
    else:
        kept = [refine(q, d, llm) for d, s in zip(docs, scores) if s == "AMBIGUOUS"]
        ctx = "\n\n".join(kept) + "\n\n" + web.search(q)
    return llm.invoke(f"Answer using:\n{ctx}\n\nQuestion: {q}")
```

### Web search providers

| Provider | Notes |
|---|---|
| **Tavily** | Built for AI use — returns clean, deduped, summarized results |
| **Serper / SerpAPI** | Raw Google SERP, cheap, more parsing needed |
| **Brave Search API** | Independent index, EU-friendly |
| **Bing Web Search** | Mature, broad coverage |
| **You.com search API** | LLM-friendly responses |

### LangGraph CRAG cookbook

LangGraph publishes a CRAG tutorial that wires up retrieve → grade → conditional edge to either rewrite-query+web-search or generate. Good reference for production graph state and retries.

### LlamaIndex CRAG Pack

```python
from llama_index.packs.corrective_rag import CorrectiveRAGPack
pack = CorrectiveRAGPack(
    documents=docs,
    tavily_ai_apikey=os.environ["TAVILY_API_KEY"],
)
resp = pack.run("Who won the 2024 election in country X?")
```

### Trained evaluator option

The paper trains a T5-large on a synthetic dataset where docs are paired with queries and labeled `Correct`/`Incorrect`/`Ambiguous` based on whether they entail the answer. Prefer this over prompted LLM grading at scale (cheaper, lower latency, more consistent).

## Eval / Tuning

- **Trigger rate**: % of queries that fall back to web. Too high → your KB is the problem; too low → evaluator may be too lenient.
- **Web payoff**: among queries that triggered web search, did answer accuracy improve vs giving up? If not, web isn't helping for your domain.
- **Evaluator calibration**: confusion matrix on a labeled set. Cost of false `CORRECT` (hallucination risk) vs false `INCORRECT` (wasted web call) drives threshold.
- **Refinement vs no refinement**: ablation on knowledge strip extraction. Sometimes refinement throws away helpful context.
- **Combine with Self-RAG**: CRAG handles "retrieval is bad", Self-RAG handles "should we retrieve at all and is the answer grounded". They're orthogonal.
- **Latency budgeting**: P50 stays close to vanilla RAG, P95-P99 moves out by web-search latency. Set SLOs accordingly.

## Common Pitfalls

- **Web search for everything**: defeats the purpose. Trust the evaluator's `CORRECT` path.
- **No source-tag tracking**: when you mix KB and web, citations confuse the user. Tag and surface.
- **Web noise pollutes generation**: SEO spam, contradictory sources. Use Tavily's deep search or rerank web results before generation.
- **Evaluator drift after corpus change**: re-calibrate when KB content shifts.
- **Strip-level refinement losing structure**: tables, code blocks shouldn't be sentence-split. Skip refinement for non-prose chunks.
- **Forgetting privacy / compliance**: web search may leak the user's private query. Strip PII before search; consider self-hosted search.

## When to Use This Mode

Use CRAG when:

- Your corpus has gaps and you want graceful fallback.
- Queries can include freshness-sensitive intents.
- You can absorb extra latency on the failure path.

Skip when:

- Closed corpus with no permitted external lookup.
- Recall is already very high.
- Hard latency caps.

## Sources

- Yan et al., "Corrective Retrieval Augmented Generation" — https://arxiv.org/abs/2401.15884
- CRAG repo — https://github.com/HuskyInSalt/CRAG
- LangGraph CRAG tutorial — https://langchain-ai.github.io/langgraph/tutorials/rag/langgraph_crag/
- LlamaIndex CorrectiveRAGPack — https://github.com/run-llama/llama_index/tree/main/llama-index-packs/llama-index-packs-corrective-rag
- Tavily AI search API — https://tavily.com/
- Serper Google Search API — https://serper.dev/
