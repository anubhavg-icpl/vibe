# Edge Platforms & BaaS Modes

Vibe modes covering modern cloud, edge, and Backend-as-a-Service platforms. Each mode is grounded in current (2025-2026) official APIs, with verified syntax for configuration files, SDK calls, and CLI commands.

## Modes

### Edge Compute & Serverless Runtimes

- **[cloudflare-workers-expert-mode](./cloudflare-workers-expert-mode.md)** - Workers, Durable Objects, R2, KV, D1, Queues, Vectorize, and Workers AI bindings
- **[vercel-edge-expert-mode](./vercel-edge-expert-mode.md)** - Vercel Functions on Fluid compute, ISR, on-demand revalidation, Image Optimization
- **[deno-deploy-expert-mode](./deno-deploy-expert-mode.md)** - Deno Deploy, Deno KV, atomic transactions, queues, Deno.cron
- **[lambda-expert-mode](./lambda-expert-mode.md)** - AWS Lambda 2025: SnapStart (Java/Python/.NET), Layers, Function URLs, Graviton

### Application Platforms (PaaS)

- **[fly-io-expert-mode](./fly-io-expert-mode.md)** - Fly Machines, multi-region deploys, fly.toml, Fly Postgres, fly-replay
- **[railway-expert-mode](./railway-expert-mode.md)** - Railway services, environments, reference variables, PR previews
- **[render-expert-mode](./render-expert-mode.md)** - Render Blueprints, web services, background workers, cron, key-value, Postgres

### Backend-as-a-Service

- **[supabase-expert-mode](./supabase-expert-mode.md)** - Postgres, Auth, RLS, Realtime, Storage, Edge Functions (Deno), pgvector
- **[convex-expert-mode](./convex-expert-mode.md)** - Reactive backend: queries, mutations, actions, scheduler, crons
- **[clerk-expert-mode](./clerk-expert-mode.md)** - Authentication, Organizations, RBAC, webhooks (Svix), Next.js App Router
- **[stripe-expert-mode](./stripe-expert-mode.md)** - Payment Intents, Subscriptions, Connect, webhooks (API version 2025-06-30.basil)

### Data & Storage

- **[neon-expert-mode](./neon-expert-mode.md)** - Serverless Postgres, branching, autoscaling, @neondatabase/serverless driver
- **[upstash-expert-mode](./upstash-expert-mode.md)** - Redis (HTTP), QStash, Vector, Workflow for serverless and edge

### ML & Inference

- **[modal-expert-mode](./modal-expert-mode.md)** - Serverless GPUs (T4 - B200), web endpoints, scheduled jobs, Cls + @modal.enter
- **[replicate-expert-mode](./replicate-expert-mode.md)** - Predictions API, Cog model packaging, fine-tunes, webhooks
- **[huggingface-spaces-expert-mode](./huggingface-spaces-expert-mode.md)** - Spaces (Gradio/Streamlit/Docker), ZeroGPU, Inference Endpoints

## Conventions

Every mode follows the same structure:

1. **Persona intro** - what the mode is and what it knows
2. **Core Competencies** - capabilities and concepts
3. **Approach** - the opinionated method the expert applies
4. **Key Patterns** - real, copy-pasteable code with verified syntax
5. **Common Pitfalls** - mistakes the expert specifically helps avoid
6. **When to Use This Mode** - selection criteria

All code examples reference verified APIs from official documentation sources current as of 2025-2026.
