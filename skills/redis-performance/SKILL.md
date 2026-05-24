---
name: redis-performance
description: Expert in Redis caching, data structures, pub/sub messaging, persistence, clustering, performance tuning, and production best practices
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: database
  tags: [redis, cache, pub-sub, database, performance, nosql]
---

# Redis Performance Expert Mode

## Overview

You are an expert Redis caching and data structure specialist with deep knowledge of data types, persistence, pub/sub messaging, caching strategies, clustering, performance optimization, and production deployment.

## Core Principles

1. **Data Structure Selection** - Choose right data type for your use case
2. **Persistence Strategy** - RDB vs AOF, snapshotting, append-only file
3. **Memory Management** - Set maxmemory and eviction policies
4. **Cluster Architecture** - Master-slave, sentinel, cluster
5. **Caching Strategy** - Client-side caching, cache-aside, write-through
6. **Performance Monitoring** - Redis INFO, slowlog, latency tracking
7. **Security** - AUTH, TLS, firewall, rename commands

## Data Types

### Strings

```bash
# ✅ Good - Use String for text/JSON
SET user:name "Alice"

# ✅ Good - Use String for IDs
SET user:1000 "user:alice"
SET user:alice:email "alice@example.com"

# ❌ Bad - Storing serialized objects
SET user:1000 '{"name":"Alice","email":"alice@example.com"}'
```

### Hashes

```bash
# ✅ Good - Hash for fast lookups
HMSET user:1000 name "Alice"
HMSET user:1000 email "alice@example.com"

# ❌ Bad - Hash for large values (no range queries)
HSET user:1000 profile '{"bio":"Long bio here...","id":"user:1000"}'

# ✅ Good - Hash with TTL for sessions
SETEX session:alice 3600
```

### Sorted Sets

```bash
# ✅ Good - Sorted set for leaderboards
ZADD leaderboard 100 alice 1000
ZADD leaderboard 1000 bob 2000

# ✅ Good - Sorted set with scores
ZADD leaderboard alice 50000

# Get ranking
ZREVRANGE leaderboard 0 10 # Top 10
ZREVRANGE leaderboard 0 -1 -1 # Last user
```

### Lists

```bash
# ✅ Good - List for recent activity
RPUSH user:1000:timeline "Logged in at 2024-01-15 14:30:00"

# ✅ Good - List for queues
LPUSH queue:email:tasks "Task 1"
LPUSH queue:email:tasks "Task 2"

# ❌ Bad - Blocking operations on long lists
LRANGE queue:email:tasks 0 10000
```

### Sets

```bash
# ✅ Good - Set for tags/likes
SADD user:1000:tags python
SADD user:1000:likes rust

# ✅ Good - Set with score for ranking
ZADD leaderboard alice 50000

# ❌ Bad - Large set without score
SADD user:1000:following user1 user2 user3 ...
```

### Bitmaps

```bitmap operations for binary data>
# Set bit 0
SETBIT user:1000:monday 0 0

# Check if bit is set
GETBIT user:1000:monday 0

# ✅ Good - Counting members
PFCOUNT user:team:developers
PFCOUNT user:team:designers

# ✅ Good - Bitwise operations for permissions
# Set user:1000:permissions:read write:execute
BITOP OR user:1000:permissions write execute

# ❌ Bad - Individual bit operations
SETBIT user:1000:permissions:read
SETBIT user:1000:permissions:write
```

### HyperLogLogs

```bash
# ✅ Good - Event logs with entry ID
XADD events:* 2024-01-15 user:1000:00 "Logged in"

# ✅ Good - Stream logs
XADD events:alerts user:1000:00 "System alert"

# ✅ Good - Trim logs to save memory
XTRIM events:recent 100

# ✅ Good - Length-limited logs
XTRIM events:errors 100
```

### Geospatial

```bash
# ✅ Good - Geo-aware data
GEOADD users:alice location 122.419 12 -77.58

# ✅ Good - Radius searches
GEORADIUS users:alice 100 100 100 5 10

# ✅ Good - Location-based queries
GEOSEARCH users:location 100 100 10

# ❌ Bad - Without indexing on coordinates
GEOSEARCH users:* 100 100 10 10
```

### Streams

```bash
# ✅ Good - Consumer group
XGROUPCREATE user:1000:notifications:online CG "notifications"

# ✅ Good - Stream processing
XADD user:1000:timeline "Logged in at..."
XLEN user:1000:notifications:online

# ✅ Good - Read messages from stream
XREADCOUNT user:1000:notifications:online

# ❌ Bad - Blocking read with timeout
XREAD user:1000:notifications:online BLOCK 0
```

## Caching Strategies

### Cache-Aside Pattern

```python
import redis
import json
import hashlib

redis_client = redis.StrictRedis(
    host='localhost',
    port=6379,
    decode_responses=True
)

def cache_key(*parts):
    return ':'.join(parts)

def get_user(user_id):
    key = cache_key('user', user_id)
    cached = redis_client.get(key)

    if cached:
        return json.loads(cached)

    # Query database
    user = query_db("SELECT * FROM users WHERE id = %s", (user_id,))

    # Cache for 5 minutes
    redis_client.setex(key, 300, json.dumps(user))

    return user

def invalidate_user(user_id):
    key = cache_key('user', user_id)
    redis_client.delete(key)
```

### Write-Through Cache

```python
import redis

redis_client = redis.StrictRedis(host='localhost', port=6379)

def set_user(user_id: int, data: dict) -> dict:
    # Write to Redis
    redis_client.setex(f'user:{user_id}', 3600, json.dumps(data))

    # Write to database (primary source of truth)
    update_user_in_db(user_id, data)

    return data

def get_user(user_id: int):
    # Try Redis cache first
    cached = redis_client.get(f'user:{user_id}')
    if cached:
        return json.loads(cached)

    # Fallback to database
    return get_user_from_db(user_id)

def update_user_in_db(user_id: int, data: dict) -> None:
    # Write to database
    # Update cache
    redis_client.setex(f'user:{user_id}', 3600, json.dumps(data))
```

### Read-Through Cache

```python
def get_posts(user_id: int):
    key = cache_key('posts', user_id)

    # Try cache first
    cached = redis_client.get(key)
    if cached:
        return json.loads(cached)

    # Miss - fetch from DB and cache
    posts = query_db("SELECT * FROM posts WHERE user_id = %s", (user_id,))

    # Cache for 10 minutes
    redis_client.setex(key, 600, json.dumps(posts))

    return posts
```

## Persistence

### RDB (Recommended)

```bash
# redis.conf
appendonly yes
save 900 1     # Save every 15 minutes
appendfsync everysec 1
```

### AOF (Append-Only File)

```bash
# redis.conf
appendonly yes
appendfsync everysec 1
auto-aof-rewrite-percentage 100
```

### Snapshots

```bash
# Create snapshot
SAVE

# List snapshots
LASTSAVE

# Restore from snapshot (dangerous!)
# Restores from snapshot file, overwriting current data
```

## Memory Management

### Configuration

```bash
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru      # Remove least recently used
maxmemory-samples 5                # Check 5 random keys for eviction

# ✅ Good - Set maxmemory and policy
maxmemory 512mb
maxmemory-policy volatile-lru    # LRU for temporary data

# ❌ Bad - No maxmemory (can run out of memory)
# ❌ Bad - allkeys-lru (can remove important data)
```

### Eviction Policies

| Policy              | Description                                          | Use Case                 |
| ------------------- | ---------------------------------------------------- | ------------------------ |
| **volatile-lru**    | Remove least recently used keys                      | Temporary data           |
| **allkeys-lru**     | Remove least recently used keys from any data type   | Default, mixed workloads |
| **allkeys-random**  | Remove random keys from any data type                | Unknown data types       |
| **volatile-lfu**    | Remove least frequently used keys from volatile data | Temporary data           |
| **volatile-ttl**    | Remove keys with shortest TTL first                  | Temporary data with TTL  |
| **volatile-random** | Remove random keys from volatile data                | Temporary data           |

## Clustering

### Master-Slave

```bash
# redis.conf
replica-serve-stale-data yes
replica-priority 100

# ✅ Good - Configure for read-heavy workloads
min-slaves-to-write 1
slave-read-only yes
```

### Sentinel (High Availability)

```bash
# sentinel.conf
port 26379
sentinel monitor mymaster
down-after-milliseconds 60000
parallel-syncs 1
failover-timeout 30000

sentinel down-after-milliseconds 60000
sentinel parallel-syncs 1
sentinel failover-timeout 30000
sentinel notification-script /path/to/notify.sh

# ✅ Good - Monitor with reasonable timeouts
down-after-milliseconds 30000
failover-timeout 30000

# ❌ Bad - Too short timeouts (won't detect failures)
down-after-milliseconds 1000
```

### Cluster (Redis Cluster)

```bash
# redis-cluster.conf
cluster-enabled yes
cluster-config-file nodes-6379.conf

# ✅ Good - Enable clustering for horizontal scaling
cluster-node-timeout 5000
cluster-node-timeout 5000
```

## Performance

### Connection Pooling

```python
import redis
from redis.connection import ConnectionPool

pool = ConnectionPool(
    host='localhost',
    port=6379,
    max_connections=50,        # Adjust based on workload
    socket_timeout=5,         # 5 seconds
    socket_connect_timeout=5,   # 5 seconds
    socket_keepalive=True,
    retry_on_timeout=True,      # Retry on timeout
    max_connections=20,         # Reserve 20 for other apps
)

# Use pool in application
def get_redis_connection():
    return pool.get_connection()
```

### Pipeline

```python
def get_posts_batch(user_ids: list[int]):
    pipe = redis_client.pipeline()

    for user_id in user_ids:
        pipe.get(f'user:{user_id}')

    results = pipe.execute()
    return results
```

### Lua Scripting

```python
# ✅ Good - Execute complex operations atomically
def atomic_increment_counter(counter_key: str):
    lua_script = """
        local current = redis.call('get', KEYS[1])
        redis.call('incr', KEYS[1])
        return current
    """

    result = redis_client.eval(lua_script, 1, [counter_key])
    return result

# ❌ Bad - Multiple round trips (no Lua)
def increment_counter_slow(counter_key: str):
    return redis_client.incr(counter_key)
```

## Pub/Sub

### Publish

```python
def publish_notification(user_id: int, message: str):
    redis_client.publish(
        f'user:{user_id}:notifications',
        json.dumps({
            'type': 'alert',
            'message': message,
            'timestamp': datetime.now().isoformat(),
        })
    )
```

### Subscribe

```python
import redis
from typing import AsyncGenerator

async def subscribe_to_user_notifications(user_id: int) -> AsyncGenerator[dict]:
    pubsub = redis.pubsub()
    await pubsub.subscribe(f'user:{user_id}:notifications')

    async for message in pubsub.listen():
        notification = json.loads(message['data'])
        yield notification
```

### Message Queues (Streams)

```python
def add_task_to_queue(queue_name: str, task_data: dict) -> str:
    message_id = redis_client.xadd(
        f'{queue_name}:*',
        '*',
        task_data,
        id=f'{queue_name}:{uuid.uuid4()}',
    )

    return message_id

def process_queue(queue_name: str, consumer_group: str):
    stream = redis.xreadgroup(
        queue_name,
        consumer_group,
        stream_name=f'{queue_name}:group-{consumer_group}',
        count=1,
        block=5000,  # 1 hour timeout
        noack=True,
    )

    return stream
```

## Security

### Authentication

```bash
# ✅ Good - Set strong password in redis.conf
requirepass yourstrongpasswordhere

# ✅ Good - Disable dangerous commands
rename-command FLUSHDB
rename-command FLUSHALL
rename-command CONFIG

# ✅ Good - Run as non-root
user redis

# ❌ Bad - Running as root
# Run as root

# ✅ Good - Bind to localhost only
bind 127.0.0.1

# ❌ Bad - Bind to 0.0.0.0 (accessible from anywhere)
```

### Network Security

```bash
# ✅ Good - Enable TLS
tls-cert-file /path/to/redis.crt
tls-key-file /path/to/redis.key
port 6379
tls-port 6380

# ✅ Good - Firewall rules
protected-mode yes

# ❌ Bad - No firewall or running on public IP
```

### ACL

```bash
# ✅ Good - ACL for specific users
user alice on +@all +@read ~* +@write ~* on +@admin

# ❌ Bad - Allowing anonymous access everywhere
# * on +@all on allkeys
```

## Performance Monitoring

### Redis INFO

```python
import redis
import time

redis_client = redis.StrictRedis(host='localhost', port=6379)

def monitor_performance():
    while True:
        info = redis_client.info()

        # Get memory usage
        used_memory = int(info['used_memory_human'].replace('M', '').replace('G', ''))
        max_memory = int(info['maxmemory_human'].replace('M', '').replace('G', ''))
        memory_usage_percent = (used_memory / max_memory) * 100

        print(f'Memory: {used_memory}/{max_memory} ({memory_usage_percent:.1f}%)')

        # Get slowlog
        slowlog_len = info['slowlog_length']
        if slowlog_len > 0:
            slowlog = redis_client.slowlog_get(10)
            print(f'Slow queries: {slowlog_len}')

        time.sleep(60)
```

### Latency Tracking

```python
import time

redis_client = redis.StrictRedis(host='redis-server', port=6379)

def measure_command_latency(command: str, *args):
    start = time.time()
    result = redis_client.execute_command(command, *args)
    end = time.time()

    latency_ms = (end - start) * 1000
    print(f'{command} latency: {latency_ms:.2f}ms')

    return result

# Measure common commands
measure_command_latency('GET', 'users:1000')
measure_command_latency('SET', 'test:key', 'value')
measure_command_latency('HGETALL', 'user:1000:timeline')
```

## Best Practices

### DO

- Choose appropriate data type for your use case
- Use connection pooling for high concurrency
- Implement caching strategies (cache-aside, write-through)
- Use Redis for pub/sub messaging and message queues
- Monitor memory usage and slow queries
- Configure persistence based on durability requirements
- Use clustering for high availability and scalability
- Set up proper security (AUTH, ACL, network)
- Use pipelines for batch operations
- Use Lua scripts for atomic operations
- Regularly backup data (SAVE, BGSAVE)
- Monitor performance metrics

### DON'T

- Use Redis as database (wrong data structure)
- Disable persistence (lose data on restart)
- Ignore memory usage monitoring
- Run dangerous commands (FLUSHDB, KEYS, etc.)
- Bind to all interfaces
- Use weak passwords
- Run as root user
- Allow anonymous access everywhere
- Ignore slowlog (missed performance issues)
- Disable eviction (let Redis use all memory)
- Use SELECT \* in production (too expensive)
- Use blocking operations in pub/sub
- Skip connection pooling (single connection)
- Store large values as strings (use hash/data types)

## Anti-patterns

1. **Wrong Data Type** - Using String for IDs when Hash would be better
2. **No Caching** - Querying database for every request
3. **No Persistence** - Losing data on restart
4. **No Connection Pool** - Creating new connection per query
5. **No Monitoring** - Ignoring performance issues
6. **Large Values** - Storing objects as JSON strings (use Hash)
7. **Inefficient Queries** - Using KEYS/GET instead of hash operations
8. **No Clustering** - Single instance for high-traffic
9. **No Security** - Running without password or AUTH
10. **Blocking Operations** - Blocking on reads/writes in pub/sub

## Troubleshooting

### Memory Issues

```bash
# Check memory usage
redis-cli INFO memory

# Check maxmemory setting
redis-cli CONFIG GET maxmemory

# Check eviction policy
redis-cli CONFIG GET maxmemory-policy
```

### Slow Queries

```bash
# Enable slowlog
CONFIG SET slowlog-log-slower-than 10000  # Log queries >10ms
CONFIG SET slowlog-max-len 128        # Keep last 128 slow queries

# View slow queries
redis-cli SLOWLOG GET 10
```

### Cluster Issues

```bash
# Check cluster state
redis-cli CLUSTER INFO

# Check node status
redis-cli CLUSTER NODES

# Check failover state
redis-cli CLUSTER FAILOVER
```

## Tools

### Command Line Tools

```bash
# redis-cli
redis-cli INFO
redis-cli MONITOR
redis-cli SLOWLOG

# redis-benchmark
redis-benchmark -t set -n 10000 -c 1 -q 1000
```

### GUI Tools

- **RedisInsight** - Performance monitoring
- **Redis Desktop Manager** - GUI management
- **Redis Commander** - GUI for multiple instances

### Python Libraries

```bash
# redis-py
pip install redis-py

# redis (high-level interface)
pip install redis

# aioredis - Async Redis
pip install aioredis
```

### Java Libraries

```bash
# Jedis (synchronous)
# Lettuce (asynchronous)
# Spring Data Redis (Spring Boot integration)
# Redisson (Redisson)
```

### Node.js Libraries

```bash
# ioredis (async)
# node-redis (async)
# redis-mock (testing)
```

## Resources

- [Redis Documentation](https://redis.io/documentation/)
- [Redis Commands](https://redis.io/commands/)
- [Redis Persistence](https://redis.io/topics/persistence)
- [Redis Clustering](https://redis.io/topics/cluster-tutorial)
- [Redis Security](https://redis.io/topics/security/)
- [Redis Performance](https://redis.io/topics/memory-optimization/)
- [Redis Pub/Sub](https://redis.io/topics/pub-sub/)
