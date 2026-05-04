# Advanced RAG Modes

Beyond the basics covered in `ai-ml/rag-expert-mode.md`. These modes go deep on the techniques that matter in production RAG systems for 2025-2026: hybrid retrieval, late interaction, contextual / late chunking, agentic loops, multimodal pipelines, hierarchical summarization, evaluation rigor, and structured-data retrieval.

Each mode is grounded in real papers, libraries, and production docs. Cite the sources at the bottom of each mode when in doubt.

## Index by category

### Retrieval improvements (the core stack)

- **[hyde-expert-mode.md](./hyde-expert-mode.md)** — Hypothetical Document Embeddings: generate a fake answer, embed *that*, then retrieve. When dense retrieval fails on short / vague queries.
- **[hybrid-search-expert-mode.md](./hybrid-search-expert-mode.md)** — BM25 + dense fusion via Reciprocal Rank Fusion (RRF, k=60), weighted ensembling, and SPLADE learned sparse.
- **[rerank-expert-mode.md](./rerank-expert-mode.md)** — Cross-encoder rerankers: Cohere Rerank 3.5, Jina Reranker v2, BGE-reranker, voyage-rerank-2, ColBERT-as-reranker, LLM-as-judge.
- **[colbert-expert-mode.md](./colbert-expert-mode.md)** — ColBERT v2 late interaction, MaxSim scoring, RAGatouille library, indexing storage trade-offs.
- **[contextual-retrieval-expert-mode.md](./contextual-retrieval-expert-mode.md)** — Anthropic's Contextual Retrieval: prepend chunk-specific context before embedding. Stacks with BM25 + rerank for −67% top-20 failure rate.

### Query-side techniques

- **[query-rewriting-expert-mode.md](./query-rewriting-expert-mode.md)** — Conversational rewriting, multi-query, sub-question decomposition, step-back prompting (DeepMind 2310.06117), RAG-Fusion.

### Agentic and adaptive RAG

- **[agentic-rag-expert-mode.md](./agentic-rag-expert-mode.md)** — Tool-calling search loops, ReAct, LlamaIndex AgentWorkflow, LangGraph, exit conditions.
- **[self-rag-expert-mode.md](./self-rag-expert-mode.md)** — Self-RAG (Asai et al., ICLR 2024): reflection tokens decide retrieval and grade evidence inline.
- **[crag-expert-mode.md](./crag-expert-mode.md)** — Corrective RAG (Yan et al., 2024): retrieval evaluator + web-search fallback when the KB is insufficient.

### Multimodal & specialized data

- **[multimodal-rag-expert-mode.md](./multimodal-rag-expert-mode.md)** — Vision-native RAG: ColPali, jina-embeddings-v4, voyage-multimodal-3, DSE, ViDoRe benchmark, PDF rendering.
- **[structured-rag-expert-mode.md](./structured-rag-expert-mode.md)** — Text-to-SQL with retrieval (Vanna, LlamaIndex NLSQLTableQueryEngine), semantic layers (Cube, dbt), Table-Augmented Generation.

### Chunking & document organization

- **[chunk-strategy-expert-mode.md](./chunk-strategy-expert-mode.md)** — Fixed, recursive, document-aware (Markdown / HTML / code), semantic (Greg Kamradt), proposition-based (Dense X), agentic chunking.
- **[late-chunking-expert-mode.md](./late-chunking-expert-mode.md)** — Jina's Late Chunking (arXiv:2409.04701): embed long context first, then chunk the token embeddings.
- **[parent-child-retriever-expert-mode.md](./parent-child-retriever-expert-mode.md)** — Small chunks for retrieval, large parents for context. Sentence-window, multi-vector with summaries / hypothetical questions, auto-merging.
- **[raptor-expert-mode.md](./raptor-expert-mode.md)** — RAPTOR (ICLR 2024): recursive abstractive summarization tree for long-document QA.
- **[graphrag-expert-mode.md](./graphrag-expert-mode.md)** — Microsoft GraphRAG: entity / community extraction, hierarchical summarization, local vs global queries, DRIFT search.

### Evaluation

- **[rag-eval-expert-mode.md](./rag-eval-expert-mode.md)** — RAGAS metrics (faithfulness, answer relevancy, context precision/recall), DeepEval, TruLens, NIAH, RULER long-context battery, golden sets.

## How they combine

A modern production RAG stack typically pulls from multiple modes. A common starting point:

```
chunk-strategy  →  contextual-retrieval  →  hybrid-search  →  rerank  →  generation
                                                                ↑
                                                  rag-eval (continuous)
```

Add **agentic-rag** when queries are multi-hop. Add **self-rag** or **crag** when faithfulness / coverage is the bottleneck. Swap in **multimodal-rag** for visually-rich corpora. Swap in **structured-rag** when the source of truth is a database. Use **graphrag** or **raptor** for synthesis-style queries that span many documents.

Don't adopt techniques because they're trendy — adopt them because **rag-eval** says they help your data.
