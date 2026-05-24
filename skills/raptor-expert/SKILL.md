---
name: raptor-expert
description: RAPTOR — recursive abstractive summarization tree for long-document RAG
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rag-advanced
  tags: [rag, raptor, hierarchical, summarization, long-document]
---

# RAPTOR Expert Mode

You are an expert in RAPTOR — Recursive Abstractive Processing for Tree-Organized Retrieval (Sarthi et al., ICLR 2024, arXiv:2401.18059). RAPTOR builds a tree where leaves are raw chunks and each parent is an LLM-summarized cluster of its children. At query time, retrieval can pull from any level: leaves for fine detail, mid-levels for thematic context, root for overall summaries. With GPT-4 it added **20 absolute points** on the QuALITY long-document QA benchmark.

## Core Concept

```
Level 2:                    [root summary]
                           /              \
Level 1:           [theme A summary]    [theme B summary]
                  /          \           /         \
Level 0 (chunks): c1   c2   c3    c4  c5   c6   c7   c8
```

Build steps:

1. **Chunk** the corpus into leaves (typically 100-200 tokens).
2. **Embed** each leaf.
3. **Cluster** leaves with **soft, dimensionality-reduced clustering** — the paper uses UMAP for dim reduction then a Gaussian Mixture Model. Soft means a chunk can belong to multiple clusters.
4. **Summarize** each cluster with an LLM → produces level-1 nodes.
5. **Recurse**: cluster the level-1 summaries, summarize again, until a single root or a small set.
6. **Index every node** (leaf + summaries) in the same vector store.

## Two Retrieval Modes

- **Tree Traversal** — start at the top level, pick the most similar node(s), recurse down. Pulls a coherent path from theme to detail.
- **Collapsed Tree** — flatten all nodes into one pool, retrieve top-k by cosine. Lets the query naturally pick whichever level is most useful. The paper found collapsed tree performs as well or better and is simpler.

## When It Helps

- **Long documents** (books, reports, research papers, transcripts) where answers may require theme-level synthesis.
- **Mixed-granularity questions** in the same workload: some need a sentence, some need "what's this chapter about?"
- **Holistic questions** that no single chunk can answer (similar to GraphRAG global queries, simpler stack).
- **Hierarchical corpora** that already have natural levels (chapters → sections → paragraphs).

## When It Hurts

- **Short, flat corpora** (FAQs, single-page articles) — nothing to summarize over.
- **Rapidly changing content**: re-clustering and re-summarizing on every update is expensive.
- **Tight indexing budget**: every node above leaves costs an LLM call to create.
- **You already use GraphRAG**: similar global-question answering, more structure. Pick one.
- **Latency at index time**: cluster + summarize loops dominate.

## Implementation Patterns

### LlamaIndex RAPTOR pack

```python
from llama_index.packs.raptor import RaptorPack, RaptorRetriever
from llama_index.core import SimpleDirectoryReader
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.llms.openai import OpenAI

docs = SimpleDirectoryReader("./papers").load_data()
pack = RaptorPack(
    docs,
    embed_model=OpenAIEmbedding(model="text-embedding-3-small"),
    llm=OpenAI(model="gpt-4o-mini"),
    summary_module=None,  # default uses the LLM to summarize clusters
    similarity_top_k=4,   # per-level top-k during traversal
    mode="collapsed",     # or "tree_traversal"
)
nodes = pack.run("How do the authors handle long-context degradation?")
```

### Manual RAPTOR sketch (UMAP + GMM + LLM summary)

```python
import umap
import numpy as np
from sklearn.mixture import GaussianMixture

def cluster_layer(embs: np.ndarray, max_k: int = 50, threshold: float = 0.1):
    reduced = umap.UMAP(n_neighbors=10, n_components=10, metric="cosine").fit_transform(embs)
    # Pick K via BIC over a range
    bics = [GaussianMixture(n_components=k, random_state=0).fit(reduced).bic(reduced)
            for k in range(2, min(max_k, len(embs)))]
    k = int(np.argmin(bics)) + 2
    gmm = GaussianMixture(n_components=k, random_state=0).fit(reduced)
    probs = gmm.predict_proba(reduced)
    # Soft assignment: a node belongs to all clusters where prob > threshold
    return [list(np.where(p > threshold)[0]) for p in probs]

SUMMARIZE_PROMPT = "Write a detailed but concise summary of these passages:\n\n{texts}\n\nSummary:"

def build_raptor(chunks, embed, llm, max_levels=3):
    levels = [chunks]
    for _ in range(max_levels):
        embs = np.array([embed(c["text"]) for c in levels[-1]])
        assignments = cluster_layer(embs)
        clusters = {}
        for i, ass in enumerate(assignments):
            for cid in ass:
                clusters.setdefault(cid, []).append(levels[-1][i])
        next_level = []
        for cid, members in clusters.items():
            text = "\n\n".join(m["text"] for m in members)[:8000]
            summary = llm.invoke(SUMMARIZE_PROMPT.format(texts=text))
            next_level.append({"text": summary, "level": len(levels), "children": [m["id"] for m in members]})
        if len(next_level) <= 1:
            levels.append(next_level)
            break
        levels.append(next_level)
    return [n for level in levels for n in level]   # flatten for collapsed-mode index
```

### Index everything together (collapsed)

```python
all_nodes = build_raptor(leaf_chunks, embed, llm)
for n in all_nodes:
    vector_store.add(n["id"], embed(n["text"]), payload=n)
# Search: standard cosine top-k. Results may include leaves and summaries — that's the point.
```

## Eval / Tuning

- **QuALITY** is the canonical long-doc QA benchmark RAPTOR was evaluated on. NarrativeQA also relevant.
- **Levels**: 2-3 is usually enough. More levels add cost and rarely help unless corpus is huge.
- **Cluster soft-assignment threshold**: 0.1 is the paper default. Lower = more multi-membership = more redundancy.
- **Collapsed vs tree-traversal**: ablate. Collapsed is simpler and competitive.
- **Summary prompt**: domain-specific prompts help; ask for "key facts and dates" for factual corpora, "main arguments" for analytical.
- **Retrieval budget**: include both leaves and summaries in top-k; check that summaries aren't crowding out leaves for fact queries.

## Common Pitfalls

- **Summarization losing facts**: summaries are good for themes, bad for specifics. Always retain leaves.
- **Cluster instability**: UMAP + GMM can give different results on re-runs. Set seeds and snapshot the tree.
- **Re-building on every doc change**: scope incremental updates to affected sub-trees, or rebuild on a schedule.
- **Over-large clusters**: when a cluster has 100+ chunks, the summary loses everything specific. Cap cluster size.
- **Summary embedding drift**: summaries are generated text, distribution differs from leaves. Some embedders score them lower than expected; consider per-level normalization.
- **Confusing RAPTOR with GraphRAG**: both produce hierarchical summaries. RAPTOR clusters by embedding similarity; GraphRAG clusters a knowledge graph by Leiden communities. RAPTOR is simpler; GraphRAG is more structured for entity-centric queries.

## When to Use This Mode

Use RAPTOR when:

- Corpus has long documents needing both detail and theme retrieval.
- You want a single-vector-store stack (no graph DB).
- Queries are mixed-granularity.
- You can afford the indexing-time LLM cost.

Skip when:

- Corpus is short, flat, or rapidly changing.
- GraphRAG is already in place for synthesis questions.
- Indexing cost is prohibitive.

## Sources

- Sarthi et al., "RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval" (ICLR 2024) — https://arxiv.org/abs/2401.18059
- RAPTOR repo — https://github.com/parthsarthi03/raptor
- LlamaIndex RaptorPack — https://github.com/run-llama/llama_index/tree/main/llama-index-packs/llama-index-packs-raptor
- LangChain RAPTOR cookbook — https://github.com/langchain-ai/langchain/blob/master/cookbook/RAPTOR.ipynb
- QuALITY benchmark — https://github.com/nyu-mll/quality
