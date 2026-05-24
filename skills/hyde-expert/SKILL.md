---
name: hyde-expert
description: Hypothetical Document Embeddings — generate a fake answer, embed that, then retrieve. Use when building or optimizing retrieval-augmented generation pipelines with hyde.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rag-advanced
  tags: [rag, retrieval, hyde, query-transformation, embeddings]
---

# HyDE Expert Mode

You are an expert in Hypothetical Document Embeddings (HyDE), a zero-shot dense retrieval technique that flips the embedding problem on its head: instead of embedding a short, awkward query and hoping it lands near long, factual passages, you ask the LLM to *write* a plausible answer first, then embed that answer. The hallucinations don't matter — the embedding's job is to land you in the neighborhood of real documents that actually contain the answer.

## Core Concept

HyDE was introduced by Gao et al. (2022, arXiv:2212.10496). The pipeline:

1. **Hypothesize**: prompt an instruction-tuned LLM with the query, asking for a passage that *would* answer it.
2. **Encode**: pass that hypothetical passage through an unsupervised contrastive encoder (the original paper used Contriever).
3. **Retrieve**: search the corpus with the resulting vector.

The key insight: the dense bottleneck filters out fabricated specifics. The LLM might invent dates, names, or numbers, but the embedding captures the *topic shape* — and that shape matches real documents better than the original short query does.

## When It Helps

- **Short, vague queries** ("how does X work?") that don't share vocabulary with target docs.
- **Asymmetric retrieval**: short questions vs. long technical passages — classic embedding failure mode.
- **Zero-shot domains** where you can't fine-tune an embedder on (query, doc) pairs.
- **Multilingual**: HyDE worked well on Swahili, Korean, Japanese in the original paper.
- **Exploratory search** where the user doesn't know domain vocabulary.

## When It Hurts

- **Specific entity / keyword queries**: "ERR_CONNECTION_REFUSED in nginx 1.24" — the original query already has the exact tokens you want. HyDE may hallucinate around them and dilute the signal.
- **Domains where the LLM is weak**: medical codes, internal product names, post-cutoff information. The hypothetical doc looks nothing like reality.
- **Latency-sensitive paths**: you've added an LLM call (~300-1000ms) before retrieval.
- **Already strong embedders fine-tuned on your domain**: the lift shrinks toward zero. Modern embedders (voyage-3, text-embedding-3-large, jina-v3) close much of the original gap.
- **High-precision needs**: HyDE pulls in semantically nearby noise. Pair with a reranker.

## Implementation Patterns

### Minimal HyDE with OpenAI + any vector store

```python
from openai import OpenAI
client = OpenAI()

HYDE_PROMPT = """Write a passage that answers the following question.
Be specific and detailed. Do not include disclaimers.

Question: {q}
Passage:"""

def hyde_embed(query: str, embed_fn) -> list[float]:
    hypothetical = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": HYDE_PROMPT.format(q=query)}],
        temperature=0.0,
    ).choices[0].message.content
    return embed_fn(hypothetical)

# Drop-in replacement for query embedding
vec = hyde_embed("how does paxos handle leader failure?", embed_fn=embed)
results = vector_store.search(vec, k=20)
```

### LangChain `HypotheticalDocumentEmbedder`

```python
from langchain.chains import HypotheticalDocumentEmbedder
from langchain_openai import OpenAIEmbeddings, ChatOpenAI

base = OpenAIEmbeddings(model="text-embedding-3-small")
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
hyde = HypotheticalDocumentEmbedder.from_llm(llm, base, "web_search")
# Use hyde.embed_query(...) anywhere you'd use base.embed_query(...)
```

### Multi-HyDE (average over N hypotheticals)

Generate N hypothetical answers, embed each, then mean-pool the vectors. Reduces variance from a single bad hypothesis.

```python
import numpy as np

def multi_hyde(query, n=5, temperature=0.7):
    hyps = [generate_hypothetical(query, temperature) for _ in range(n)]
    vecs = np.array([embed(h) for h in hyps])
    return vecs.mean(axis=0)  # optionally include the original query vec too
```

## Eval / Tuning

- **A/B against plain dense retrieval** on your own golden set. Don't trust paper numbers — they're on BEIR / TREC, not your data.
- **Metrics**: Recall@20, nDCG@10. HyDE typically helps recall more than precision (hence: pair with rerank).
- **Ablations to run**:
  - hypothetical length (50 vs 200 tokens)
  - temperature (0.0 vs 0.7)
  - N hypotheticals (1 / 3 / 8)
  - include original query embedding in the average?
- **Cost gate**: if HyDE costs ~$0.0002/query and gives <2% recall lift on your set, it's not worth it. Modern embedders may have closed the gap for your domain.

## Common Pitfalls

- **Hallucinated entities pollute search** when the hypothetical invents non-existent product names that happen to match noise in your corpus. Lower temperature, shorten hypotheticals.
- **Stop using HyDE for keyword queries**. Route: if query has quoted phrases, error codes, or rare proper nouns, skip HyDE.
- **Embedding model mismatch**: HyDE was designed for *contrastively trained* unsupervised encoders (Contriever-style). With heavily fine-tuned asymmetric encoders (like Cohere embed-v3 with `input_type=search_query` / `search_document`), the asymmetry is already handled — HyDE may add little.
- **Forgetting to also try query rewriting**: a one-line LLM rewrite can match HyDE gains for far less complexity.

## When to Use This Mode

Reach for HyDE when:

- You have short / vague user queries hitting long technical docs.
- You can't fine-tune your embedder.
- You measured a recall ceiling with plain dense retrieval.
- You can absorb +1 LLM call of latency, and you'll add a reranker after.

Skip HyDE when queries are already specific, when your embedder is strong and asymmetric, or when latency budget is tight.

## Sources

- Gao et al., "Precise Zero-Shot Dense Retrieval without Relevance Labels" (HyDE), arXiv:2212.10496 — https://arxiv.org/abs/2212.10496
- LangChain HypotheticalDocumentEmbedder docs — https://python.langchain.com/docs/how_to/
- LlamaIndex HyDE Query Transform — https://developers.llamaindex.ai/python/examples/query_transformations/HyDEQueryTransformDemo/
