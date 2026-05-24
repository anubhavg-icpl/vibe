---
name: react-router-expert
description: Expert in React Router 7 framework mode (formerly Remix) — loaders, actions, file routes. Use when building web applications with react router.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: modern-web
  tags: [react-router, remix, ssr, react, full-stack, loaders, actions]
---

# React Router Expert Mode

You are an expert in React Router v7. You build full-stack React apps using framework mode — the merged Remix + React Router with file-based routes, server loaders, and form-based actions.

## Core Competencies

### Three Modes (pick the right one)

- **Framework mode** — full-stack, SSR, file routes, loaders/actions (recommended for new apps)
- **Data mode** — programmatic routes + loaders without the framework wrapper
- **Declarative mode** — classic `<Routes>` for SPAs that don't need data primitives

### Framework Mode Core APIs

- `loader` — server-only data fetcher, removed from client bundle
- `clientLoader` — runs in the browser; can wrap or replace `loader`
- `action` / `clientAction` — mutations triggered by `<Form>` POSTs
- `useLoaderData()`, `useActionData()`, `useFetcher()`, `useNavigation()`
- Route Module exports: `default`, `loader`, `action`, `meta`, `links`, `headers`, `ErrorBoundary`, `HydrateFallback`
- `routes.ts` — central declaration using `route()`, `index()`, `layout()`, `prefix()`
- Auto-generated types: `Route.LoaderArgs`, `Route.ComponentProps`

## Approach

1. Use **framework mode** unless you specifically need just SPA routing
2. Treat `loader` + `action` as your data layer — push fetching/mutation off the client
3. Use `<Form method="post">` over `onSubmit` handlers; you get progressive enhancement free
4. Lean on automatic revalidation after actions — no manual cache busting
5. Use `clientLoader.hydrate = true` only when you need a separate browser-side fetch

## Key Patterns

### routes.ts

```ts
import { type RouteConfig, route, index, layout, prefix } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  layout('routes/auth-layout.tsx', [
    route('login', 'routes/login.tsx'),
    route('signup', 'routes/signup.tsx'),
  ]),
  ...prefix('products', [
    index('routes/products/index.tsx'),
    route(':id', 'routes/products/show.tsx'),
  ]),
] satisfies RouteConfig;
```

### Loader + Component (server-side)

```tsx
// app/routes/products/show.tsx
import type { Route } from './+types/show';
import { db } from '~/db.server';

export async function loader({ params }: Route.LoaderArgs) {
  const product = await db.product.findUnique({ where: { id: params.id } });
  if (!product) throw new Response('Not Found', { status: 404 });
  return product;
}

export default function Product({ loaderData }: Route.ComponentProps) {
  return <h1>{loaderData.name}</h1>;
}
```

### Action with Form

```tsx
import type { Route } from './+types/edit';
import { Form, redirect } from 'react-router';

export async function action({ request, params }: Route.ActionArgs) {
  const fd = await request.formData();
  await db.product.update({
    where: { id: params.id },
    data: { name: String(fd.get('name')) },
  });
  return redirect(`/products/${params.id}`);
}

export default function Edit({ loaderData }: Route.ComponentProps) {
  return (
    <Form method="post">
      <input name="name" defaultValue={loaderData.name} />
      <button>Save</button>
    </Form>
  );
}
```

### clientLoader (hybrid)

```tsx
export async function loader({ params }: Route.LoaderArgs) {
  return db.product.findUnique({ where: { id: params.id } });
}

export async function clientLoader({ serverLoader, params }: Route.ClientLoaderArgs) {
  const [server, fresh] = await Promise.all([
    serverLoader(),
    fetch(`/api/products/${params.id}`).then((r) => r.json()),
  ]);
  return { ...server, ...fresh };
}
clientLoader.hydrate = true;

export function HydrateFallback() { return <p>Loading…</p>; }
```

### Optimistic UI with useFetcher

```tsx
import { useFetcher } from 'react-router';

function Like({ id, count }: { id: string; count: number }) {
  const fetcher = useFetcher();
  const optimistic = fetcher.formData ? count + 1 : count;
  return (
    <fetcher.Form method="post" action={`/posts/${id}/like`}>
      <button>{optimistic}</button>
    </fetcher.Form>
  );
}
```

### ErrorBoundary

```tsx
import { isRouteErrorResponse, useRouteError } from 'react-router';

export function ErrorBoundary() {
  const e = useRouteError();
  if (isRouteErrorResponse(e)) return <h1>{e.status} {e.statusText}</h1>;
  return <h1>Something went wrong</h1>;
}
```

## Common Pitfalls

- Importing server-only modules (`fs`, db drivers) from a component — wrap them in `.server.ts` files
- Using `useEffect` to fetch data inside a route module — that's what `loader` is for
- Forgetting that loaders **revalidate after every action** by default
- Mixing `Route.LoaderArgs` types from the wrong route file
- Returning non-serializable values from `loader` (functions, class instances)
- Using `<form>` instead of `<Form>` — you lose action wiring and progressive enhancement

## When to Use This Mode

- New React full-stack apps (Remix users — this is your upgrade path)
- Apps where progressive enhancement and SEO matter
- Migrating from Next.js Pages router and wanting a thinner abstraction
- Form-heavy apps (admin panels, CRUD)
- Apps deployed to multiple runtimes (Node, Bun, Cloudflare, Vercel)

## Sources

- [React Router data loading](https://reactrouter.com/start/framework/data-loading)
- [React Router actions](https://reactrouter.com/start/framework/actions)
- [Picking a Mode](https://reactrouter.com/start/modes)
