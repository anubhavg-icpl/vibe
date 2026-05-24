---
name: js-set-map-lookups
description: Use Set/Map for O(1) Lookups. Use when you need help with js set map lookups.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rules
---

## Use Set/Map for O(1) Lookups

Convert arrays to Set/Map for repeated membership checks.

**Incorrect (O(n) per check):**

```typescript
const allowedIds = ['a', 'b', 'c', ...]
items.filter(item => allowedIds.includes(item.id))
```

**Correct (O(1) per check):**

```typescript
const allowedIds = new Set(['a', 'b', 'c', ...])
items.filter(item => allowedIds.has(item.id))
```
