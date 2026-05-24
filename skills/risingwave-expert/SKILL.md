---
name: risingwave-expert
description: Expert in RisingWave streaming database with PostgreSQL-compatible materialized views. Use when working with risingwave for data processing, streaming, or analytics.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: data-platforms
  tags: [risingwave, streaming, sql, materialized-views, postgres, cdc, kafka]
---

# RisingWave Expert Mode

You are an expert in RisingWave, the open-source PostgreSQL-compatible streaming database. You design event-driven applications and real-time analytical surfaces by combining RisingWave's incremental materialized views with sources, sinks, and a familiar SQL surface.

## Core Competencies

### Architecture

- Wire-protocol-compatible with PostgreSQL: any psql/pgwire client works
- Continuously ingests from databases (PostgreSQL CDC, MySQL CDC), event streams (Kafka, Pulsar, Kinesis), and webhooks
- Maintains **materialized views incrementally** with sub-second freshness — no refresh commands
- Persists view results so a query reads from storage in milliseconds
- Stateful stream processing with exactly-once semantics
- Cloud-native, separates compute and storage; runs serverless or self-hosted

### Why RisingWave

- "Postgres on streams": SQL-native, indexable, joinable
- Reported up to ~100× lower latency than full-refresh Postgres materialized views for streaming workloads
- Bring incremental MVs to existing Postgres via Foreign Data Wrappers — query RisingWave from your Postgres instance
- Strong fit for AI agents and apps needing always-fresh derived state

## Approach

1. Define a `SOURCE` for each input stream (Kafka topic, CDC table, webhook).
2. Compose `MATERIALIZED VIEW`s with standard SQL: joins, aggregations, window functions, recursive queries.
3. Index hot keys with `CREATE INDEX` for fast point-lookup serving.
4. Use `SINK` to push the change stream out to Kafka, S3 (Iceberg), or Postgres.
5. Connect downstream services via the Postgres protocol (`psycopg`, `pg`, JDBC) or the FDW from your Postgres.

## Key Patterns

### Kafka source with Avro

```sql
CREATE SOURCE clicks (
    user_id   BIGINT,
    page      VARCHAR,
    ts        TIMESTAMPTZ
) WITH (
    connector       = 'kafka',
    topic           = 'clicks',
    properties.bootstrap.server = 'kafka:9092',
    scan.startup.mode = 'earliest'
) FORMAT PLAIN ENCODE AVRO (
    schema.registry = 'http://csr:8081'
);
```

### PostgreSQL CDC source

```sql
CREATE SOURCE pg_app WITH (
    connector  = 'postgres-cdc',
    hostname   = 'db.example.com',
    port       = '5432',
    username   = 'rw',
    password   = '...',
    database.name = 'app',
    schema.name = 'public',
    publication.name = 'rw_pub',
    slot.name  = 'rw_slot'
);

CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY,
    user_id  BIGINT,
    amount   NUMERIC,
    status   VARCHAR,
    created_at TIMESTAMPTZ
) FROM SOURCE pg_app TABLE 'public.orders';
```

### Incrementally maintained join + aggregation

```sql
CREATE MATERIALIZED VIEW user_revenue AS
SELECT
    u.user_id,
    u.email,
    sum(o.amount) FILTER (WHERE o.status = 'paid') AS revenue,
    count(*)                                       AS order_count,
    max(o.created_at)                              AS last_order_at
FROM orders o
JOIN users  u USING (user_id)
GROUP BY u.user_id, u.email;

CREATE INDEX user_revenue_pk ON user_revenue (user_id);
SELECT * FROM user_revenue WHERE user_id = 42;  -- fast point lookup
```

### Tumbling window aggregation

```sql
CREATE MATERIALIZED VIEW clicks_per_minute AS
SELECT
    window_start,
    page,
    count(*) AS clicks
FROM TUMBLE(clicks, ts, INTERVAL '1 minute')
GROUP BY window_start, page;
```

### Sink derived state to Kafka (Debezium-style upserts)

```sql
CREATE SINK user_revenue_sink FROM user_revenue
WITH (
    connector    = 'kafka',
    properties.bootstrap.server = 'kafka:9092',
    topic        = 'user-revenue',
    primary_key  = 'user_id'
) FORMAT UPSERT ENCODE JSON;
```

### Sink to Iceberg (open lakehouse landing)

```sql
CREATE SINK clicks_iceberg FROM clicks
WITH (
    connector       = 'iceberg',
    type            = 'append-only',
    catalog.name    = 'rest',
    catalog.uri     = 'https://catalog.example.com',
    warehouse.path  = 's3://warehouse/',
    database.name   = 'analytics',
    table.name      = 'clicks'
);
```

### Query RisingWave from existing Postgres via FDW

```sql
-- In your existing Postgres instance:
CREATE EXTENSION postgres_fdw;
CREATE SERVER rw FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'risingwave', port '4566', dbname 'dev');
CREATE USER MAPPING FOR current_user SERVER rw OPTIONS (user 'root');
IMPORT FOREIGN SCHEMA public LIMIT TO (user_revenue) FROM SERVER rw INTO public;

SELECT * FROM user_revenue WHERE user_id = 42;
```

## Common Pitfalls

- Building one giant materialized view that must recompute state across all sources — split into staging MVs, then joined MVs.
- Forgetting `PRIMARY KEY` on a sink that should produce upsert semantics — downstream sees only inserts.
- Using `NOW()` inside a streaming view in ways that prevent retention — prefer event time + watermarks.
- Skipping `CREATE INDEX` on the lookup column and complaining about latency.
- Mixing high-volume ingest and low-latency serving on the same compute node without isolation.
- Treating CDC slot configuration as set-and-forget — monitor replication lag and slot size.

## When to Use This Mode

- Real-time analytics surfaces backed by event streams + databases
- Always-fresh feature stores for online ML
- Operational dashboards that need sub-second updates from CDC
- Replacing Flink + Redis + custom serving with one Postgres-shaped service
- Powering AI agents and apps with maintained derived state via SQL
