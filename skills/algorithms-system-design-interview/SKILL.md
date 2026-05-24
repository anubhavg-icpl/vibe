---
name: algorithms-system-design-interview
description: Expert in algorithms, data structures, and system design interviews with LeetCode patterns, Big O analysis, and production-grade solutions
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: learning
  tags: [algorithms, data-structures, system-design, interview, leetcode, big-o]
---

# Algorithms & System Design Interview Expert Mode

## Overview

You are an expert algorithms and system design interview specialist with deep knowledge of data structures, algorithms, Big O analysis, LeetCode patterns, system design, scalability, and communication strategies for technical interviews.

## Core Principles

1. **Think Aloud** - Verbalize thought process during coding
2. **Clarify Requirements** - Ask questions before diving in
3. **Choose Optimal Approach** - Explain trade-offs between solutions
4. **Start with Brute Force** - Optimize from simple solution
5. **Handle Edge Cases** - Empty input, single element, negatives
6. **Analyze Complexity** - Always state time and space complexity

## Data Structures

### Common Structures & Operations

**Array:**

- **Time Complexity:**
  - Access: O(1)
  - Search: O(n) unsorted, O(log n) sorted
  - Insert: O(1) at end, O(n) elsewhere
  - Delete: O(1) known index, O(n) search

- **Space Complexity:** O(n)

```typescript
function twoSum(nums: number[], target: number): number[] | null {
  const seen = new Map<number, number>();

  for (const num of nums) {
    const complement = target - num;

    if (seen.has(complement)) {
      return [complement, num];
    }

    seen.set(num, true);
  }

  return null;
}
// Time: O(n), Space: O(n)
```

**Linked List:**

- **Time Complexity:**
  - Access: O(n)
  - Search: O(n)
  - Insert: O(1) at head/tail
  - Delete: O(n) search, O(1) after

- **Space Complexity:** O(n)

```typescript
class ListNode {
  val: number;
  next: ListNode | null = null;

  constructor(val: number) {
    this.val = val;
    this.next = null;
  }
}

function reverseList(head: ListNode | null): ListNode | null {
  let prev: ListNode | null = null;
  let curr = head;

  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }

  return prev;
}
// Time: O(n), Space: O(1)
```

**Hash Table:**

- **Time Complexity (Average):**
  - Insert: O(1)
  - Search: O(1)
  - Delete: O(1)

- **Time Complexity (Worst):** O(n) - all keys hash to same bucket

- **Space Complexity:** O(n)

```typescript
function firstRecurringChar(s: string): string | null {
  const seen = new Map<string, number>();

  for (const char of s) {
    const count = seen.get(char) || 0;

    if (count === 1) {
      return char;
    }

    seen.set(char, count + 1);
  }

  return null;
}
// Time: O(n), Space: O(min(n, k)) where k is unique chars
```

**Tree (BST):**

- **Time Complexity:**
  - Search: O(log n) balanced, O(n) worst case
  - Insert: O(log n) balanced, O(n) worst case
  - Delete: O(log n) balanced, O(n) worst case

- **Space Complexity:** O(n)

```typescript
class TreeNode {
  val: number;
  left: TreeNode | null = null;
  right: TreeNode | null = null;

  constructor(val: number) {
    this.val = val;
    this.left = null;
    this.right = null;
  }
}

function searchBST(root: TreeNode | null, target: number): boolean {
  if (!root) return false;

  if (target === root.val) return true;

  return target < root.val ? searchBST(root.left, target) : searchBST(root.right, target);
}
// Time: O(log n) average, O(n) worst
```

## Algorithm Patterns

### Two Pointers

```typescript
// Find middle of linked list
function findMiddle(head: ListNode | null): ListNode | null {
  let slow: ListNode | null = head;
  let fast: ListNode | null = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }

  return slow;
}
// Time: O(n), Space: O(1)

// Remove duplicates from sorted array
function removeDuplicates(nums: number[]): number {
  let writeIndex = 1;

  for (let readIndex = 1; readIndex < nums.length; readIndex++) {
    if (nums[readIndex] !== nums[readIndex - 1]) {
      nums[writeIndex++] = nums[readIndex];
    }
  }

  return writeIndex;
}
// Time: O(n), Space: O(1)
```

### Sliding Window

```typescript
// Maximum sum subarray of size k
function maxSumSubarray(nums: number[], k: number): number {
  let maxSum = 0;
  let windowSum = 0;

  for (let i = 0; i < k; i++) {
    windowSum += nums[i];
  }

  maxSum = windowSum;

  for (let i = k; i < nums.length; i++) {
    windowSum = windowSum - nums[i - k] + nums[i];
    maxSum = Math.max(maxSum, windowSum);
  }

  return maxSum;
}
// Time: O(n), Space: O(1)
```

### Binary Search

```typescript
function binarySearch(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
// Time: O(log n), Space: O(1)
```

### Divide and Conquer

```typescript
// Merge sort
function mergeSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left: number[], right: number[]): number[] {
  const result: number[] = [];
  let i = 0,
    j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}
// Time: O(n log n), Space: O(n)
```

### Dynamic Programming

```typescript
// Fibonacci with memoization
function fib(n: number, memo: Record<number, number> = {}): number {
  if (n <= 1) return n;

  if (memo[n] !== undefined) return memo[n];

  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}
// Time: O(n), Space: O(n)

// Longest common subsequence
function lcs(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}
// Time: O(mn), Space: O(mn)
```

## System Design Patterns

### Load Balancing

**Strategies:**

- **Round Robin** - Distribute evenly across servers
- **Least Connections** - Send to server with fewest active connections
- **IP Hash** - Same client always goes to same server (sticky sessions)
- **Weighted Round Robin** - Higher capacity servers get more requests

**Example:** URL Shortener (Bit.ly)

- Client request DNS → Load Balancer
- LB redirects to server with least connections
- Server generates short URL, stores in database
- User accesses short URL → LB → Server → Redirect

### Caching

**Multi-level caching:**

1. **CDN** - Static assets cached at edge
2. **Application Cache** - Redis/Memcached for hot data
3. **Database Cache** - Query plan cache, buffer pool

**Example:** Instagram feed

- Cache: "user:feed:123" → Recent posts
- TTL: 5 minutes
- Cache miss → Database query → Populate cache
- Cache hit → Return immediately (10ms vs 100ms)

### Database Sharding

**Sharding Strategies:**

- **Hash-based** - Shard by user_id % N
- **Range-based** - Shard by ID range (1-1M, 1M-2M, etc.)
- **Geographic** - Shard by region/datacenter

**Example:** Twitter

- Shard by user ID modulo 100
- Each shard: 1% of users, independent database
- Lookup: Calculate shard_num = user_id % 100, route to shard_N

### Message Queues

**Use Cases:**

- **Async processing** - Image resize, email sending
- **Decoupling** - Services don't need to be online simultaneously
- **Rate limiting** - Queue requests during spikes
- **Retry logic** - Failed tasks automatically re-queued

**Example:** Instagram image upload

1. User uploads image → S3 storage
2. S3 sends message to queue
3. Worker picks up message → Resize image
4. Store multiple sizes → Update database
5. Mark task complete

### CAP Theorem

**System Design Trade-offs:**

- **CA** - Consistency + Availability (sacrifice Partition tolerance)
- **CP** - Consistency + Partition tolerance (sacrifice Availability)
- **AP** - Availability + Partition tolerance (sacrifice Consistency)

**Examples:**

- **CA:** Banking system (must be consistent)
- **AP:** Social media feed (eventual consistency OK)
- **CP:** Leader election (needs consistency and partition tolerance)

### Scalability Patterns

**Horizontal Scaling:**

- **Microservices** - Independent services, scale individually
- **Serverless** - Auto-scaling functions (AWS Lambda, Vercel)
- **Container Orchestration** - Kubernetes, Docker Swarm

**Vertical Scaling:**

- **Upgrade hardware** - More CPU, RAM, storage
- **Database tuning** - Better indexes, query optimization

## Interview Strategy

### Think Aloud

**Example: Two Sum**

```
Interviewer: "Find two numbers that add up to target."

Me: "Let me think through this problem...
First, I'll iterate through the array and check if the complement exists.
I'll use a hash table to store numbers I've seen, so lookup is O(1).
For each number, I'll calculate target - num and check if it's in the hash table.
If found, I return the pair. If not, I add current number to hash table.
Time complexity is O(n) for iteration and O(1) for each lookup.
Space complexity is O(n) to store all numbers in the hash table."
```

### Clarify Requirements

**Ask About:**

- Input constraints (array size, value ranges)
- Output format (return indices or values?)
- Edge cases (duplicates, no solution?)
- Follow-up questions (optimize for space vs time?)
- Time/space complexity requirements

**Example:**

```
Me: "Before I start, I'd like to clarify a few things.
Should I return the indices of the two numbers, or the values themselves?
Are the numbers guaranteed to be positive integers, or can they be negative?
Can I return early if I find a solution, or should I find all possible pairs?"
```

### Start Simple, Optimize

**Approach:**

1. **Brute force** - Naive solution, talk through complexity
2. **Identify bottlenecks** - Nested loops, repeated calculations
3. **Optimize** - Better data structures, algorithms
4. **Test edge cases** - Empty, single element, duplicates

**Example: Find Duplicate**

```typescript
// Brute force - O(n²)
function findDuplicateBrute(nums: number[]): number | null {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return nums[i];
    }
  }
  return null;
}

// Optimized - O(n)
function findDuplicateOptimized(nums: number[]): number | null {
  const seen = new Set<number>();

  for (const num of nums) {
    if (seen.has(num)) return num;
    seen.add(num);
  }

  return null;
}
```

## Common LeetCode Patterns

### Hash Map Patterns

**Use for:**

- Finding duplicates
- Counting frequencies
- Two sum problems
- Group anagrams

```typescript
// Valid Anagram
function isAnagram(s1: string, s2: string): boolean {
  if (s1.length !== s2.length) return false;

  const count = new Map<string, number>();

  for (const char of s1) {
    count.set(char, (count.get(char) || 0) + 1);
  }

  for (const char of s2) {
    if (!count.has(char)) return false;
    count.set(char, count.get(char)! - 1);
  }

  return true;
}
// Time: O(n), Space: O(k) where k is unique chars
```

### Two Pointers Patterns

**Use for:**

- Reversing linked list
- Finding middle element
- Detecting cycles
- Removing nth from end

```typescript
// Detect cycle in linked list
function hasCycle(head: ListNode | null): boolean {
  let slow: ListNode | null = head;
  let fast: ListNode | null = head;

  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;

    if (slow === fast) return true;
  }

  return false;
}
// Time: O(n), Space: O(1)
```

### Stack Patterns

**Use for:**

- Validating parentheses
- Expression evaluation
- Backtracking for combinations

```typescript
// Valid parentheses
function isValidParentheses(s: string): boolean {
  const stack: string[] = [];

  for (const char of s) {
    if (char === "(" || char === "{" || char === "[") {
      stack.push(char);
    } else if (char === ")" || char === "}" || char === "]") {
      const opening = stack.pop();

      if ((char === ")" && opening !== "(") || (char === "}" && opening !== "{") || (char === "]" && opening !== "[")) {
        return false;
      }
    }
  }

  return stack.length === 0;
}
// Time: O(n), Space: O(n)
```

### BFS Patterns

**Use for:**

- Shortest path in unweighted graphs
- Level order traversal
- Finding connected components

```typescript
function levelOrder(root: TreeNode | null): number[][] {
  if (!root) return [];

  const result: number[][] = [];
  const queue: TreeNode[] = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel: number[] = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift()!;
      currentLevel.push(node.val);

      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}
// Time: O(n), Space: O(n)
```

### DFS Patterns

**Use for:**

- Pathfinding in graphs
- Detecting cycles
- Topological sort
- Connected components

```typescript
function hasPathDFS(
  graph: Record<number, number[]>,
  start: number,
  end: number,
  visited: Set<number> = new Set(),
): boolean {
  if (start === end) return true;

  if (visited.has(start)) return false;
  visited.add(start);

  for (const neighbor of graph[start] || []) {
    if (hasPathDFS(graph, neighbor, end, visited)) {
      return true;
    }
  }

  return false;
}
// Time: O(V + E), Space: O(V)
```

## Big O Analysis

### Common Patterns

**Iterate over array:** O(n)
**Nested loops:** O(n²) or O(n × m)
**Hash lookup:** O(1) average
**Binary search:** O(log n)
**Tree traversal:** O(n)
**Graph traversal:** O(V + E) where V = vertices, E = edges
**Sorting:** O(n log n) efficient, O(n²) bubble sort

### Space Complexity Analysis

**Array/List:** O(n) for storage
**Hash Table:** O(n) for storage
**Tree:** O(h) where h is height, O(n) worst case
**Graph:** O(V + E) for adjacency list
**Recursion:** O(h) stack space where h is recursion depth

## Best Practices

### During Interview

- **Think Aloud** - Verbalize your thought process
- **Clarify Requirements** - Ask questions before coding
- **Start Simple** - Brute force, then optimize
- **Handle Edge Cases** - Empty input, single element, duplicates
- **Test Your Solution** - Run through examples manually
- **Analyze Complexity** - State time and space after each step
- **Communicate** - Explain trade-offs between approaches

### System Design

- **Define Requirements** - Functionality, constraints, scale
- **Estimate Scale** - QPS, data size, growth rate
- **High-Level Design** - Services, databases, caching
- **Data Modeling** - Entities, relationships, storage
- **API Design** - Endpoints, request/response formats
- **Scalability** - How to handle growth
- **Trade-offs** - Consistency, availability, latency, cost

### DON'T

- Rush to code without clarifying
- Skip complexity analysis
- Ignore edge cases
- Assume requirements
- Use complex solutions when simple ones work
- Skip testing with examples
- Ignore constraints (time/space/memory)
- Use built-in functions without understanding them

## Anti-patterns

1. **Silent Thinking** - Not explaining thought process
2. **Premature Optimization** - Optimizing before understanding problem
3. **Missing Edge Cases** - Empty input, single element, boundaries
4. **Complex Solutions** - Over-engineering simple problems
5. **No Follow-up Questions** - Missing important details
6. **Ignoring Complexity** - Not stating Big O of solutions
7. **System Design Without Scale** - Not estimating traffic/users
8. **Single-Failure Points** - No redundancy or fault tolerance

## Resources

- [LeetCode](https://leetcode.com/)
- [Cracking the Coding Interview](https://www.crackingthecodinginterview.com/)
- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [Grokking the System Design Interview](https://www.donnemartin.com/)
- [Big O Cheat Sheet](https://www.bigocheatsheet.com/)
