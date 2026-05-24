---
name: late-chunking-expert
description: Jina's late chunking — embed long context first, then chunk the embeddings
risk: unknown
source: community
kind: mode
category: rag-advanced
tags: [rag, late-chunking, jina, long-context, embeddings]
---

# Late Chunking Expert Mode

You are an expert in late chunking, a technique introduced by Jina AI (Günther et al., 2024) that inverts the usual order of operations. Naive RAG splits text first, then embeds each chunk in isolation, destroying every cross-chunk reference ("the company", "this contract", "see above"). Late chunking embeds the entire long document through the transformer first, *then* applies mean pooling per chunk over the already-contextualized token vectors. Each chunk embedding is now conditioned on the rest of the document.

## Core Concept

```
Naive:  text -> [chunk1, chunk2, ...] -> [embed(chunk1), embed(chunk2), ...]
                ^ pronouns dangling

Late:   text -> token_embeddings (full doc context) -> [pool(tokens[c1]), pool(tokens[c2]), ...]
                                                       ^ each chunk vec sees the whole doc
```

Requires a **long-context embedding model** (8K+ tokens). Jina v2/v3/v4, BGE-M3, Voyage-3 all qualify. The token-level forward pass is the same cost; the chunk-level pooling step is essentially free.

## Why It Works

A chunk like "He resigned in March." in isolation embeds near nothing useful. After running the whole article through the encoder, that chunk's tokens have already attended to "Tim Cook", "Apple", "2024", "succession plan" upstream. Pooling those token vectors gives an embedding that knows what the chunk is *actually* about.

## Jina's Reported BeIR Results (nDCG@10)

| Dataset | Naive | Late | Δ |
|---|---|---|---|
| SciFact | 64.20 | 66.10 | +1.9 |
| TRECCOVID | 63.36 | 64.70 | +1.3 |
| NFCorpus | 23.46 | 29.98 | **+6.5** |
| FiQA-2018 | 33.25 | 33.84 | +0.6 |
| Quora | 87.19 | 87.19 | 0 (very short docs) |

Effect grows with document length. Below ~512 tokens per doc, late chunking is a no-op.

## When It Helps

- **Long, narrative or referential docs** with anaphora and back-references (legal, technical reports, transcripts).
- **Domains where chunk-internal context is sparse** (each chunk relies on the doc's setup).
- **You want sentence- or paragraph-grained chunks** without losing context.
- **Pairs naturally with reranking and contextual retrieval** — orthogonal techniques.

## When It Hurts

- **Short, self-contained corpora** (FAQs, knowledge base articles): no context to preserve.
- **Embedders without long context**: forcing through a 512-token model means you're back to naive chunking for any doc longer than that.
- **You need only one vector per doc**: late chunking is about producing many *informed* sub-vectors. If single doc-level vectors suffice, just embed the doc.
- **Highly heterogeneous docs**: averaging across topics can blur signal. Tune with topic-aware boundaries.

## Implementation Patterns

### Manual late chunking with a HuggingFace model

```python
import torch, numpy as np
from transformers import AutoTokenizer, AutoModel

tok = AutoTokenizer.from_pretrained("jinaai/jina-embeddings-v3", trust_remote_code=True)
model = AutoModel.from_pretrained("jinaai/jina-embeddings-v3", trust_remote_code=True).eval().cuda()

def late_chunk(text: str, chunk_token_size: int = 256):
    enc = tok(text, return_tensors="pt", return_offsets_mapping=True, truncation=True, max_length=8192)
    offsets = enc.pop("offset_mapping")[0].tolist()
    enc = {k: v.cuda() for k, v in enc.items()}
    with torch.no_grad():
        token_embs = model(**enc).last_hidden_state[0]  # (T, dim)

    # Build chunk spans by sliding token windows (you can swap in semantic boundaries)
    T = token_embs.shape[0]
    spans = [(i, min(i + chunk_token_size, T)) for i in range(0, T, chunk_token_size)]

    chunks = []
    for s, e in spans:
        emb = token_embs[s:e].mean(dim=0).cpu().numpy()
        emb = emb / (np.linalg.norm(emb) + 1e-9)
        char_start = offsets[s][0]
        char_end = offsets[e - 1][1]
        chunks.append({"text": text[char_start:char_end], "embedding": emb})
    return chunks
```

### Jina API (managed)

```python
import requests
r = requests.post("https://api.jina.ai/v1/embeddings", json={
    "model": "jina-embeddings-v3",
    "input": [long_doc_text],
    "task": "retrieval.passage",
    "late_chunking": True,           # the magic flag
    "chunk_size": 256,
}, headers={"Authorization": f"Bearer {JINA_KEY}"}).json()
# r["data"] now contains one entry per chunk, each with text + embedding
```

### Integrating with semantic boundaries

Late chunking is orthogonal to *where* you split. You can compute token embeddings once over the full doc, then derive chunk spans from sentence boundaries, semantic shifts (cosine drift between adjacent sentence embeddings), or markdown headers — and pool over those spans.

## Eval / Tuning

- **Compare on long-doc benchmarks**: NFCorpus, SciFact, your own long-doc set. Naive vs late, same chunk_size, same retriever.
- **Sweep chunk size**: 128 / 256 / 512 tokens. Smaller chunks benefit more from late chunking (more context to gain).
- **Combine with reranker**: the precision floor moves up; rerank profit may shift.
- **Verify model supports it**: not every "long context" embedder produces stable token-level vectors; check that mean-pooled regions still cluster sanely on a held-out set.
- **Long doc handling**: docs longer than the encoder's context (8K-32K depending on model) need a sliding window with overlap. Late chunking within each window, then merge.

## Common Pitfalls

- **Confusing late chunking with late interaction (ColBERT)**: different ideas. Late chunking still produces *one vector per chunk*; ColBERT keeps all token vectors at search time.
- **Using a short-context model**: you're just doing naive chunking by another name.
- **Truncating documents silently**: if you exceed `max_length`, you lose tail content. Use sliding windows.
- **Throwing away offsets**: you need character offsets to recover the chunk text for citations and display.
- **Stacking with contextual retrieval blindly**: both add cross-chunk awareness. Measure each independently before combining.
- **Blob averaging over too-large spans**: half a doc averaged to one vector loses everything. Stick to 128-512 token chunks.

## When to Use This Mode

Use late chunking when:

- Docs are long (≥1K tokens) with cross-chunk references.
- Your embedder supports long context (Jina v2/v3/v4, BGE-M3, Voyage-3, etc.).
- You measured pronoun/reference loss in your retrieval failures.

Skip when:

- Docs are short or self-contained.
- You only have a 512-token embedder and can't switch.
- Contextual Retrieval already covers the same gap and is in place.

## Sources

- Günther et al., "Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models" — https://arxiv.org/abs/2409.04701
- Jina blog, "Late Chunking in Long-Context Embedding Models" — https://jina.ai/news/late-chunking-in-long-context-embedding-models/
- Jina API docs (late_chunking flag) — https://jina.ai/embeddings/
- jina-embeddings-v3 model card — https://huggingface.co/jinaai/jina-embeddings-v3
- BGE-M3 (alternative long-context embedder) — https://huggingface.co/BAAI/bge-m3
