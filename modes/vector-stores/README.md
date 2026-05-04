# Vector Stores & Embeddings Modes

Deep, system-specific vibe modes for vector databases and embedding model selection / training / quantization. Built from the 2025-2026 docs of each system.

Each mode goes far beyond the generic `ai-ml/vector-database-expert-mode.md` — it covers the index internals, real query syntax, and current pitfalls of one specific tool or technique.

## How to Choose a Mode

```text
Need to pick a vector DB?            → start with the open-source / managed / embedded sections
Need to pick an embedding model?     → embedding-model-picker-expert-mode
Need multilingual?                   → multilingual-embed-expert-mode
Need code search?                    → code-embed-expert-mode
Want to fine-tune embeddings?        → embedding-fine-tune-expert-mode
Cutting RAM / storage cost?          → binary-quantization-expert-mode
```

## Open-Source / Self-Hosted Vector DBs

- **[pgvector-expert-mode](pgvector-expert-mode.md)** — pgvector 0.8+: HNSW vs IVFFlat, halfvec/sparsevec, hybrid w/ tsvector + RRF in pure SQL, pgvectorscale (StreamingDiskANN)
- **[qdrant-expert-mode](qdrant-expert-mode.md)** — Qdrant: payload filtering, scalar/binary/PQ quantization, multi-vector, dense+sparse hybrid, distributed mode
- **[weaviate-expert-mode](weaviate-expert-mode.md)** — Weaviate v1.27+: collections, named vectors, vectorizer modules, hybrid, per-tenant shards
- **[milvus-expert-mode](milvus-expert-mode.md)** — Milvus 2.5+: HNSW/DiskANN/IVF/SCANN/CAGRA, partitions, multi-vector hybrid, GPU indexes, Milvus Lite
- **[vespa-expert-mode](vespa-expert-mode.md)** — Vespa: ranking expressions, tensor framework, ColBERT MaxSim, sparse + dense in one query, multi-phase ranking
- **[chroma-expert-mode](chroma-expert-mode.md)** — Chroma 1.0+: collections, multi-modal (OpenCLIP), distance metrics, persistence, Rust core perf
- **[marqo-expert-mode](marqo-expert-mode.md)** — Marqo: end-to-end vector search with embedding inference baked in, ONNX/GPU, ecommerce-tuned models

## Managed / Serverless Vector DBs

- **[pinecone-expert-mode](pinecone-expert-mode.md)** — Pinecone serverless: namespaces, sparse-dense, integrated inference (embed + rerank), dedicated read nodes
- **[turbopuffer-expert-mode](turbopuffer-expert-mode.md)** — Turbopuffer: object-storage-first vector + FTS, three-tier caching, ~$0.02/GB cold storage
- **[mongodb-atlas-vector-expert-mode](mongodb-atlas-vector-expert-mode.md)** — MongoDB Atlas: `$vectorSearch` aggregation, `$rankFusion`/`$scoreFusion` hybrid, HNSW indexes
- **[opensearch-vector-expert-mode](opensearch-vector-expert-mode.md)** — OpenSearch k-NN: Lucene/Faiss/NMSLIB engines, neural sparse, hybrid query DSL
- **[redis-vector-expert-mode](redis-vector-expert-mode.md)** — Redis Stack / RediSearch: FLAT, HNSW, SVS-VAMANA, KNN + range queries, hybrid filter syntax

## Embedded / File-Backed

- **[lancedb-expert-mode](lancedb-expert-mode.md)** — LanceDB: Lance columnar format, S3-backed tables, FTS, versioning, multimodal lakehouse
- **[chroma-expert-mode](chroma-expert-mode.md)** *(also embedded mode)* — local-first Python via PersistentClient
- **[milvus-expert-mode](milvus-expert-mode.md)** *(via Milvus Lite)* — single-binary, file-backed; same API as Distributed

## Embedding Models & Techniques

- **[embedding-model-picker-expert-mode](embedding-model-picker-expert-mode.md)** — Pick the right model in 2025-2026; OpenAI vs Cohere vs Voyage vs Jina vs BGE vs E5 vs Nomic vs Stella vs Arctic; reading MTEB; trading dimension/cost/quality
- **[multilingual-embed-expert-mode](multilingual-embed-expert-mode.md)** — Multilingual: BGE-M3 (dense+sparse+ColBERT in one pass), multilingual-e5, Jina v3, Cohere multilingual, Nomic v2, Arctic-Embed
- **[code-embed-expert-mode](code-embed-expert-mode.md)** — Code: voyage-code-3, jina-code-embeddings, CodeRankEmbed, GraphCodeBERT; AST chunking; cross-lingual code search
- **[embedding-fine-tune-expert-mode](embedding-fine-tune-expert-mode.md)** — Fine-tune with sentence-transformers v3+; SentenceTransformerTrainer, MNRL/CMNRL, Matryoshka, hard negatives mining
- **[binary-quantization-expert-mode](binary-quantization-expert-mode.md)** — Binary / scalar / PQ quantization; rescore-after-quant pipeline; Hamming distance; when each is "free"

## Companion Modes Outside This Directory

- `modes/ai-ml/rag-expert-mode.md` — RAG architecture (chunking → embed → retrieve → augment)
- `modes/ai-ml/vector-database-expert-mode.md` — generic overview (kept for parity); use the specific modes here for depth
- `modes/rag-advanced/` — advanced RAG (hybrid, rerank, evals, agents)

## Sources Cited Across Modes

- pgvector / pgvectorscale: https://github.com/pgvector/pgvector | https://github.com/timescale/pgvectorscale
- Qdrant: https://qdrant.tech/documentation/
- Weaviate: https://docs.weaviate.io/weaviate/
- Milvus: https://milvus.io/docs/
- Pinecone: https://docs.pinecone.io/
- Vespa: https://docs.vespa.ai/
- LanceDB: https://docs.lancedb.com/
- Chroma: https://docs.trychroma.com/
- Marqo: https://github.com/marqo-ai/marqo
- Turbopuffer: https://turbopuffer.com/docs/
- Redis vector: https://redis.io/docs/latest/develop/ai/search-and-query/vectors/
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/atlas-vector-search/
- OpenSearch k-NN: https://docs.opensearch.org/latest/vector-search/
- MTEB: https://huggingface.co/spaces/mteb/leaderboard
- Sentence Transformers: https://sbert.net/
- HuggingFace embedding quantization: https://huggingface.co/blog/embedding-quantization
