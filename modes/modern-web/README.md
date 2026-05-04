# Modern Web Modes

Modes covering the current (2025–2026) web build-tools and frontend framework ecosystem. Each mode turns Claude Code into a focused expert for that technology, grounded in official docs and current best practices.

## Modes in This Category

### Build Tools & Bundlers

- **[vite-expert-mode.md](./vite-expert-mode.md)** — Vite 6+: dev server, library mode, SSR, Environment API
- **[bun-expert-mode.md](./bun-expert-mode.md)** — Bun 1.2+ runtime, package manager, test runner, bundler
- **[rspack-expert-mode.md](./rspack-expert-mode.md)** — Rspack/Rsbuild Rust bundler (webpack-compatible)

### Monorepo Orchestration

- **[turborepo-expert-mode.md](./turborepo-expert-mode.md)** — Turborepo 2 task graph + remote caching
- **[nx-monorepo-expert-mode.md](./nx-monorepo-expert-mode.md)** — Nx workspace, generators, executors, project graph

### Frameworks (full-stack & meta)

- **[astro-expert-mode.md](./astro-expert-mode.md)** — Astro 5: islands, content collections, server islands, view transitions
- **[nuxt-expert-mode.md](./nuxt-expert-mode.md)** — Nuxt 4 with Nitro engine
- **[sveltekit-expert-mode.md](./sveltekit-expert-mode.md)** — SvelteKit + Svelte 5 runes
- **[react-router-expert-mode.md](./react-router-expert-mode.md)** — React Router v7 framework mode (formerly Remix)
- **[qwik-expert-mode.md](./qwik-expert-mode.md)** — Qwik resumability + Qwik City

### React-Adjacent Libraries

- **[solid-expert-mode.md](./solid-expert-mode.md)** — SolidJS signals + fine-grained reactivity
- **[tanstack-router-expert-mode.md](./tanstack-router-expert-mode.md)** — Type-safe file-based routing for React
- **[tanstack-query-expert-mode.md](./tanstack-query-expert-mode.md)** — TanStack Query v5 server-state management
- **[million-expert-mode.md](./million-expert-mode.md)** — Million.js block-DOM optimizing compiler for React

### Styling & Components

- **[tailwind-v4-expert-mode.md](./tailwind-v4-expert-mode.md)** — Tailwind CSS v4 with Oxide engine + CSS-first config
- **[shadcn-expert-mode.md](./shadcn-expert-mode.md)** — shadcn/ui copy-paste pattern + CLI 3.0 + custom registries

### Tooling

- **[biome-expert-mode.md](./biome-expert-mode.md)** — Biome v2 (Rust-powered linter + formatter, replaces ESLint + Prettier)

### Hypermedia

- **[htmx-expert-mode.md](./htmx-expert-mode.md)** — htmx hypermedia-driven applications (server-rendered HTML over the wire)

## How These Modes Were Built

Each mode is grounded in:

1. A WebSearch query for the latest 2025–2026 release notes and best practices
2. A WebFetch of the official docs landing page or API reference for verified API names
3. Code examples written against the verified API surface (no hallucinated functions)

Sources are cited at the bottom of every mode file.
