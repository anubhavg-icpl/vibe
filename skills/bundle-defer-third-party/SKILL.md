---
name: bundle-defer-third-party
description: Defer Non-Critical Third-Party Libraries
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rules
---

## Defer Non-Critical Third-Party Libraries

Analytics, logging, and error tracking don't block user interaction. Load them after hydration.

**Incorrect (blocks initial bundle):**

```tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Correct (loads after hydration):**

```tsx
import dynamic from "next/dynamic";

const Analytics = dynamic(() => import("@vercel/analytics/react").then((m) => m.Analytics), { ssr: false });

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```
