# Data Platforms Modes

Modern data-platform vibe modes covering query engines, table formats, streaming
databases, dataframes, ingestion, orchestration, and analytics APIs as of
2025-2026. Each mode is grounded in primary docs; check the per-mode references
inline for citations.

## Query Engines & Embedded Analytics

- [duckdb-expert-mode.md](./duckdb-expert-mode.md) — In-process columnar OLAP, extensions, persistent storage, federated reads
- [motherduck-expert-mode.md](./motherduck-expert-mode.md) — Cloud DuckDB with dual (hybrid) execution and database SHARES
- [clickhouse-expert-mode.md](./clickhouse-expert-mode.md) — MergeTree family, materialized views, projections, Kafka ingest
- [timescaledb-expert-mode.md](./timescaledb-expert-mode.md) — Postgres-native hypertables, continuous aggregates, columnstore compression
- [tinybird-expert-mode.md](./tinybird-expert-mode.md) — Managed ClickHouse + Pipes + published REST endpoints

## Dataframes & Distributed Compute

- [polars-expert-mode.md](./polars-expert-mode.md) — Lazy frames, expressions, the new streaming engine
- [daft-expert-mode.md](./daft-expert-mode.md) — Distributed dataframe for multimodal AI (images / audio / video)
- [ray-expert-mode.md](./ray-expert-mode.md) — Ray Core, Ray Data, Ray Serve, Ray Tune
- [arrow-expert-mode.md](./arrow-expert-mode.md) — Arrow IPC, Flight, Flight SQL, ADBC

## Open Table Formats / Lakehouse

- [iceberg-expert-mode.md](./iceberg-expert-mode.md) — Apache Iceberg, REST catalog, partition + schema evolution
- [delta-lake-expert-mode.md](./delta-lake-expert-mode.md) — Delta Lake ACID, time travel, deletion vectors, Liquid Clustering

## Streaming Databases

- [materialize-expert-mode.md](./materialize-expert-mode.md) — Streaming SQL with incrementally maintained materialized views
- [risingwave-expert-mode.md](./risingwave-expert-mode.md) — Postgres-compatible streaming database with persisted MVs
- [kafka-expert-mode.md](./kafka-expert-mode.md) — KRaft, exactly-once, transactional producers, consumer groups

## Ingestion & CDC

- [airbyte-expert-mode.md](./airbyte-expert-mode.md) — Sync modes, low-code CDK, Python CDK, PyAirbyte
- [estuary-flow-expert-mode.md](./estuary-flow-expert-mode.md) — Captures, collections, materializations, derivations

## Transformation & Orchestration

- [dbt-expert-mode.md](./dbt-expert-mode.md) — dbt-core 1.8+, contracts, unit tests, Semantic Layer
- [prefect-expert-mode.md](./prefect-expert-mode.md) — Prefect 3 flows, deployments, work pools, workers
- [dagster-expert-mode.md](./dagster-expert-mode.md) — Software-defined assets, partitions, sensors, Declarative Automation

## How to use a mode

Treat each file as a system prompt: paste the body into your assistant, or reference it via your normal vibe-mode tooling. Modes are written to be:

- Specific to APIs and versions current as of 2025-2026
- Code-first: every mode has SQL or Python you can copy and run
- Honest about pitfalls — failure modes and footguns are listed alongside the happy paths
