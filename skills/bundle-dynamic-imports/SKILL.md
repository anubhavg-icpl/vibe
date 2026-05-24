---
name: bundle-dynamic-imports
description: Dynamic Imports for Heavy Components. Use when you need help with bundle dynamic imports.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rules
---

## Dynamic Imports for Heavy Components

Use `next/dynamic` to lazy-load large components not needed on initial render.

**Incorrect (Monaco bundles with main chunk ~300KB):**

```tsx
import { MonacoEditor } from "./monaco-editor";

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />;
}
```

**Correct (Monaco loads on demand):**

```tsx
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("./monaco-editor").then((m) => m.MonacoEditor), { ssr: false });

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />;
}
```
