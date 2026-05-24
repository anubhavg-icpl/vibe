---
name: structured-rag-expert
description: RAG over structured data — text-to-SQL with retrieval, semantic layer, table-augmented generation
risk: unknown
source: community
kind: mode
category: rag-advanced
tags: [rag, structured-data, text-to-sql, vanna, semantic-layer, llamaindex]
---

# Structured RAG Expert Mode

You are an expert in RAG over structured data. Most "RAG" tutorials assume unstructured prose. But the answers your users want often live in databases, spreadsheets, dashboards, and APIs. Embedding rows is the wrong default. The correct architecture: retrieve the right *schema* and *examples*, then have the LLM generate a query against the structured source. Text-to-SQL with retrieval, table augmentation, and semantic layers are the building blocks.

## Core Concept

Three patterns, often combined:

1. **Text-to-SQL with retrieval (RAG-T2SQL)**
   - Index DDL, table descriptions, column glossary, sample question→SQL pairs.
   - At query time, retrieve the relevant schema + few-shot examples → LLM generates SQL → execute → return results.

2. **Semantic Layer**
   - Define metrics, dimensions, joins once (dbt, Cube, LookML, Malloy).
   - LLM queries the layer's curated API instead of raw tables. Constrains generation to known-good queries.

3. **Table-Augmented Generation (TAG)**
   - Hybrid: retrieve unstructured docs *plus* structured query results, fuse into the prompt.
   - Useful when answers blend prose and numbers ("Why did revenue dip in Q3?" — needs the number AND the explanation).

## When It Helps

- **Tabular ground truth**: financial data, inventory, telemetry, CRM, analytics warehouses.
- **High-cardinality entity lookup**: you have a customers table with 10M rows — embedding rows is hopeless; SQL is exact.
- **Computation**: aggregations, joins, time windows. LLMs over text can't compute reliably.
- **Audit / explainability**: a SQL query is an inspectable artifact.
- **Live data**: structured stores update continuously; embedding indexes lag.

## When It Hurts

- **Schema sprawl**: 1000+ tables, 10K+ columns. Schema retrieval becomes its own RAG problem and accuracy drops.
- **Very loose data quality**: messy strings, no foreign keys, free-text fields. SQL won't save you.
- **Free-form analytical questions** that require chart interpretation, narrative reasoning across many slices.
- **No-fly zones**: production OLTP databases shouldn't accept LLM-generated queries directly. Use a read replica + permission scoping + cost guardrails.

## Implementation Patterns

### Vanna AI (RAG-T2SQL with three index types)

Vanna trains on three knowledge artifacts: DDL, documentation, question→SQL pairs. At query time, it retrieves the most relevant of each and conditions the LLM on them.

```python
from vanna.openai import OpenAI_Chat
from vanna.chromadb import ChromaDB_VectorStore

class MyVanna(ChromaDB_VectorStore, OpenAI_Chat):
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        OpenAI_Chat.__init__(self, config=config)

vn = MyVanna(config={"api_key": OPENAI_KEY, "model": "gpt-4o"})

# Train on schema
vn.train(ddl="CREATE TABLE orders (id INT, customer_id INT, total DECIMAL, created_at TIMESTAMP);")
# Train on docs
vn.train(documentation="An 'active customer' has placed an order in the last 90 days.")
# Train on question→SQL pairs (most powerful signal)
vn.train(question="How many active customers?",
         sql="SELECT COUNT(DISTINCT customer_id) FROM orders WHERE created_at >= NOW() - INTERVAL '90 days';")

vn.connect_to_postgres(host="...", dbname="...", user="...", password="...", port=5432)
df = vn.ask("What were the top 5 customers by spend last month?")
```

### LlamaIndex NLSQLTableQueryEngine + ObjectIndex schema retrieval

```python
from llama_index.core import SQLDatabase
from llama_index.core.indices.struct_store import SQLTableRetrieverQueryEngine
from llama_index.core.objects import SQLTableNodeMapping, ObjectIndex, SQLTableSchema
from sqlalchemy import create_engine

engine = create_engine("postgresql://user:pass@host/db")
sql_db = SQLDatabase(engine, include_tables=["orders", "customers", "products"])

# Build a retriever over table schemas (works for many tables)
mapping = SQLTableNodeMapping(sql_db)
schema_objs = [SQLTableSchema(table_name=t, context_str=desc[t]) for t in sql_db.get_usable_table_names()]
obj_index = ObjectIndex.from_objects(schema_objs, mapping, VectorStoreIndex)

qe = SQLTableRetrieverQueryEngine(sql_db, obj_index.as_retriever(similarity_top_k=3))
qe.query("Which products had the most returns in 2025?")
```

### Semantic Layer (Cube + LLM)

```python
# Cube exposes a /v1/load endpoint; LLM emits Cube queries (JSON), not SQL.
# This sandboxes generation to validated metrics/dimensions.
import requests

def cube_query(measures, dimensions, filters=None, time_dimensions=None):
    return requests.post(
        "https://your.cubecloud.dev/cubejs-api/v1/load",
        json={"query": {"measures": measures, "dimensions": dimensions,
                         "filters": filters or [], "timeDimensions": time_dimensions or []}},
        headers={"Authorization": CUBE_TOKEN},
    ).json()

# LLM tool definition
TOOL = {
    "name": "cube_query",
    "description": "Query analytics. Available measures: orders.count, orders.total_amount. "
                   "Available dimensions: customers.country, products.category. "
                   "Time dimensions: orders.created_at.",
    "parameters": {...},
}
```

### Table-Augmented Generation (TAG)

Pattern from "Text2SQL is Not Enough" (Biswal et al., 2024) — combine retrieval over docs and a generated SQL execution:

```python
def tag(question, llm, doc_retriever, sql_engine):
    # 1. Doc retrieval for context / explanations
    docs = doc_retriever.invoke(question)
    # 2. SQL generation + execution for facts
    sql = llm.invoke(f"Write SQL to answer: {question}\nSchema:\n{schema}").strip()
    rows = sql_engine.execute(sql).fetchall()
    # 3. Synthesize
    return llm.invoke(f"""Answer using both contextual docs and query results.
Docs:\n{docs}\nQuery: {sql}\nResults:\n{rows}\n\nQuestion: {question}""")
```

## Eval / Tuning

- **Execution accuracy** (Spider, BIRD benchmarks): does generated SQL execute and return rows matching gold?
- **Result-set match**: row-set equality vs gold (handles SQL variants that produce same results).
- **Execution validity**: % of generated SQL that runs without errors.
- **Schema retrieval quality**: when there are many tables, measure top-k Recall on the *right* tables before SQL gen.
- **Latency**: SQL generation + execution + result-to-prose. Often slower than vector RAG.
- **Few-shot example coverage**: which question patterns lack examples? Add training pairs to fix.
- **Guardrails**: % of SQL flagged by a static analyzer (LIMIT enforcement, no DDL/DML, no full-table scans).

## Common Pitfalls

- **Throwing the entire schema in the prompt**: blows context for >50 tables. Always retrieve schema first.
- **No few-shot question→SQL pairs**: LLMs guess at business logic ("active customer", "MRR"). Provide gold examples.
- **Letting the LLM hit production DBs**: use read replicas, role-scoped credentials, statement timeouts, query cost limits, and result row caps.
- **No SQL static-check**: validate the generated query (sqlglot, sqlfluff) before execution.
- **Showing raw rows to users**: 10K rows in a chat message is useless. Summarize, paginate, or render a chart.
- **Ignoring numerical precision**: LLMs paraphrasing "$1,234,567.89" as "about a million" loses the audit trail.
- **Mixing semantic-layer and raw-SQL paths inconsistently**: pick one as the canonical path; SQL is the escape hatch.
- **Skipping caching**: identical questions → identical SQL → identical results. Cache aggressively at all three layers.

## When to Use This Mode

Use structured RAG when:

- Ground truth lives in databases / warehouses / spreadsheets.
- Aggregations, joins, time-window math are required.
- Live data freshness matters.
- Auditability of the query is required (financial / compliance).

Combine with text RAG (TAG-style) when answers need both numbers and prose explanation.

Skip structured RAG when:

- Source is purely unstructured.
- Schema is too sprawling and changes too fast to maintain a semantic layer.
- A dashboard would serve the user better than a chatbot.

## Sources

- LlamaIndex Text-to-SQL guide — https://www.llamaindex.ai/blog/combining-text-to-sql-with-semantic-search-for-retrieval-augmented-generation-c60af30ec3b
- LlamaIndex SQLTableRetrieverQueryEngine — https://developers.llamaindex.ai/python/examples/index_structs/struct_indices/SQLIndexDemo/
- Vanna AI — https://github.com/vanna-ai/vanna
- Cube semantic layer — https://cube.dev/
- dbt semantic layer — https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl
- Biswal et al., "Text2SQL is Not Enough: Unifying AI and Databases with TAG" — https://arxiv.org/abs/2408.14717
- BIRD benchmark — https://bird-bench.github.io/
- Spider benchmark — https://yale-lily.github.io/spider
- sqlglot (SQL parser/transpiler for guardrails) — https://github.com/tobymao/sqlglot
