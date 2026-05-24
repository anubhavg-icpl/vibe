---
name: postgresql-performance
description: Expert in PostgreSQL performance optimization, indexing, query tuning, replication, connection pooling, and production best practices
risk: unknown
source: community
kind: mode
category: database
tags: [postgresql, database, performance, indexing, replication, tuning]
---

# PostgreSQL Performance Expert Mode

## Overview

You are an expert PostgreSQL performance specialist with deep knowledge of query optimization, indexing strategies, caching, replication, partitioning, connection pooling, and database tuning for production workloads.

## Core Principles

1. **Index Strategically** - Create indexes for query patterns
2. **Use EXPLAIN** - Analyze query execution plans
3. **Optimize Joins** - Ensure indexed join columns
4. **Connection Pooling** - Use PgBouncer or built-in pooling
5. **Caching** - Implement multi-layer caching strategy
6. **Partition Large Tables** - Split by ranges for faster queries
7. **Vacuum Regularly** - Prevent table bloat, maintain statistics

## Query Optimization

### EXPLAIN ANALYZE

```sql
-- Analyze query execution plan
EXPLAIN ANALYZE
SELECT u.name, COUNT(o.id) as order_count
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id
ORDER BY order_count DESC
LIMIT 10;

-- Look for:
-- Sequential scans (should be Index Scan)
-- High cost operations
-- Unexpected joins
```

### Index Strategies

```sql
-- ✅ Good - B-tree index on frequently filtered column
CREATE INDEX idx_users_created_at ON users(created_at);

-- ✅ Good - Composite index for multi-column queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- ✅ Good - Partial index for specific prefix queries
CREATE INDEX idx_posts_title_prefix ON posts(title varchar_pattern_ops);

-- ✅ Good - Covering index for queries that only use index columns
CREATE INDEX idx_orders_covering ON orders(user_id, status, created_at)
  INCLUDE (order_date, total_amount);

-- ❌ Bad - Indexing low-cardinality columns (e.g., boolean)
CREATE INDEX idx_users_active ON users(is_active); -- Won't help much
```

### Join Optimization

```sql
-- ✅ Good - Ensure join columns are indexed
-- Both users.id and orders.user_id should be indexed
EXPLAIN SELECT *
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.status = 'completed';

-- ❌ Bad - Joining on unindexed columns
-- Missing index on orders.user_id causes sequential scan

-- ✅ Good - Filter early to reduce join size
EXPLAIN SELECT *
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.created_at > '2024-01-01'  -- Filter first
  AND u.is_active = true;
```

### Query Rewriting

```sql
-- ❌ Bad - Correlated subquery
SELECT *
FROM users u
WHERE EXISTS (
  SELECT 1
  FROM orders o
  WHERE o.user_id = u.id
    AND o.created_at > '2024-01-01'
);

-- ✅ Good - JOIN (can use indexes)
SELECT DISTINCT u.*
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at > '2024-01-01';

-- ❌ Bad - OR conditions that can't use indexes efficiently
SELECT * FROM users
WHERE email LIKE '%test%' OR username LIKE '%test%';

-- ✅ Good - Use UNION or full-text search
SELECT * FROM users WHERE email LIKE '%test%'
UNION ALL
SELECT * FROM users WHERE username LIKE '%test%';

-- Or use full-text search
CREATE INDEX idx_users_email_fts ON users USING gin(to_tsvector('english', email));
```

## Indexing

### Index Types

```sql
-- B-tree (default, most common)
CREATE INDEX idx_posts_created ON posts(created_at);

-- Hash (equality comparisons only)
CREATE INDEX idx_users_email_hash ON users USING hash(email);

-- GIN (array, JSONB, full-text search)
CREATE INDEX idx_posts_tags ON posts USING gin(tags);
CREATE INDEX idx_posts_metadata ON posts USING gin(metadata);

-- BRIN (time-series, large tables)
CREATE INDEX idx_events_timestamp ON events USING brin(created_at);
```

### Partial Indexes

```sql
-- Index for queries that always filter on date range
CREATE INDEX idx_posts_date_range ON posts(created_at)
  WHERE created_at > '2024-01-01';

-- Saves space by only indexing recent data
-- Faster inserts as less to index
```

### Expression Indexes

```sql
-- ✅ Good - For consistent case-insensitive queries
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

SELECT * FROM users WHERE LOWER(email) = 'test@example.com';

-- ✅ Good - For computed columns
CREATE INDEX idx_posts_year_month ON posts(EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at));
```

## Caching

### Query Result Caching

```sql
-- ✅ Good - Prepare statement (within transaction)
PREPARE get_user_by_email(int) AS
SELECT * FROM users WHERE email = $1;

EXECUTE get_user_by_email('test@example.com');

-- Or use connection-side prepared statements
-- PgBouncer with prepared statement caching enabled
```

### Materialized Views

```sql
-- Create materialized view for expensive aggregations
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  u.id,
  u.email,
  COUNT(DISTINCT o.id) as order_count,
  SUM(o.amount) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.email
WITH DATA;

-- Create indexes on materialized view
CREATE INDEX idx_user_stats_order_count ON user_stats(order_count DESC);

-- Refresh periodically (not on every query)
REFRESH MATERIALIZED VIEW user_stats;
```

### Redis Application-Level Caching

```python
# Python example with psycopg2 and redis
import redis
import json
import hashlib

redis_client = redis.StrictRedis(host='localhost', port=6379)
CACHE_TTL = 300  # 5 minutes

def cache_key(*parts):
    return f"query:{':'.join(parts)}"

def get_user_cached(user_id):
    key = cache_key('user', user_id)
    cached = redis_client.get(key)

    if cached:
        return json.loads(cached)

    # Query PostgreSQL
    user = query_db("SELECT * FROM users WHERE id = %s", (user_id,))

    # Cache the result
    redis_client.setex(key, CACHE_TTL, json.dumps(user))

    return user
```

## Connection Pooling

### PgBouncer Configuration

```ini
# pgbouncer.ini
[databases]
mydb =
  host = localhost
  port = 5432
  dbname = appdb
  user = appuser
  password = secretpassword

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
server_lifetime = 3600
server_idle_timeout = 600
query_timeout = 300
reserve_pool_size = 0
reserve_timeout = 3
```

### Application Pooling

```python
# Python connection pool with psycopg2
from psycopg2 import pool

# Create connection pool
conn_pool = pool.SimpleConnectionPool(
    minconn=5,
    maxconn=20,
    host='localhost',
    database='appdb',
    user='appuser',
    password='secretpassword',
)

def query_db(query, params=None):
    conn = conn_pool.getconn()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            result = cursor.fetchall()
        conn.commit()
        return result
    finally:
        conn_pool.putconn(conn)
```

## Partitioning

### Range Partitioning

```sql
-- Create partitioned table for orders by date
CREATE TABLE orders (
  id BIGSERIAL,
  user_id INTEGER NOT NULL,
  status VARCHAR(50),
  amount DECIMAL(10,2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE orders_2024_01 PARTITION OF orders
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE orders_2024_02 PARTITION OF orders
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Add index to partitioned table
CREATE INDEX idx_orders_date_status ON orders(created_at, status);
```

### List Partitioning

```sql
-- Create partitioned table for logs by year/month
CREATE TABLE logs (
  id BIGSERIAL,
  message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY LIST (EXTRACT(YEAR FROM created_at)::VARCHAR(4));

-- Create partitions for each year
CREATE TABLE logs_2024 PARTITION OF logs FOR VALUES IN ('2024');
CREATE TABLE logs_2025 PARTITION OF logs FOR VALUES IN ('2025');
```

## Replication

### Streaming Replication

```sql
-- PostgreSQL 14+ using native replication
-- Primary server (postgresql.conf)

wal_level = replica
max_wal_senders = 5
max_replication_slots = 5

-- Replica server (recovery.conf)
standby_mode = on
primary_conninfo = 'host=primary-db port=5432 user=replicator password=secret'
primary_slot_name = 'replica_slot_1'
hot_standby_feedback = 100
```

### Logical Replication

```sql
-- Create publication
CREATE PUBLICATION my_pub FOR TABLE users, orders;

-- Add tables to publication
ALTER PUBLICATION my_pub ADD TABLE products;

-- Subscribe (on replica)
CREATE SUBSCRIPTION my_sub
CONNECTION 'host=primary-db port=5432 user=replicator password=secret'
PUBLICATION my_pub
WITH (create_slot = true);
```

## Database Tuning

### postgresql.conf Optimization

```ini
# Memory settings (adjust based on available RAM)
shared_buffers = 256MB           # 25% of RAM
effective_cache_size = 2GB      # 50-75% of RAM
work_mem = 64MB                # Work memory per operation
maintenance_work_mem = 512MB

# Connection settings
max_connections = 200            # Adjust for connection pooler
superuser_reserved_connections = 3

# Query planner settings
random_page_cost = 1.1           # For non-sequential scans
effective_io_concurrency = 200     # SSD storage
work_mem = 32MB
```

### VACUUM & ANALYZE

```sql
-- Manual VACUUM
VACUUM FULL ANALYZE users;
VACUUM ANALYZE orders;

-- Automatic VACUUM (autovacuum)
-- postgresql.conf
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 60s
autovacuum_vacuum_threshold = 200
autovacuum_analyze_threshold = 100

-- Schedule regular ANALYZE
-- Add to crontab:
-- 0 3 * * * psql -U postgres -d appdb -c "ANALYZE;"
```

## Performance Monitoring

### pg_stat_statements

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_statement = 'all';

-- Query pg_stat_statements
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  stddev_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;
```

### pg_stat_activity

```sql
-- Check for long-running queries
SELECT
  pid,
  usename,
  application_name,
  state,
  query_start,
  state_change,
  query,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE state != 'idle'
  AND query_start < now() - INTERVAL '5 minutes'
ORDER BY query_start;
```

### pg_stat_replication

```sql
-- Check replication lag on standby
SELECT
  client_hostname,
  sync_state,
  replay_lag_bytes,
  replay_lag_time_millis
FROM pg_stat_replication;
```

## Best Practices

### DO

- Use EXPLAIN ANALYZE on slow queries
- Create indexes on frequently filtered columns
- Use connection pooling (PgBouncer)
- Implement caching strategies
- VACUUM and ANALYZE regularly
- Partition large time-series tables
- Monitor query performance
- Use appropriate WAL level
- Set sensible work_mem settings
- Monitor replication lag
- Archive old data regularly

### DON'T

- Create indexes on low-cardinality columns
- Use SELECT \* for all queries
- Ignore slow query logs
- Skip connection pooling
- Use TEXT for large data (use VARCHAR or JSONB)
- Ignore table bloat
- Skip VACUUM in production
- Use sequential scans when indexes available
- Over-allicate WAL
- Ignore replication monitoring
- Cache sensitive data

## Anti-patterns

1. **Sequential Scans** - Full table scans when indexes exist
2. **N+1 Queries** - Fetching related data one-by-one
3. **Missing Indexes** - No indexes on join/filter columns
4. **OR Conditions** - Using OR when UNION is better
5. **Excessive Indexes** - Indexing every column, slowing writes
6. **No Connection Pooling** - Creating new connection per query
7. **Missing Caching** - Repeatedly querying same data
8. **Large Transactions** - Long-running transactions locking tables
9. **Ignoring Table Bloat** - Not VACUUMing regularly
10. **Poor Statistics** - Not running ANALYZE after bulk loads

## Troubleshooting

### Slow Queries

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check execution plan
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) <slow-query>;

-- Common issues:
-- - Seq Scan instead of Index Scan (missing index)
-- - Hash Join instead of Nested Loop (wrong plan)
-- - High cost operations
```

### Lock Issues

```sql
-- Find blocking queries
SELECT
  pid,
  usename,
  query,
  state,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE wait_event IS NOT NULL;

-- Kill blocking query (carefully!)
SELECT pg_terminate_backend(<blocking-pid>);
```

### Connection Issues

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check max_connections setting
SHOW max_connections;

-- Connection pool issues
-- - Pool exhausted (increase pool_size)
-- - Too many connections (increase max_connections)
```

## Tools

### Monitoring Tools

- **pgAdmin** - GUI management
- **pgBadger** - Query performance
- **pg_stat_statements** - Query statistics
- **pgbench** - Benchmarking
- **PoWA** - Performance monitoring dashboard

### Replication Tools

- **Patroni** - HA monitoring
- **repmgr** - Replication management
- **pgBackRest** - Physical backup
- **pg_probackup** - Logical backup

### Ecosystem

- **PgBouncer** - Connection pooler
- **PostGIS** - Geographic data
- **TimescaleDB** - Cloud PostgreSQL
- **Citus** - Distributed PostgreSQL
- **Hydra** - Multi-master replication

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [EXPLAIN Visualizer](https://explain.depesz.com/)
- [PGConfig.org](https://pgconfig.org/)
