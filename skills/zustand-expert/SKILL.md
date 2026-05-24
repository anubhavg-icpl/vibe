---
name: zustand-expert
description: Expert in Zustand state management with TypeScript, middleware, devtools, and best practices for React applications
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: frontend
  tags: [zustand, state-management, react, typescript, frontend]
---

# Zustand Expert Mode

## Overview

You are an expert Zustand state management specialist with deep knowledge of store design, TypeScript integration, middleware, devtools, selectors, persistence, and performance optimization.

## Core Principles

1. **Simple API** - Use Zustand's minimal boilerplate
2. **Type Safety** - Full TypeScript support
3. **Performance** - No unnecessary re-renders
4. **Composition** - Compose stores from smaller slices
5. **Persistence** - Built-in localStorage/sessionStorage support
6. **DevTools** - Enable debugging and time travel

## Basic Store

### Simple Counter

```typescript
import create from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

// In component
const { count, increment, decrement } = useCounterStore();
```

### Complex Store with Selectors

```typescript
import create from "zustand";
import { devtools } from "zustand/middleware";

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
}

const useUserStore = create<UserState>()(
  devtools("user-store", (set, get) => ({
    users: [],
    loading: false,
    error: null,

    fetchUsers: async () => {
      set({ loading: true, error: null });

      try {
        const response = await api.getUsers();
        set({ users: response.data, loading: false });
      } catch (error) {
        set({ error: (error as Error).message, loading: false });
      }
    },

    addUser: (user) => set((state) => ({ users: [...state.users, user] })),

    updateUser: (id, updates) =>
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
      })),

    // Selector functions
    getUsersById: (id: string) => {
      return get().users.find((u) => u.id === id);
    },

    getUserByEmail: (email: string) => {
      return get().users.find((u) => u.email === email);
    },
  })),
);
```

## Middleware

### DevTools

```typescript
import create from "zustand";
import { devtools } from "zustand/middleware";

const useStore = create(
  devtools(
    "my-store", // Store name
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }),
  ),
);
```

### Persist Middleware

```typescript
import create from "zustand";
import { persist } from "zustand/middleware";

const useStore = create(
  persist(
    (set) => ({
      user: null as User | null,
      setUser: (user: User) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "user-storage", // Unique key
      getStorage: () => localStorage, // Custom storage
    },
  ),
);
```

### Combine Middleware

```typescript
import create from "zustand";
import { devtools, persist } from "zustand/middleware";

const useStore = create(
  devtools(
    persist(
      (set) => ({
        theme: "light",
        toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      }),
      {
        name: "theme-storage",
      },
    ),
    "theme-store",
  ),
);
```

### Custom Middleware

```typescript
import { StateCreator, StoreMutatorIdentifier } from "zustand";

// Logger middleware
const logger =
  <T>(config: StateCreator<T>) =>
  (set: StoreMutatorIdentifier<T>, get: StoreApi<T>["getState"], api: StoreApi<T>): StateCreator<T> =>
  (set, get, api) =>
    config(
      (...args) => {
        console.log("Applying mutation:", args);
        const result = set(...args);
        console.log("New state:", get());
        return result;
      },
      get,
      api,
    );

const useStore = create(
  logger((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  })),
);
```

## Actions

### Sync Actions

```typescript
interface StoreState {
  count: number;
  increment: () => void;
  add: (value: number) => void;
}

const useStore = create<StoreState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  add: (value) => set((state) => ({ count: state.count + value })),
}));
```

### Async Actions

```typescript
interface StoreState {
  posts: Post[];
  loading: boolean;
  fetchPosts: () => Promise<void>;
  createPost: (post: Partial<Post>) => Promise<void>;
}

const usePostStore = create<StoreState>((set) => ({
  posts: [],
  loading: false,

  fetchPosts: async () => {
    set({ loading: true });

    try {
      const response = await api.getPosts();
      set({ posts: response.data, loading: false });
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      set({ loading: false });
    }
  },

  createPost: async (post) => {
    set({ loading: true });

    try {
      const newPost = await api.createPost(post);
      set((state) => ({ posts: [...state.posts, newPost], loading: false }));
    } catch (error) {
      console.error("Failed to create post:", error);
      set({ loading: false });
    }
  },
}));
```

## Selectors

### Built-in Selectors

```typescript
// In component
const useStore = create<StoreState>((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),

  // Selector function
  doubleCount: () => {
    return get().count * 2;
  },
}));

// Use selector in component
const doubleCount = useStore((state) => state.doubleCount);
```

### useStore Hook with Selector

```typescript
// ✅ Good - Only re-render when selected value changes
const posts = useStore((state) => state.posts);

// ✅ Better - Memoized selector
const postsSorted = useStore((state) => state.posts.sort((a, b) => a.createdAt - b.createdAt));

// ❌ Bad - Re-renders on any state change
const { posts, loading } = useStore();
```

## Store Slices

### Compose Stores

```typescript
// slices/user.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface UserState {
  user: User | null;
  setUser: (user: User) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    "user-store",
  ),
);

// slices/posts.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface PostState {
  posts: Post[];
  setPosts: (posts: Post[]) => void;
}

export const usePostStore = create<PostState>()(
  devtools(
    (set) => ({
      posts: [],
      setPosts: (posts) => set({ posts }),
    }),
    "post-store",
  ),
);

// Compose in main store
import { useUserStore } from "./slices/user";
import { usePostStore } from "./slices/posts";

export const useStore = () => ({
  user: useUserStore(),
  posts: usePostStore(),
});
```

## Best Practices

### DO

- Use TypeScript with strict typing
- Compose stores for better organization
- Use middleware for cross-cutting concerns
- Enable devTools in development
- Select specific values to prevent re-renders
- Use shallow selectors for computed values
- Implement error handling for async actions
- Add loading states for async operations

### DON'T

- Put UI state in Zustand (use React state)
- Create overly complex stores
- Skip type definitions
- Ignore re-render optimization
- Mix concerns in single store
- Skip error handling in async actions
- Use unnecessary state updates

## Anti-patterns

1. **Monolithic Store** - Single store with everything
2. **No Type Safety** - Using `any` for state
3. **Unnecessary Re-renders** - Selecting whole store
4. **No Persistence** - Not persisting user preferences
5. **Missing Selectors** - Computing derived values in components
6. **No Error Handling** - Async actions without try/catch

## Testing

### Test Store

```typescript
import { act } from "@testing-library/react";
import { renderHook, waitFor } from "@testing-library/react";
import { useCounterStore } from "./store";

describe("CounterStore", () => {
  it("initializes with count 0", () => {
    const { result } = renderHook(() => useCounterStore());
    expect(result.current.count).toBe(0);
  });

  it("increments count", async () => {
    const { result } = renderHook(() => useCounterStore());

    act(() => {
      result.current.increment();
    });

    await waitFor(() => {
      expect(result.current.count).toBe(1);
    });
  });
});
```

## Performance

### Shallow Selectors

```typescript
// ✅ Good - Only re-renders when count changes
const count = useStore((state) => state.count);

// ❌ Bad - Re-renders on any state change
const store = useStore();
```

### Computed Values

```typescript
// ✅ Good - Compute in selector
const totalPrice = useStore((state) =>
  state.items.reduce((sum, item) => sum + item.price, 0)
);

// ❌ Bad - Compute in component
const store = useStore();
const totalPrice = store.items.reduce(...);
```

## Resources

- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Zustand Examples](https://github.com/pmndrs/zustand/tree/main/examples)
