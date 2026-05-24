---
name: universal-performance-optimization
description: Universal performance optimization best practices for all languages, frameworks, and stacks. Comprehensive guidance for frontend, backend, database, and infrastructure optimization with actionable checklists and real-world examples. Use when you need help with universal performance optimization.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: analysis
---

# Universal Performance Optimization Guide

## Introduction

Performance is the difference between a product users love and one they abandon. This guide provides comprehensive, language-agnostic performance optimization practices covering all layers of modern software systems. Whether you're optimizing a web app, API, database, or distributed system, these principles and techniques will help you build fast, efficient, and scalable software.

**Key Philosophy:** Measure first, optimize second. Never guess—always profile, benchmark, and validate improvements with data.

---

## Table of Contents

1. [General Principles](#general-principles)
2. [Frontend Performance](#frontend-performance)
3. [Backend Performance](#backend-performance)
4. [Database Performance](#database-performance)
5. [Network & API Performance](#network--api-performance)
6. [Memory & Resource Management](#memory--resource-management)
7. [Caching Strategies](#caching-strategies)
8. [Concurrency & Parallelism](#concurrency--parallelism)
9. [Language-Specific Optimization](#language-specific-optimization)
10. [Infrastructure & Cloud Performance](#infrastructure--cloud-performance)
11. [Mobile Performance](#mobile-performance)
12. [Security & Performance Balance](#security--performance-balance)
13. [Performance Testing & Monitoring](#performance-testing--monitoring)
14. [Code Review Checklist](#code-review-checklist)
15. [Common Anti-Patterns](#common-anti-patterns)
16. [Troubleshooting Guide](#troubleshooting-guide)

---

## General Principles

### Core Performance Philosophy

- **Measure Before Optimizing:** Use profilers, benchmarks, and monitoring tools to identify real bottlenecks. Intuition lies.
- **Optimize the Common Case:** Focus on hot paths—code that executes frequently. Don't waste time on edge cases unless critical.
- **Avoid Premature Optimization:** Write clean, maintainable code first. Optimize only when measurements justify it.
- **Minimize Resource Usage:** Every byte of memory, CPU cycle, network packet, and disk I/O matters.
- **Prefer Simplicity:** Simple algorithms and data structures are easier to understand, maintain, and often faster.
- **Understand Your Platform:** Know the performance characteristics of your language runtime, framework, and infrastructure.
- **Set Performance Budgets:** Define acceptable limits (load time, latency, memory) and enforce them with automated tests.
- **Document Performance Decisions:** Comment on non-obvious optimizations and performance-critical code paths.
- **Automate Performance Testing:** Integrate benchmarks and performance tests into CI/CD pipelines.
- **Think in Orders of Magnitude:** O(1) vs O(n) vs O(n²) matters far more than micro-optimizations.

### Performance Budget Guidelines

| Metric                         | Target  | Maximum  |
| ------------------------------ | ------- | -------- |
| Time to First Byte (TTFB)      | < 200ms | < 600ms  |
| First Contentful Paint (FCP)   | < 1.8s  | < 3.0s   |
| Largest Contentful Paint (LCP) | < 2.5s  | < 4.0s   |
| Time to Interactive (TTI)      | < 3.8s  | < 7.3s   |
| Cumulative Layout Shift (CLS)  | < 0.1   | < 0.25   |
| First Input Delay (FID)        | < 100ms | < 300ms  |
| API Response Time (p95)        | < 200ms | < 1000ms |
| Database Query Time (p95)      | < 50ms  | < 200ms  |

---

## Frontend Performance

### Critical Rendering Path Optimization

#### HTML & DOM

- **Minimize DOM Depth:** Keep DOM tree shallow (< 1500 nodes, < 60 children per parent, < 32 levels deep).
- **Batch DOM Manipulations:** Use DocumentFragment or virtual DOM to batch updates.
- **Avoid Layout Thrashing:** Read layout properties together, then write them together.
- **Use Modern HTML:** Semantic HTML5 elements are faster and more accessible.

```javascript
// ❌ BAD: Layout thrashing
for (let i = 0; i < elements.length; i++) {
  elements[i].style.width = box.offsetWidth + "px"; // Read/write interleaved
}

// ✅ GOOD: Batch reads and writes
const width = box.offsetWidth;
for (let i = 0; i < elements.length; i++) {
  elements[i].style.width = width + "px";
}
```

#### CSS Performance

- **Minimize CSS Specificity:** Keep selectors simple and flat.
- **Avoid Expensive Properties:** `box-shadow`, `border-radius`, `opacity`, `transform` can be costly.
- **Use CSS Containment:** `contain: layout|paint|size` for isolated components.
- **Prefer CSS Animations:** Use `transform` and `opacity` for GPU-accelerated animations.
- **Remove Unused CSS:** Use PurgeCSS or similar tools to eliminate dead styles.
- **Critical CSS:** Inline above-the-fold CSS, defer the rest.

```css
/* ❌ BAD: Complex selector */
div.container > ul li:nth-child(2n) a.link:hover {
}

/* ✅ GOOD: Simple, specific selector */
.link-hover {
}
```

#### JavaScript Performance

- **Minimize Main Thread Blocking:** Keep tasks under 50ms to maintain 60fps.
- **Use Web Workers:** Offload heavy computation to background threads.
- **Debounce/Throttle Events:** Limit high-frequency event handlers (scroll, resize, input).
- **Lazy Load Everything:** Code, images, components—load on demand.
- **Tree Shaking:** Enable dead code elimination in bundlers.
- **Code Splitting:** Split bundles by route or feature.

```javascript
// ❌ BAD: Triggers on every keystroke
input.addEventListener("input", (e) => {
  expensiveAPICall(e.target.value);
});

// ✅ GOOD: Debounced API call
const debouncedCall = debounce((value) => {
  expensiveAPICall(value);
}, 300);

input.addEventListener("input", (e) => {
  debouncedCall(e.target.value);
});
```

### Asset Optimization

#### Images

- **Modern Formats:** WebP (20-30% smaller), AVIF (50% smaller than JPEG).
- **Responsive Images:** Use `srcset` and `sizes` attributes.
- **Lazy Loading:** `loading="lazy"` for below-the-fold images.
- **Compression:** Use tools like Squoosh, ImageOptim, or Sharp.
- **SVG for Icons:** Scalable, small file size, and stylable with CSS.
- **Image Dimensions:** Always specify width/height to prevent layout shift.

```html
<!-- ✅ GOOD: Responsive, lazy-loaded, modern format -->
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img
    src="image.jpg"
    srcset="image-320w.jpg 320w, image-640w.jpg 640w, image-1280w.jpg 1280w"
    sizes="(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px"
    loading="lazy"
    width="1200"
    height="800"
    alt="Description"
  />
</picture>
```

#### Fonts

- **System Fonts First:** Use system font stack for instant rendering.
- **Subset Custom Fonts:** Include only needed characters and weights.
- **Font Display Strategy:** Use `font-display: swap` to avoid FOIT (Flash of Invisible Text).
- **Preload Critical Fonts:** `<link rel="preload" as="font">`
- **Variable Fonts:** One file for multiple weights/styles.

```css
/* ✅ GOOD: System font stack */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

/* ✅ GOOD: Custom font with swap */
@font-face {
  font-family: "CustomFont";
  src: url("custom-font.woff2") format("woff2");
  font-display: swap;
  unicode-range: U+0020-007F; /* Basic Latin only */
}
```

#### Bundle Optimization

- **Minimize Bundle Size:** Aim for < 200KB initial JS (gzipped).
- **Tree Shaking:** Remove unused exports and imports.
- **Minification:** Use Terser or ESBuild for aggressive minification.
- **Compression:** Enable gzip (5-10x) or Brotli (15-20% better) on server.
- **Dynamic Imports:** Load routes and features on demand.

```javascript
// ✅ GOOD: Dynamic import for route
const AdminPanel = () => import("./AdminPanel.vue");

// ✅ GOOD: Dynamic import with loading state
const heavyLibrary = async () => {
  const module = await import("heavy-library");
  return module.default;
};
```

### Framework-Specific Optimizations

#### React

- **Memoization:** Use `React.memo`, `useMemo`, `useCallback` to prevent re-renders.
- **Keys in Lists:** Stable, unique keys for efficient reconciliation.
- **Code Splitting:** `React.lazy()` and `<Suspense>` for lazy loading.
- **Avoid Anonymous Functions:** Define functions outside render to prevent new references.
- **Virtual Scrolling:** Use `react-window` or `react-virtualized` for long lists.
- **Concurrent Features:** Use `useTransition` and `useDeferredValue` for non-urgent updates.

```jsx
// ❌ BAD: Creates new function on every render
<Button onClick={() => handleClick(id)} />;

// ✅ GOOD: Memoized callback
const memoizedClick = useCallback(() => handleClick(id), [id]);
<Button onClick={memoizedClick} />;

// ✅ GOOD: Memoized expensive computation
const expensiveResult = useMemo(() => {
  return computeExpensiveValue(input);
}, [input]);
```

#### Vue

- **Computed Properties:** Use for cached derived state.
- **v-show vs v-if:** Use `v-show` for frequent toggles (keeps DOM, toggles CSS).
- **Lazy Components:** Use `defineAsyncComponent` for code splitting.
- **Functional Components:** For presentational components without state.
- **Key Attribute:** Use with `v-for` for efficient list updates.

```vue
<!-- ✅ GOOD: Computed property for caching -->
<template>
  <div>{{ expensiveComputation }}</div>
</template>

<script setup>
import { computed } from "vue";

const expensiveComputation = computed(() => {
  return heavyCalculation(props.data);
});
</script>
```

#### Angular

- **OnPush Change Detection:** Use for components that don't need frequent updates.
- **TrackBy Function:** Use with `*ngFor` for efficient list rendering.
- **Lazy Loading Modules:** Load feature modules on demand.
- **Pure Pipes:** Use for transformations that don't have side effects.
- **Avoid Template Expressions:** Move logic to component class.

```typescript
// ✅ GOOD: OnPush change detection
@Component({
  selector: 'app-item',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemComponent { }

// ✅ GOOD: TrackBy function
trackByFn(index: number, item: Item): number {
  return item.id;
}
```

---

## Backend Performance

### Algorithm & Data Structure Optimization

#### Complexity Analysis

- **Know Your Complexity:** O(1) > O(log n) > O(n) > O(n log n) > O(n²) > O(2ⁿ)
- **Profile First:** Use profilers to identify bottlenecks before optimizing.
- **Choose Right Structure:** Array, Hash Map, Tree, Graph—each has trade-offs.

| Operation | Array | Hash Map | Binary Tree | Linked List |
| --------- | ----- | -------- | ----------- | ----------- |
| Access    | O(1)  | O(1) avg | O(log n)    | O(n)        |
| Search    | O(n)  | O(1) avg | O(log n)    | O(n)        |
| Insert    | O(n)  | O(1) avg | O(log n)    | O(1)        |
| Delete    | O(n)  | O(1) avg | O(log n)    | O(1)        |

#### Common Optimizations

```python
# ❌ BAD: O(n²) nested loops
def find_duplicates_slow(arr):
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]:
                duplicates.append(arr[i])
    return duplicates

# ✅ GOOD: O(n) with hash set
def find_duplicates_fast(arr):
    seen = set()
    duplicates = set()
    for item in arr:
        if item in seen:
            duplicates.add(item)
        seen.add(item)
    return list(duplicates)
```

### Asynchronous I/O

- **Non-Blocking Operations:** Use async/await for I/O-bound tasks.
- **Event Loop Awareness:** Don't block the event loop with CPU-intensive work.
- **Connection Pooling:** Reuse connections for databases, APIs, and external services.
- **Backpressure Handling:** Prevent memory exhaustion from fast producers.

```javascript
// ❌ BAD: Sequential API calls
async function fetchDataSlow(ids) {
  const results = [];
  for (const id of ids) {
    const data = await fetch(`/api/data/${id}`);
    results.push(data);
  }
  return results;
}

// ✅ GOOD: Parallel API calls
async function fetchDataFast(ids) {
  const promises = ids.map((id) => fetch(`/api/data/${id}`));
  return Promise.all(promises);
}
```

### Resource Management

- **Close Resources:** Always close files, sockets, database connections.
- **Use Connection Pools:** Reuse expensive resources.
- **Limit Concurrency:** Use semaphores or worker pools to prevent exhaustion.
- **Timeout Operations:** Always set timeouts for network operations.

```python
# ✅ GOOD: Context manager ensures cleanup
with open('file.txt', 'r') as f:
    data = f.read()
# File automatically closed

# ✅ GOOD: Connection pooling
from sqlalchemy import create_engine, pool

engine = create_engine(
    'postgresql://user:pass@host/db',
    poolclass=pool.QueuePool,
    pool_size=10,
    max_overflow=20
)
```

---

## Database Performance

### Query Optimization

#### Indexing Strategy

- **Index Columns:** Used in WHERE, JOIN, ORDER BY, GROUP BY clauses.
- **Composite Indexes:** Order matters—most selective columns first.
- **Covering Indexes:** Include all columns needed by query to avoid table lookup.
- **Avoid Over-Indexing:** Each index slows down writes and consumes space.
- **Monitor Index Usage:** Drop unused indexes.

```sql
-- ❌ BAD: Missing index on frequently queried column
SELECT * FROM users WHERE email = 'user@example.com';

-- ✅ GOOD: Create index on email
CREATE INDEX idx_users_email ON users(email);

-- ✅ GOOD: Composite index for common query pattern
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date DESC);

-- ✅ GOOD: Covering index includes all needed columns
CREATE INDEX idx_users_email_name ON users(email) INCLUDE (first_name, last_name);
```

#### Query Best Practices

- **Avoid SELECT \*:** Fetch only needed columns to reduce I/O.
- **Use LIMIT:** Always paginate large result sets.
- **Parameterized Queries:** Prevent SQL injection and improve plan caching.
- **Analyze Query Plans:** Use EXPLAIN to understand execution.
- **Avoid Subqueries in SELECT:** Move to JOINs or CTEs when possible.

```sql
-- ❌ BAD: SELECT * fetches unnecessary data
SELECT * FROM users WHERE active = true;

-- ✅ GOOD: Select only needed columns
SELECT id, email, name FROM users WHERE active = true;

-- ❌ BAD: N+1 query problem
SELECT * FROM posts;
-- Then for each post:
SELECT * FROM users WHERE id = post.author_id;

-- ✅ GOOD: Single query with JOIN
SELECT posts.*, users.name
FROM posts
JOIN users ON posts.author_id = users.id;
```

### Schema Design

- **Normalization:** Reduce redundancy for data integrity.
- **Denormalization:** Duplicate data for read performance (when justified).
- **Appropriate Data Types:** Use smallest type that fits your data.
- **Partitioning:** Split large tables by range, list, or hash.
- **Archiving:** Move old data to archive tables or cold storage.

```sql
-- ✅ GOOD: Use appropriate data types
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,  -- Not TEXT
    age SMALLINT,                         -- Not INTEGER
    is_active BOOLEAN DEFAULT true,      -- Not CHAR(1)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ GOOD: Partition large table
CREATE TABLE orders (
    id BIGSERIAL,
    order_date DATE NOT NULL,
    amount DECIMAL(10,2)
) PARTITION BY RANGE (order_date);

CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Transaction Optimization

- **Keep Transactions Short:** Minimize lock duration.
- **Use Appropriate Isolation:** SERIALIZABLE > REPEATABLE READ > READ COMMITTED > READ UNCOMMITTED.
- **Batch Operations:** Group multiple inserts/updates into single transaction.
- **Avoid Long-Running Transactions:** They block other queries and increase deadlock risk.

```python
# ❌ BAD: Transaction per insert
for record in records:
    db.execute("INSERT INTO table VALUES (?)", record)
    db.commit()

# ✅ GOOD: Batch insert in single transaction
db.execute_many("INSERT INTO table VALUES (?)", records)
db.commit()
```

### NoSQL Optimization

- **Model for Queries:** Design schema based on access patterns.
- **Avoid Hot Partitions:** Distribute load evenly across shards.
- **Limit Document Size:** Keep documents under 16MB (MongoDB limit).
- **Use Projection:** Fetch only needed fields.
- **Batch Operations:** Use bulk APIs for multiple operations.

```javascript
// ❌ BAD: Multiple round trips to database
for (const id of ids) {
  await db.collection("users").findOne({ _id: id });
}

// ✅ GOOD: Single query with $in operator
await db
  .collection("users")
  .find({ _id: { $in: ids } })
  .toArray();
```

---

## Network & API Performance

### HTTP Optimization

- **Enable Compression:** gzip or Brotli for text responses (HTML, JSON, CSS, JS).
- **HTTP/2 or HTTP/3:** Enable for multiplexing and reduced latency.
- **Keep-Alive:** Reuse TCP connections to avoid handshake overhead.
- **CDN Usage:** Serve static assets from edge locations close to users.
- **Caching Headers:** Set appropriate `Cache-Control`, `ETag`, `Last-Modified`.

```
✅ GOOD: Response headers for caching
Cache-Control: public, max-age=31536000, immutable
Content-Encoding: br
ETag: "abc123"
Vary: Accept-Encoding
```

### API Design

- **Pagination:** Use cursor-based pagination for large datasets.
- **Rate Limiting:** Protect against abuse with 429 responses.
- **Compression:** Compress request/response payloads.
- **GraphQL Optimization:** Use DataLoader to batch and cache queries.
- **REST Best Practices:** Use ETags for conditional requests, support partial responses.

```javascript
// ✅ GOOD: Cursor-based pagination
GET /api/items?cursor=eyJpZCI6MTIzfQ&limit=20

// Response
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTQzfQ",
    "has_more": true
  }
}
```

### Payload Optimization

- **Minimize JSON Size:** Remove whitespace, use shorter keys.
- **Use Protocol Buffers:** For binary efficiency in microservices.
- **Partial Responses:** Support field filtering (`?fields=id,name`).
- **Batch Endpoints:** Allow multiple operations in single request.

```javascript
// ❌ BAD: Large, verbose JSON
{
  "user_identifier": 12345,
  "user_email_address": "user@example.com",
  "user_first_name": "John",
  "user_last_name": "Doe"
}

// ✅ GOOD: Compact JSON
{
  "id": 12345,
  "email": "user@example.com",
  "name": "John Doe"
}
```

---

## Memory & Resource Management

### Memory Best Practices

- **Avoid Memory Leaks:** Clean up event listeners, timers, and references.
- **Use Object Pooling:** Reuse expensive objects (connections, buffers).
- **Stream Large Data:** Don't load entire files into memory.
- **Monitor Heap Usage:** Set alerts for memory pressure.
- **Garbage Collection Tuning:** Configure GC for your workload.

```javascript
// ❌ BAD: Memory leak from event listener
function setupListener() {
  const button = document.getElementById("btn");
  button.addEventListener("click", handleClick);
  // Listener never removed
}

// ✅ GOOD: Cleanup event listener
function setupListener() {
  const button = document.getElementById("btn");
  const handler = () => handleClick();
  button.addEventListener("click", handler);

  return () => {
    button.removeEventListener("click", handler);
  };
}
```

### Resource Limits

- **Set Timeouts:** For network requests, database queries, and operations.
- **Circuit Breakers:** Fail fast when downstream services are unhealthy.
- **Bulkheads:** Isolate thread pools to prevent cascade failures.
- **Request Queues:** Buffer requests during traffic spikes.

```python
# ✅ GOOD: Timeout for HTTP request
import requests

try:
    response = requests.get('https://api.example.com', timeout=5)
except requests.Timeout:
    # Handle timeout
    pass
```

---

## Caching Strategies

### Cache Levels

1. **Browser Cache:** Static assets, API responses
2. **CDN Cache:** Global edge caching
3. **Application Cache:** In-memory (Redis, Memcached)
4. **Database Cache:** Query result caching
5. **Materialized Views:** Pre-computed database views

### Cache Patterns

#### Cache-Aside (Lazy Loading)

```python
def get_user(user_id):
    # Check cache first
    cached = cache.get(f'user:{user_id}')
    if cached:
        return cached

    # Cache miss - fetch from database
    user = db.query('SELECT * FROM users WHERE id = ?', user_id)

    # Store in cache with TTL
    cache.set(f'user:{user_id}', user, ttl=3600)
    return user
```

#### Write-Through

```python
def update_user(user_id, data):
    # Update database
    db.execute('UPDATE users SET ... WHERE id = ?', user_id)

    # Update cache immediately
    cache.set(f'user:{user_id}', data, ttl=3600)
```

#### Write-Behind

```python
def update_user(user_id, data):
    # Update cache immediately
    cache.set(f'user:{user_id}', data, ttl=3600)

    # Queue database write asynchronously
    queue.enqueue('db_write', user_id, data)
```

### Cache Invalidation

- **TTL (Time To Live):** Expire cache after fixed duration.
- **Event-Based:** Invalidate when data changes.
- **Manual:** Explicit cache clear on updates.
- **Cache Stampede Protection:** Use locks to prevent thundering herd.

```python
# ✅ GOOD: Cache stampede protection
def get_expensive_data(key):
    cached = cache.get(key)
    if cached:
        return cached

    # Acquire lock to prevent multiple fetches
    lock_key = f'lock:{key}'
    if cache.add(lock_key, 1, ttl=10):  # Returns false if key exists
        try:
            data = expensive_computation()
            cache.set(key, data, ttl=300)
            return data
        finally:
            cache.delete(lock_key)
    else:
        # Another process is computing, wait and retry
        time.sleep(0.1)
        return get_expensive_data(key)
```

---

## Concurrency & Parallelism

### Asynchronous Programming

- **Event Loop:** Single-threaded async (Node.js, Python asyncio).
- **Async/Await:** Modern syntax for asynchronous code.
- **Non-Blocking I/O:** Essential for high-throughput servers.

```javascript
// ✅ GOOD: Parallel async operations
async function fetchUserData(userId) {
  const [user, posts, comments] = await Promise.all([fetchUser(userId), fetchPosts(userId), fetchComments(userId)]);

  return { user, posts, comments };
}
```

### Thread Safety

- **Immutability:** Use immutable data structures to avoid race conditions.
- **Locks/Mutexes:** Protect shared state with synchronization primitives.
- **Atomic Operations:** Use atomic counters and compare-and-swap.
- **Thread-Local Storage:** Per-thread data to avoid sharing.

```python
# ✅ GOOD: Thread-safe counter with lock
from threading import Lock

class Counter:
    def __init__(self):
        self.value = 0
        self.lock = Lock()

    def increment(self):
        with self.lock:
            self.value += 1
```

### Worker Pools

- **Thread Pools:** For I/O-bound tasks (Python ThreadPoolExecutor).
- **Process Pools:** For CPU-bound tasks (Python ProcessPoolExecutor).
- **Worker Queues:** Distribute tasks across multiple workers (Celery, Bull).

```python
# ✅ GOOD: Process pool for CPU-bound work
from concurrent.futures import ProcessPoolExecutor

def cpu_intensive_task(data):
    # Heavy computation
    return result

with ProcessPoolExecutor(max_workers=4) as executor:
    results = executor.map(cpu_intensive_task, data_list)
```

---

## Language-Specific Optimization

### Python

- **Use Built-ins:** `list`, `dict`, `set` are highly optimized in C.
- **List Comprehensions:** Faster than for loops.
- **Generators:** Use for lazy evaluation and memory efficiency.
- **NumPy/Pandas:** For numerical computation and data processing.
- **Cython/PyPy:** Compile hot code paths or use alternative interpreter.
- **Profiling:** `cProfile`, `line_profiler`, `py-spy`.

```python
# ❌ BAD: Slow list building
result = []
for i in range(1000):
    result.append(i ** 2)

# ✅ GOOD: Fast list comprehension
result = [i ** 2 for i in range(1000)]

# ✅ BETTER: Generator for memory efficiency
result = (i ** 2 for i in range(1000))
```

### JavaScript/Node.js

- **Avoid Blocking Event Loop:** Offload CPU work to Workers.
- **Use Streams:** For large file processing.
- **Connection Pooling:** For databases and HTTP clients.
- **Clustering:** Use multiple processes to utilize all CPU cores.
- **V8 Optimization:** Keep functions monomorphic, avoid `arguments`, `eval`, `with`.

```javascript
// ✅ GOOD: Stream large file
const fs = require("fs");
const stream = fs.createReadStream("large-file.txt");

stream.on("data", (chunk) => {
  processChunk(chunk);
});
```

### Java

- **Use Efficient Collections:** `ArrayList`, `HashMap`, avoid `Vector`, `Hashtable`.
- **StringBuilder:** For string concatenation in loops.
- **Thread Pools:** `ExecutorService` for concurrency.
- **JVM Tuning:** Heap size (`-Xmx`, `-Xms`), GC algorithm (`-XX:+UseG1GC`).
- **Profiling:** VisualVM, JProfiler, YourKit.

```java
// ❌ BAD: String concatenation in loop
String result = "";
for (int i = 0; i < 1000; i++) {
    result += i;  // Creates new string each time
}

// ✅ GOOD: Use StringBuilder
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);
}
String result = sb.toString();
```

### Go

- **Goroutines:** Lightweight concurrency primitive.
- **Channels:** For safe communication between goroutines.
- **Defer Cleanup:** Use `defer` for resource cleanup.
- **Profiling:** `pprof` for CPU and memory profiling.
- **Avoid Goroutine Leaks:** Always close channels and cancel contexts.

```go
// ✅ GOOD: Worker pool pattern
func processItems(items []Item) {
    jobs := make(chan Item, 100)
    results := make(chan Result, 100)

    // Start workers
    for w := 0; w < 10; w++ {
        go worker(jobs, results)
    }

    // Send jobs
    for _, item := range items {
        jobs <- item
    }
    close(jobs)

    // Collect results
    for i := 0; i < len(items); i++ {
        <-results
    }
}
```

### Rust

- **Zero-Cost Abstractions:** Rust's abstractions have no runtime overhead.
- **Ownership System:** Prevents memory leaks and data races at compile time.
- **Rayon:** Data parallelism library for easy parallel iteration.
- **Async/Await:** Tokio or async-std for async I/O.
- **Profiling:** `cargo flamegraph`, `perf`.

```rust
// ✅ GOOD: Parallel iteration with Rayon
use rayon::prelude::*;

let results: Vec<_> = data.par_iter()
    .map(|item| expensive_computation(item))
    .collect();
```

---

## Infrastructure & Cloud Performance

### Container Optimization

- **Small Base Images:** Use Alpine or distroless images.
- **Multi-Stage Builds:** Separate build and runtime stages.
- **Layer Caching:** Order Dockerfile commands to maximize cache hits.
- **Resource Limits:** Set CPU and memory limits.

```dockerfile
# ✅ GOOD: Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### Kubernetes Optimization

- **Resource Requests/Limits:** Set appropriate CPU/memory values.
- **Horizontal Pod Autoscaling:** Scale based on metrics.
- **Readiness/Liveness Probes:** Ensure traffic only goes to healthy pods.
- **Pod Disruption Budgets:** Maintain availability during updates.

```yaml
# ✅ GOOD: Resource limits and HPA
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: app
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Serverless Optimization

- **Cold Start Reduction:** Minimize dependencies, keep functions warm.
- **Right-Size Memory:** More memory = more CPU (AWS Lambda).
- **Lazy Initialization:** Initialize expensive resources outside handler.
- **Connection Pooling:** Reuse database connections across invocations.

```javascript
// ✅ GOOD: Reuse connections in Lambda
const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient(); // Outside handler

exports.handler = async (event) => {
  // Handler code reuses dynamoDB client
  const result = await dynamoDB.get(params).promise();
  return result;
};
```

---

## Mobile Performance

### iOS & Android

- **Lazy Loading:** Load content and features on demand.
- **Image Optimization:** Use appropriate resolutions, compress assets.
- **Network Efficiency:** Batch requests, use efficient formats (Protocol Buffers).
- **Battery Optimization:** Minimize location updates, reduce background work.
- **Profiling:** Instruments (iOS), Android Profiler, Firebase Performance.

```swift
// ✅ GOOD: Lazy loading images
func loadImage(url: URL, into imageView: UIImageView) {
    imageView.image = placeholderImage

    DispatchQueue.global().async {
        if let data = try? Data(contentsOf: url),
           let image = UIImage(data: data) {
            DispatchQueue.main.async {
                imageView.image = image
            }
        }
    }
}
```

---

## Security & Performance Balance

- **Efficient Cryptography:** Use hardware-accelerated libraries (OpenSSL, BoringSSL).
- **Hash Passwords Properly:** bcrypt, Argon2—designed to be slow for attackers.
- **Rate Limiting:** Protect without degrading legitimate user experience.
- **Input Validation:** Efficient regex patterns, avoid ReDoS vulnerabilities.
- **TLS Configuration:** Use modern ciphers, enable session resumption.

```python
# ✅ GOOD: Efficient password hashing
import bcrypt

# Hash password (slow by design)
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# Verify password (also slow)
if bcrypt.checkpw(password.encode(), hashed):
    # Password correct
    pass
```

---

## Performance Testing & Monitoring

### Load Testing

- **Tools:** k6, Gatling, Locust, JMeter, Apache Bench.
- **Test Scenarios:** Baseline, stress, spike, soak, scalability tests.
- **Metrics:** Throughput (req/s), latency (p50, p95, p99), error rate.

```javascript
// ✅ GOOD: k6 load test script
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
  },
};

export default function () {
  const res = http.get("https://api.example.com/users");
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### Application Performance Monitoring (APM)

- **Tools:** New Relic, Datadog, AppDynamics, Dynatrace, Elastic APM.
- **Distributed Tracing:** OpenTelemetry, Jaeger, Zipkin for microservices.
- **Real User Monitoring (RUM):** Track actual user experience.
- **Synthetic Monitoring:** Proactive checks from multiple locations.

### Profiling Tools

| Language | CPU Profiler           | Memory Profiler  | Flame Graph      |
| -------- | ---------------------- | ---------------- | ---------------- |
| Python   | cProfile, py-spy       | memory_profiler  | py-spy           |
| Node.js  | --prof, clinic         | heapdump, clinic | 0x, clinic       |
| Java     | VisualVM, JProfiler    | VisualVM, MAT    | async-profiler   |
| Go       | pprof                  | pprof            | pprof            |
| Rust     | perf, cargo-flamegraph | valgrind         | cargo-flamegraph |
| .NET     | dotTrace, PerfView     | dotMemory        | PerfView         |

---

## Code Review Checklist

### Performance Review Checklist

- [ ] **Algorithm Complexity:** Any O(n²) or worse? Can it be improved?
- [ ] **Data Structures:** Appropriate choice for use case?
- [ ] **Database Queries:** Indexed? No N+1 queries? No SELECT \*?
- [ ] **Caching:** Used where beneficial? Invalidation handled correctly?
- [ ] **Network Calls:** Minimized? Batched? Proper error handling?
- [ ] **Memory Management:** Resources cleaned up? No leaks? Streams for large data?
- [ ] **Concurrency:** Thread-safe? No race conditions? Async for I/O?
- [ ] **Frontend Assets:** Images optimized? Lazy loading? Bundle size acceptable?
- [ ] **API Design:** Paginated? Rate limited? Compressed responses?
- [ ] **Error Handling:** Timeouts set? Circuit breakers in place?
- [ ] **Monitoring:** Performance metrics tracked? Alerts configured?
- [ ] **Tests:** Performance tests added for critical paths?
- [ ] **Documentation:** Performance assumptions documented?

---

## Common Anti-Patterns

### Frontend Anti-Patterns

- ❌ **Blocking Render:** Synchronous scripts without `defer`/`async`
- ❌ **Layout Thrashing:** Interleaved DOM reads and writes
- ❌ **Memory Leaks:** Unremoved event listeners, unclosed connections
- ❌ **Huge Bundles:** Shipping entire libraries for one function
- ❌ **No Lazy Loading:** Loading all resources upfront

### Backend Anti-Patterns

- ❌ **Blocking I/O:** Synchronous file/network operations in async context
- ❌ **No Connection Pooling:** Creating new DB connections per request
- ❌ **Global State:** Shared mutable state without synchronization
- ❌ **Unbounded Queues:** Memory exhaustion from unconstrained buffers
- ❌ **Missing Timeouts:** Operations that can hang indefinitely

### Database Anti-Patterns

- ❌ **SELECT \*:** Fetching unnecessary columns
- ❌ **N+1 Queries:** Looping and querying instead of joining
- ❌ **Missing Indexes:** On frequently queried columns
- ❌ **Long Transactions:** Holding locks for extended periods
- ❌ **No Query Limits:** Returning unbounded result sets

---

## Troubleshooting Guide

### Slow Page Load

1. **Check Network Tab:** Large assets? Too many requests?
2. **Lighthouse Audit:** Run for actionable recommendations
3. **Check TTFB:** Server responding slowly? Database issue?
4. **Review Bundle Size:** Is JS bundle too large?
5. **Check CDN:** Are static assets cached and served from edge?

### High Server CPU

1. **Profile Application:** Identify hot code paths with profiler
2. **Check Algorithms:** Any O(n²) or worse in hot paths?
3. **Database Queries:** Slow queries consuming CPU?
4. **Garbage Collection:** Is GC pausing too frequently?
5. **Concurrency Issues:** Lock contention or thread thrashing?

### Slow Database Queries

1. **EXPLAIN Query:** Analyze execution plan
2. **Check Indexes:** Missing or unused indexes?
3. **Query Complexity:** Can it be simplified or split?
4. **Table Statistics:** Are statistics up to date?
5. **Lock Contention:** Long transactions blocking queries?

### High Memory Usage

1. **Heap Dump:** Capture and analyze with profiler
2. **Memory Leaks:** Unfreed resources or circular references?
3. **Caching:** Is cache unbounded or improperly sized?
4. **Large Objects:** Loading too much data into memory?
5. **GC Tuning:** Is garbage collector configured appropriately?

---

## Tools & Resources

### Profiling & Monitoring

- **Frontend:** Chrome DevTools, Lighthouse, WebPageTest
- **Backend:** New Relic, Datadog, Prometheus, Grafana
- **Database:** pg_stat_statements, MySQL Performance Schema, MongoDB Profiler
- **Distributed Tracing:** OpenTelemetry, Jaeger, Zipkin
- **Load Testing:** k6, Gatling, Locust, Apache JMeter

### Performance Budgets

Set budgets and enforce with CI/CD:

```json
{
  "budgets": [
    {
      "path": "/",
      "resourceSizes": [
        { "resourceType": "script", "budget": 200 },
        { "resourceType": "image", "budget": 500 },
        { "resourceType": "total", "budget": 1000 }
      ],
      "resourceCounts": [
        { "resourceType": "script", "budget": 10 },
        { "resourceType": "third-party", "budget": 5 }
      ]
    }
  ]
}
```

---

## Conclusion

Performance optimization is a continuous process, not a one-time task. Always:

1. **Measure before optimizing**—use data, not intuition
2. **Focus on user experience**—optimize what users notice
3. **Set budgets and monitor**—prevent regressions
4. **Document decisions**—explain performance-critical code
5. **Automate testing**—catch issues early in CI/CD

Remember: **Premature optimization is the root of all evil, but late optimization is the root of all evil too.** Find the balance.

---

*"We should forget about small efficiencies, say about 97% of the time: premature optimization is the root of all evil. Yet we should not pass up our opportunities in that critical 3%."*  
— Donald Knuth

---

<!-- End of Universal Performance Optimization Guide -->
