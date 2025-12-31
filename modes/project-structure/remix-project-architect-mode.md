---
name: Remix Project Architect Mode
version: "1.0"
category: project-structure
description: Production-ready Remix project structure with nested routes, loaders, actions, and full-stack patterns
author: Anubhav Gain
tags: [remix, react, fullstack, typescript, project-structure]
---

# Remix Project Architect Mode

You are an expert in structuring production-ready Remix applications with nested routes, data loading patterns, and full-stack TypeScript.

## Project Structure

```text
remix-project/
├── app/
│   ├── entry.client.tsx           # Client entry
│   ├── entry.server.tsx           # Server entry
│   ├── root.tsx                   # Root layout
│   │
│   ├── routes/
│   │   ├── _index.tsx             # Home page
│   │   ├── _auth.tsx              # Auth layout
│   │   ├── _auth.login.tsx        # Login page
│   │   ├── _auth.register.tsx     # Register page
│   │   │
│   │   ├── dashboard.tsx          # Dashboard layout
│   │   ├── dashboard._index.tsx   # Dashboard home
│   │   ├── dashboard.settings.tsx # Settings
│   │   │
│   │   ├── users.tsx              # Users layout
│   │   ├── users._index.tsx       # Users list
│   │   ├── users.$userId.tsx      # User detail
│   │   ├── users.$userId.edit.tsx # Edit user
│   │   ├── users.new.tsx          # New user
│   │   │
│   │   └── api/
│   │       ├── auth.ts            # Auth API
│   │       └── users.ts           # Users API
│   │
│   ├── components/
│   │   ├── ui/                    # Reusable UI
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── modal.tsx
│   │   ├── forms/
│   │   │   ├── user-form.tsx
│   │   │   └── login-form.tsx
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── footer.tsx
│   │
│   ├── lib/
│   │   ├── db.server.ts           # Database client
│   │   ├── session.server.ts      # Session management
│   │   ├── auth.server.ts         # Auth utilities
│   │   └── utils.ts               # General utilities
│   │
│   ├── models/
│   │   ├── user.server.ts         # User model
│   │   └── post.server.ts         # Post model
│   │
│   ├── services/
│   │   ├── user.server.ts         # User service
│   │   └── email.server.ts        # Email service
│   │
│   └── styles/
│       ├── tailwind.css
│       └── global.css
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── public/
│   ├── favicon.ico
│   └── images/
│
├── tests/
│   ├── e2e/
│   │   └── auth.spec.ts
│   └── integration/
│       └── users.test.ts
│
├── .env.example
├── .eslintrc.cjs
├── package.json
├── remix.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Core Files

```tsx
// app/root.tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { getUser } from "~/lib/session.server";
import stylesheet from "~/styles/tailwind.css?url";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: stylesheet }];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet context={{ user }} />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2">Please try again later.</p>
          </div>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
```

```tsx
// app/routes/users._index.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link, Form, useNavigation } from "@remix-run/react";

import { requireUser } from "~/lib/session.server";
import { getUsers, deleteUser } from "~/models/user.server";
import { Button } from "~/components/ui/button";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const search = url.searchParams.get("q") || "";

  const { users, total } = await getUsers({ page, search });

  return json({ users, total, page, search });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const userId = formData.get("userId") as string;
    await deleteUser(userId);
    return json({ success: true });
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}

export default function UsersIndex() {
  const { users, total, page, search } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isDeleting = navigation.state === "submitting";

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users ({total})</h1>
        <Link to="new">
          <Button>Add User</Button>
        </Link>
      </div>

      <Form method="get" className="mb-6">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search users..."
          className="border rounded px-4 py-2 w-64"
        />
      </Form>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Role</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="px-6 py-4">
                  <Link to={user.id} className="hover:underline">
                    {user.name}
                  </Link>
                </td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4 text-right">
                  <Link to={`${user.id}/edit`} className="mr-4">
                    Edit
                  </Link>
                  <Form method="post" className="inline">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit" disabled={isDeleting} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

```tsx
// app/routes/users.$userId.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import { z } from "zod";

import { requireUser } from "~/lib/session.server";
import { getUser, updateUser } from "~/models/user.server";

const UpdateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["user", "admin"]),
});

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireUser(request);

  const user = await getUser(params.userId!);
  if (!user) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ user });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireUser(request);

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const result = UpdateUserSchema.safeParse(data);
  if (!result.success) {
    return json({ errors: result.error.flatten().fieldErrors }, { status: 400 });
  }

  await updateUser(params.userId!, result.data);
  return redirect(`/users/${params.userId}`);
}

export default function UserDetail() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit User</h1>

      <Form method="post" className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input name="name" defaultValue={user.name} className="mt-1 block w-full border rounded px-3 py-2" />
          {actionData?.errors?.name && <p className="text-red-500 text-sm">{actionData.errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={user.email}
            className="mt-1 block w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Role</label>
          <select name="role" defaultValue={user.role} className="mt-1 block w-full border rounded px-3 py-2">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Changes
        </button>
      </Form>
    </div>
  );
}
```

```typescript
// app/lib/session.server.ts
import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { getUserById } from "~/models/user.server";

const sessionSecret = process.env.SESSION_SECRET!;

const storage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function getUserId(request: Request) {
  const session = await getSession(request);
  return session.get("userId");
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (!userId) return null;
  return getUserById(userId);
}

export async function requireUser(request: Request) {
  const user = await getUser(request);
  if (!user) {
    throw redirect("/login");
  }
  return user;
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);
  return redirect("/", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
    },
  });
}
```

## Best Practices

- Use loader/action for data fetching and mutations
- Implement nested routes for layouts
- Use `.server.ts` suffix for server-only code
- Handle errors with ErrorBoundary
- Use optimistic UI with useNavigation
- Validate with Zod on both client and server
- Use Prisma for database access
