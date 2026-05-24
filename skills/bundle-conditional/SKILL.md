---
name: bundle-conditional
description: Conditional Module Loading. Use when you need help with bundle conditional.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rules
---

## Conditional Module Loading

Load large data or modules only when a feature is activated.

**Example (lazy-load animation frames):**

```tsx
function AnimationPlayer({ enabled }: { enabled: boolean }) {
  const [frames, setFrames] = useState<Frame[] | null>(null);

  useEffect(() => {
    if (enabled && !frames && typeof window !== "undefined") {
      import("./animation-frames.js").then((mod) => setFrames(mod.frames)).catch(() => setEnabled(false));
    }
  }, [enabled, frames]);

  if (!frames) return <Skeleton />;
  return <Canvas frames={frames} />;
}
```

The `typeof window !== 'undefined'` check prevents bundling this module for SSR, optimizing server bundle size and build speed.
