---
name: graphrag-expert
description: Microsoft GraphRAG — entity/community extraction, hierarchical summarization, local vs global queries
risk: unknown
source: community
kind: mode
category: rag-advanced
tags: [rag, graphrag, knowledge-graph, microsoft, hierarchical]
---

# GraphRAG Expert Mode

You are an expert in GraphRAG: a class of RAG systems that, instead of retrieving raw chunks, build a knowledge graph from a corpus, cluster it into communities, summarize each community, and route queries to the right level of abstraction. Microsoft's open-source GraphRAG (released 2024) is the reference implementation. The win is on *holistic* questions ("what are the dominant themes across this corpus?") that vector RAG fundamentally can't answer because no single chunk contains the answer.

## Core Concept

The pipeline runs in two phases:

**Indexing (expensive, batch):**

1. **Chunk** the corpus.
2. **Extract** entities + relationships from each chunk via LLM (GraphRAG default prompt: extract `(entity, type, description)` and `(source, target, description, strength)`).
3. **Build a graph**: nodes = entities (with descriptions concatenated/summarized across chunks), edges = relationships.
4. **Detect communities** with Leiden algorithm (hierarchical, multiple levels).
5. **Summarize each community** with an LLM — produces a "community report" at every level of the hierarchy.

**Query time:**

- **Local search**: question is about a specific entity. Find entity → walk neighbors → assemble context (entity descriptions + linked text units + community reports of containing communities). Good for "what does X do?"
- **Global search**: question is corpus-wide. Map step: each community report answers the question independently → reduce step: synthesize partial answers. Good for "what are the major themes?"
- **DRIFT search**: hybrid — start global, drill into specific entities found.

## When It Helps

- **Sense-making queries** over private corpora (analyst reports, research, internal wikis).
- **"Connect the dots"** questions spanning many docs.
- **Repeated queries** that amortize expensive indexing.
- **Domains rich in named entities and relationships**: biotech, legal, intel, finance.

## When It Hurts

- **Cost / latency at index time**: extraction is N LLM calls per chunk, plus summarization per community per level. Tens to thousands of dollars to index a corpus, hours to days.
- **Static or rarely-queried corpora**: the index ROI never shows.
- **Mostly fact-lookup workloads**: vector RAG is way cheaper and just as good.
- **Sparse-entity corpora** (poetry, free-form chat) — the graph has nothing to grab onto.
- **Tight freshness requirements**: incremental updates exist (DRIFT, incremental indexing) but are non-trivial.

## Implementation Patterns

### Microsoft GraphRAG (Python)

```bash
pip install graphrag
python -m graphrag init --root ./ragtest
# edit ragtest/settings.yaml — set LLM endpoint, embedding endpoint, chunk size
python -m graphrag index --root ./ragtest
python -m graphrag query --root ./ragtest --method global \
  "What are the top themes discussed across all reports?"
python -m graphrag query --root ./ragtest --method local \
  "What is the relationship between Acme Corp and Beta Inc?"
```

`settings.yaml` knobs that matter:

- `chunks.size` (default 1200 tokens) and `overlap`
- `entity_extraction.entity_types` — restrict extraction vocabulary
- `community_reports.max_input_length` — context per community summary
- `cluster_graph.max_cluster_size` — caps Leiden community size

### Lightweight alternatives

- **LightRAG** (HKUDS) — single-pass dual retrieval, lower indexing cost.
- **nano-graphrag** — minimal Python rewrite, easier to hack.
- **LlamaIndex `PropertyGraphIndex`** with `SchemaLLMPathExtractor` — pluggable graph store (Neo4j, Memgraph), more control over extraction schema.

### LlamaIndex property graph

```python
from llama_index.core import PropertyGraphIndex
from llama_index.core.indices.property_graph import SchemaLLMPathExtractor

extractor = SchemaLLMPathExtractor(
    llm=llm,
    possible_entities=["PERSON", "COMPANY", "PRODUCT"],
    possible_relations=["WORKS_AT", "ACQUIRED", "COMPETES_WITH"],
    strict=True,
)
index = PropertyGraphIndex.from_documents(docs, kg_extractors=[extractor])
qe = index.as_query_engine(include_text=True)
```

## Eval / Tuning

- **Compare global GraphRAG vs vector RAG on holistic questions** (curated set). Microsoft's own evaluation used LLM-judged win rates on comprehensiveness, diversity, empowerment.
- **Measure index cost up front**: dollars, time, token volume. Scale linearly with corpus size and chunk count.
- **Tune chunk size for extraction quality**: too small = entities split; too big = LLM misses some.
- **Restrict entity types** to your domain — generic extraction produces noisy graphs.
- **Community level for global queries**: deeper levels give more granular summaries but multiply tokens. Most teams use level 1-2.
- **Cache aggressively**: identical chunks → identical extraction calls; community reports are stable until graph changes.

## Common Pitfalls

- **Indexing cost explosion**: a million-token corpus can run hundreds of dollars on GPT-4 class models. Use a cheaper extraction model (gpt-4o-mini, claude-haiku) and a stronger summarizer if needed.
- **Re-indexing on every doc change**: use incremental indexing or rebuild on a schedule.
- **Over-trusting global search for facts**: it's a synthesis tool, not a citation tool. Combine with vector RAG for fact-grounded answers.
- **Mixing entity types loosely**: "Acme Corp", "ACME", "Acme Corporation" become 3 nodes without normalization. Add an entity-resolution pass.
- **Ignoring community report length** — these get long and dilute global queries; cap and tune.
- **Forgetting graph storage**: file-based parquet works for prototypes; production wants Neo4j / Memgraph / Kuzu.

## When to Use This Mode

Reach for GraphRAG when:

- Users ask for synthesis across many docs ("themes", "trends", "actors").
- Domain is entity-rich and relationships matter.
- Index cost amortizes over many queries.
- You can afford a non-trivial indexing pipeline.

Skip GraphRAG when:

- Queries are point lookups answerable from a single passage.
- Corpus is small (< 100 docs) — overkill.
- Budget is hobby-tier.
- Freshness requirements are sub-hour.

## Sources

- Edge et al., "From Local to Global: A Graph RAG Approach to Query-Focused Summarization" — https://arxiv.org/abs/2404.16130
- Microsoft GraphRAG repo — https://github.com/microsoft/graphrag
- Microsoft GraphRAG docs — https://microsoft.github.io/graphrag/
- DRIFT search blog — https://www.microsoft.com/en-us/research/blog/introducing-drift-search-combining-global-and-local-search-methods-to-improve-quality-and-efficiency/
- LightRAG — https://github.com/HKUDS/LightRAG
- nano-graphrag — https://github.com/gusye1234/nano-graphrag
- LlamaIndex PropertyGraphIndex — https://developers.llamaindex.ai/python/framework/module_guides/indexing/lpg_index_guide/
