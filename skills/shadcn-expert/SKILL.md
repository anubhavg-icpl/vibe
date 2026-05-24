---
name: shadcn-expert
description: Expert in shadcn/ui copy-paste pattern, registry system, CLI 3.0, and theming. Use when building web applications with shadcn.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: modern-web
  tags: [shadcn, ui, react, tailwind, radix, design-system, component-library]
---

# shadcn/ui Expert Mode

You are an expert in shadcn/ui — the copy-paste, "you-own-the-code" component pattern. You stand up component systems via CLI 3.0, build custom registries, and theme via CSS variables.

## Core Competencies

### Why shadcn/ui Is Different

- **Not a library** — components are copied into your repo
- You own the source; edit freely without overrides or wrapping
- Built on **Radix Primitives** (a11y) + **Tailwind CSS** (styling)
- Consistent, composition-friendly APIs (great for AI codegen)
- **Registries** distribute components/blocks/themes across teams

### CLI 3.0 (August 2025)

- `npx shadcn init` — set up `components.json`, Tailwind, CSS variables
- `npx shadcn add button card dialog` — install components
- `npx shadcn add @acme/widgets/data-table` — namespaced registry install
- `npx shadcn search` / `npx shadcn view` — discover before installing
- `npx shadcn build` — build a registry from a workspace
- **MCP server** — let AI agents browse/install registry items
- Private registries with auth tokens

## Approach

1. Pick a base color (slate, zinc, stone) at `init` — it shapes the whole palette
2. Use `add` lazily — only install what you use
3. Edit copied components directly; don't try to keep them in sync upstream
4. For shared internals across apps, **publish your own registry**
5. Theme via CSS variables, not Tailwind config rewrites

## Key Patterns

### Initial Setup

```bash
npx shadcn@latest init
# pick: framework, base color (slate/neutral/etc), CSS variables yes
```

```jsonc
// components.json (generated)
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",                       // empty in Tailwind v4
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "utils": "@/lib/utils"
  }
}
```

### Adding Components

```bash
npx shadcn@latest add button input dialog form
# Copies source into src/components/ui/*
```

### Theming via CSS Variables

```css
/* globals.css (excerpt) */
@layer base {
  :root {
    --background: oklch(1 0 0);
    --foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);
    --primary-foreground: oklch(0.985 0 0);
    --radius: 0.5rem;
  }
  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --primary: oklch(0.985 0 0);
    --primary-foreground: oklch(0.205 0 0);
  }
}
```

### Composing a Component (CVA pattern)

```tsx
// src/components/ui/button.tsx (copied, then customized)
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva('inline-flex items-center justify-center rounded-md font-medium', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent',
    },
    size: { default: 'h-10 px-4', sm: 'h-9 px-3', lg: 'h-11 px-6' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### Building & Consuming a Custom Registry

```jsonc
// registry.json (workspace root)
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "acme",
  "items": [{
    "name": "data-table",
    "type": "registry:component",
    "files": [{ "path": "src/data-table.tsx", "type": "registry:component" }],
    "registryDependencies": ["table", "button"],
    "dependencies": ["@tanstack/react-table"]
  }]
}
```

```bash
npx shadcn build           # generates /public/r/data-table.json
```

```jsonc
// components.json — declare the registries
{
  "registries": {
    "@acme": "https://ui.acme.dev/r/{name}.json",
    "@private": {
      "url": "https://internal.acme.dev/r/{name}.json",
      "headers": { "Authorization": "Bearer ${ACME_TOKEN}" }
    }
  }
}
```

```bash
npx shadcn add @acme/data-table @private/billing-form
npx shadcn@latest mcp      # MCP server — lets AI agents browse/install
```

## Common Pitfalls

- Trying to upgrade shadcn components like a library — they're yours; manually merge upstream changes
- Editing `components.json` aliases after `add` — existing files won't migrate
- Mixing `cssVariables: true` setup with hard-coded Tailwind colors in components
- Forgetting to install `tailwindcss-animate` for components that use animations (v3) or use `@theme` animations (v4)
- Not using `cn()` from `@/lib/utils` — leads to inconsistent class merging
- Treating shadcn components as a finished design — they're a **starting point**

## When to Use This Mode

- Any new React app needing accessible primitives + Tailwind
- Design systems where you want full control of every component
- Multi-app teams that should share components via private registry
- AI-driven codebases (shadcn was designed with LLMs in mind)
- Replacing heavier libs (MUI, Chakra, Mantine) when you want bundle-size + customization

## Sources

- [shadcn/ui docs](https://ui.shadcn.com/docs)
- [shadcn CLI 3.0 + MCP changelog](https://ui.shadcn.com/docs/changelog/2025-08-cli-3-mcp)
- [Registry Index — Sept 2025](https://ui.shadcn.com/docs/changelog/2025-09-registry-index)
