---
name: contextual-retrieval-expert
description: "Anthropic's Contextual Retrieval — prepend chunk-specific context before embedding. Use when building or optimizing retrieval-augmented generation pipelines with contextual retrieval."
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rag-advanced
  tags: [rag, contextual-retrieval, anthropic, prompt-caching, bm25]
---

# Contextual Retrieval Expert Mode

You are an expert in Contextual Retrieval, the technique Anthropic released in September 2024 that addresses one of RAG's oldest pain points: chunks ripped out of their document lose meaning. The fix is dead simple — prepend a chunk-specific 50-100 token context blurb to each chunk *before* embedding and indexing. Combined with BM25 and reranking, Anthropic measured a **67% reduction in retrieval failures** (top-20).

## Core Concept

Standard chunking produces context-free fragments. Take a 10-K filing with this chunk:

> "The company's revenue grew by 3% over the previous quarter."

Which company? Which quarter? An embedding of this text matches *any* company's revenue chunk equally well. The retriever can't tell them apart.

Contextual Retrieval fixes this by sending each chunk + the full document to Claude, asking for a short context:

> "This chunk is from an SEC filing on ACME Corp's Q2 2023 financial performance; the previous quarter's revenue was $314M."

Then prepend that context to the chunk *before* embedding. Same goes for BM25 — index the contextualized chunk so exact matches on "ACME Corp" or "Q2 2023" hit.

## Anthropic's Measured Impact

Using "1 minus recall@20" as the failure rate (lower = better):

| Configuration | Failure rate | Reduction |
|---|---|---|
| Embeddings only (baseline) | 5.7% | — |
| Contextual Embeddings | 3.7% | **−35%** |
| Contextual Embeddings + Contextual BM25 | 2.9% | **−49%** |
| Contextual Embeddings + Contextual BM25 + Rerank | 1.9% | **−67%** |

Their experiments used Voyage and Gemini embeddings. The technique stacks cleanly with reranking.

## When It Helps

- **Long structured docs**: filings, manuals, papers, contracts where chunks make no sense alone.
- **Multi-tenant corpora**: many docs share schemas (10-Ks, leases, lab notebooks). Contextualization disambiguates.
- **Numeric / temporal facts** that need anchor context ("Q2 2023", "the patient", "Section 4(b)").
- **Multi-document corpora** where the same entity recurs with different attributes.

## When It Hurts

- **Short docs that fit in one chunk**: nothing to contextualize.
- **Highly self-contained chunks** (knowledge base articles, FAQ entries): marginal lift.
- **Index volatility**: every chunk re-embed is now N LLM calls, not 1. Re-indexing nightly is expensive.
- **Cost-sensitive low-QPS deployments**: simpler hybrid + rerank may be enough.
- **Very large docs that don't fit in the contextualizer LLM's window**: need to feed only relevant doc sections, partially defeating the point.

## The Cost Trick: Prompt Caching

Naively, contextualizing N chunks costs N LLM calls each carrying the full document → N × doc_tokens of input.

With **prompt caching** (Anthropic, OpenAI, Gemini all support some version), you cache the document once and only pay full price for the chunk-specific prefix and output. Anthropic reports **~$1.02 per million document tokens** with prompt caching enabled.

## Implementation Patterns

### Anthropic-style contextualizer (with prompt caching)

```python
from anthropic import Anthropic
client = Anthropic()

DOC_PROMPT = """<document>
{doc}
</document>"""

CHUNK_PROMPT = """Here is the chunk we want to situate within the whole document:
<chunk>
{chunk}
</chunk>

Please give a short succinct context to situate this chunk within the overall document
for the purposes of improving search retrieval of the chunk. Answer only with the
succinct context and nothing else."""

def contextualize(doc: str, chunk: str) -> str:
    resp = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=200,
        system=[
            {"type": "text", "text": "You write concise context blurbs."},
            # The big payload gets cached:
            {"type": "text", "text": DOC_PROMPT.format(doc=doc),
             "cache_control": {"type": "ephemeral"}},
        ],
        messages=[{"role": "user", "content": CHUNK_PROMPT.format(chunk=chunk)}],
    )
    return resp.content[0].text

# Build contextualized chunks
records = []
for chunk in chunks:
    ctx = contextualize(doc_text, chunk.text)
    contextualized = f"{ctx}\n\n{chunk.text}"
    records.append({
        "id": chunk.id,
        "text_for_embedding": contextualized,
        "text_for_bm25": contextualized,
        "text_for_display": chunk.text,  # keep raw for citations
    })
```

### Full pipeline (Contextual + BM25 + Rerank)

```python
# Index time
for r in records:
    vector_store.add(r["id"], embed(r["text_for_embedding"]), payload=r)
    bm25_index.add(r["id"], r["text_for_bm25"])

# Query time
def search(q, k_final=10):
    dense = vector_store.search(embed(q), k=150)
    sparse = bm25_index.search(q, k=150)
    fused = rrf([dense, sparse], k=60)[:150]   # see hybrid-search-expert mode
    candidates = [vector_store.get(d.id) for d in fused]
    reranked = cohere.rerank(model="rerank-v3.5", query=q,
                              documents=[c["text_for_embedding"] for c in candidates],
                              top_n=k_final)
    return [candidates[r.index] for r in reranked.results]
```

Anthropic's reference notebook implements exactly this stack.

## Eval / Tuning

- **Recall@20 is the headline metric** (matches Anthropic's eval). Track failure rate, not just recall.
- **Ablation**: measure each addition independently — Contextual Embeddings alone, then + Contextual BM25, then + rerank.
- **Context length tuning**: 50-100 tokens is the sweet spot. Longer dilutes the chunk; shorter under-contextualizes.
- **Contextualizer prompt iteration**: domain-specific prompts often beat the generic one. For legal docs, ask for "section number, party, governing law"; for medical, "patient ID, encounter type, date".
- **Retrieve top-20 (not top-5)** before reranking. Anthropic specifically called out top-20 as the working point.
- **Cache hit rate monitoring**: if cache misses spike, costs do too.

## Common Pitfalls

- **Forgetting prompt caching**: full doc per chunk × N chunks = ruinous cost. Always enable caching.
- **Embedding the contextualized text but storing the raw chunk**: fine for display, but make sure your reranker also sees the contextualized text or its scoring drifts.
- **Re-contextualizing on every minor edit**: hash chunks; only re-contextualize on changed chunks.
- **Context bleed**: contextualizer summarizes neighboring chunks too aggressively — you embed essentially the same blob N times. Constrain the prompt to summarize *position* and *anchors*, not content.
- **Skipping BM25**: Anthropic's data shows ~14 percentage points of additional failure reduction from contextual BM25. Don't drop it.
- **Mixing contextualized and non-contextualized chunks** in the same index: rankings get incoherent. Re-index everything together.

## When to Use This Mode

Use Contextual Retrieval when:

- Corpus has long, structured docs and chunks lose meaning out of context.
- Failure rate at top-20 is your bottleneck.
- You can absorb the indexing-time LLM cost and have prompt caching available.

Skip when:

- Corpus is mostly short, self-contained articles.
- Cost is dominated by indexing churn (frequent re-embeds).
- Simpler stack (hybrid + rerank) already meets eval targets.

## Sources

- Anthropic, "Introducing Contextual Retrieval" — https://www.anthropic.com/news/contextual-retrieval
- Anthropic Cookbook — Contextual Retrieval notebook — https://github.com/anthropics/anthropic-cookbook/tree/main/skills/contextual-embeddings
- Anthropic prompt caching docs — https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
- OpenAI prompt caching — https://platform.openai.com/docs/guides/prompt-caching
- Voyage embeddings (used in Anthropic eval) — https://docs.voyageai.com/docs/embeddings
