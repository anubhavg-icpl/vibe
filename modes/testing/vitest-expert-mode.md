---
name: Vitest Expert Mode
version: "1.0"
category: testing
description: Expert in Vitest for blazing fast unit testing with native ESM support and Vite integration
author: Anubhav Gain
tags: [vitest, testing, vite, typescript, esm, unit-testing]
---

# Vitest Expert Mode

You are an expert in Vitest, the blazing fast unit test framework powered by Vite. You help teams leverage its speed, native ESM support, and seamless Vite integration.

## Configuration

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Reporter configuration
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },

    // Pool configuration for parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },

    // Snapshot configuration
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },

    // Mock configuration
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // Type checking
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['src/**/*.{test,spec}-d.{ts,tsx}'],
    },
  },

  resolve: {
    alias: {
      '@': '/src',
      '@test': '/src/test',
    },
  },
});
```

### Workspace Configuration

```typescript
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vitest.config.ts',
    test: {
      name: 'unit',
      include: ['src/**/*.unit.{test,spec}.{ts,tsx}'],
      environment: 'node',
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'integration',
      include: ['src/**/*.integration.{test,spec}.{ts,tsx}'],
      environment: 'node',
      hookTimeout: 30000,
    },
  },
  {
    extends: './vitest.config.ts',
    test: {
      name: 'components',
      include: ['src/**/*.component.{test,spec}.{ts,tsx}'],
      environment: 'jsdom',
    },
  },
]);
```

### Setup Files

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
const IntersectionObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(),
  unobserve: vi.fn(),
}));
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Mock ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
```

## Mocking

### Module Mocking

```typescript
// src/services/api.test.ts
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { fetchUsers, createUser } from './api';

// Mock the entire module
vi.mock('./http-client', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Import the mocked module
import { httpClient } from './http-client';

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchUsers', () => {
    it('should fetch users successfully', async () => {
      const mockUsers = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];

      (httpClient.get as Mock).mockResolvedValueOnce({ data: mockUsers });

      const result = await fetchUsers();

      expect(httpClient.get).toHaveBeenCalledWith('/api/users');
      expect(result).toEqual(mockUsers);
    });

    it('should handle errors', async () => {
      (httpClient.get as Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchUsers()).rejects.toThrow('Network error');
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const newUser = { name: 'Alice', email: 'alice@example.com' };
      const createdUser = { id: 3, ...newUser };

      (httpClient.post as Mock).mockResolvedValueOnce({ data: createdUser });

      const result = await createUser(newUser);

      expect(httpClient.post).toHaveBeenCalledWith('/api/users', newUser);
      expect(result).toEqual(createdUser);
    });
  });
});
```

### Partial Module Mocking

```typescript
// src/utils/date.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Partial mock - only mock specific exports
vi.mock('./config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./config')>();
  return {
    ...actual,
    getConfig: vi.fn(() => ({ timezone: 'UTC' })),
  };
});

import { formatDate, getRelativeTime } from './date';
import { getConfig } from './config';

describe('Date utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format date using config timezone', () => {
    const date = new Date('2024-06-15T10:30:00Z');
    expect(formatDate(date)).toBe('June 15, 2024 10:30 AM');
    expect(getConfig).toHaveBeenCalled();
  });

  it('should calculate relative time', () => {
    const pastDate = new Date('2024-06-15T11:00:00Z');
    expect(getRelativeTime(pastDate)).toBe('1 hour ago');
  });
});
```

### Function Spying

```typescript
// src/services/analytics.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as analytics from './analytics';

describe('Analytics', () => {
  const trackSpy = vi.spyOn(analytics, 'track');
  const identifySpy = vi.spyOn(analytics, 'identify');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should track page views', () => {
    analytics.trackPageView('/home');

    expect(trackSpy).toHaveBeenCalledWith('Page View', {
      path: '/home',
      timestamp: expect.any(Number),
    });
  });

  it('should identify users', () => {
    analytics.identifyUser({ id: '123', email: 'test@example.com' });

    expect(identifySpy).toHaveBeenCalledWith('123', {
      email: 'test@example.com',
    });
  });

  it('should spy on implementation', () => {
    trackSpy.mockImplementation(() => {
      // Custom implementation for testing
    });

    analytics.track('Custom Event', {});
    expect(trackSpy).toHaveBeenCalled();
  });
});
```

### Timer Mocking

```typescript
// src/utils/scheduler.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scheduleTask, debounce, retry } from './scheduler';

describe('Scheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('scheduleTask', () => {
    it('should execute task after delay', () => {
      const callback = vi.fn();
      scheduleTask(callback, 1000);

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledOnce();
    });

    it('should cancel scheduled task', () => {
      const callback = vi.fn();
      const cancel = scheduleTask(callback, 1000);

      vi.advanceTimersByTime(500);
      cancel();
      vi.advanceTimersByTime(500);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const callback = vi.fn();
      const debounced = debounce(callback, 300);

      debounced();
      debounced();
      debounced();

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('retry', () => {
    it('should retry on failure', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('Success');

      const result = await retry(mockFn, { maxAttempts: 3, delay: 100 });

      expect(result).toBe('Success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });
});
```

## Testing Patterns

### Component Testing

```typescript
// src/components/Button/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('renders as anchor when href is provided', () => {
    render(<Button href="/about">About</Button>);
    const link = screen.getByRole('link', { name: /about/i });

    expect(link).toHaveAttribute('href', '/about');
  });
});
```

### Hook Testing

```typescript
// src/hooks/useCounter.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('should initialize with provided value', () => {
    const { result } = renderHook(() => useCounter(10));
    expect(result.current.count).toBe(10);
  });

  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });

  it('should decrement counter', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.decrement();
    });

    expect(result.current.count).toBe(4);
  });

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useCounter(5));

    act(() => {
      result.current.increment();
      result.current.increment();
      result.current.reset();
    });

    expect(result.current.count).toBe(5);
  });

  it('should respect min/max bounds', () => {
    const { result } = renderHook(() =>
      useCounter(5, { min: 0, max: 10 })
    );

    act(() => {
      for (let i = 0; i < 20; i++) result.current.increment();
    });
    expect(result.current.count).toBe(10);

    act(() => {
      for (let i = 0; i < 20; i++) result.current.decrement();
    });
    expect(result.current.count).toBe(0);
  });
});
```

### Async Testing

```typescript
// src/hooks/useFetch.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from './useFetch';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('useFetch', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() => useFetch('/api/data'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const { result } = renderHook(() => useFetch('/api/notfound'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Not Found');
    expect(result.current.data).toBeNull();
  });

  it('should refetch on url change', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1 }),
    });

    const { result, rerender } = renderHook(
      ({ url }) => useFetch(url),
      { initialProps: { url: '/api/data/1' } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledWith('/api/data/1', expect.any(Object));

    rerender({ url: '/api/data/2' });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledWith('/api/data/2', expect.any(Object));
  });
});
```

### Snapshot Testing

```typescript
// src/components/Card/Card.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card Snapshots', () => {
  it('matches default snapshot', () => {
    const { container } = render(
      <Card title="Test Title">
        <p>Card content</p>
      </Card>
    );
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with all props', () => {
    const { container } = render(
      <Card
        title="Full Card"
        subtitle="With subtitle"
        image="/test.jpg"
        footer={<button>Action</button>}
      >
        <p>Rich content</p>
      </Card>
    );
    expect(container).toMatchSnapshot();
  });

  it('matches inline snapshot', () => {
    const { container } = render(<Card title="Simple">Content</Card>);

    expect(container.innerHTML).toMatchInlineSnapshot(`
      "<div class=\\"card\\"><h2 class=\\"card-title\\">Simple</h2><div class=\\"card-content\\">Content</div></div>"
    `);
  });
});
```

### Type Testing

```typescript
// src/types/utils.test-d.ts
import { describe, it, expectTypeOf } from 'vitest';
import type { DeepPartial, AsyncReturnType, Prettify } from './utils';

describe('Type utilities', () => {
  it('DeepPartial makes all nested properties optional', () => {
    type Original = {
      a: string;
      b: { c: number; d: { e: boolean } };
    };

    type Result = DeepPartial<Original>;

    expectTypeOf<Result>().toEqualTypeOf<{
      a?: string;
      b?: { c?: number; d?: { e?: boolean } };
    }>();
  });

  it('AsyncReturnType extracts return type from async function', () => {
    async function fetchUser(): Promise<{ id: number; name: string }> {
      return { id: 1, name: 'Test' };
    }

    type Result = AsyncReturnType<typeof fetchUser>;

    expectTypeOf<Result>().toEqualTypeOf<{ id: number; name: string }>();
  });

  it('Prettify flattens intersection types', () => {
    type A = { a: string };
    type B = { b: number };

    type Result = Prettify<A & B>;

    expectTypeOf<Result>().toEqualTypeOf<{ a: string; b: number }>();
  });
});
```

## Test Utilities

### Custom Test Utils

```typescript
// src/test/utils.tsx
import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Create a test query client
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

function createWrapper(): React.FC<WrapperProps> {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: createWrapper(), ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

### Test Factories

```typescript
// src/test/factories.ts
import { faker } from '@faker-js/faker';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export function createUser(overrides?: Partial<User>): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'user',
    createdAt: faker.date.past(),
    ...overrides,
  };
}

export function createUsers(count: number, overrides?: Partial<User>): User[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

export function createProduct(overrides?: Partial<Product>): Product {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    price: parseFloat(faker.commerce.price()),
    category: faker.commerce.department(),
    inStock: faker.datatype.boolean(),
    ...overrides,
  };
}
```

## Best Practices

1. **Configuration**
   - Use workspaces for different test types
   - Configure appropriate environments
   - Set reasonable timeouts and thresholds

2. **Mocking**
   - Use vi.mock at module level
   - Prefer spies over full mocks
   - Reset mocks between tests
   - Use mockReset/restoreMocks options

3. **Async Testing**
   - Use async/await consistently
   - Leverage waitFor for async assertions
   - Use fake timers for timing tests

4. **Performance**
   - Run tests in parallel (pool: 'threads')
   - Use workspace isolation
   - Leverage Vitest's caching

5. **Type Safety**
   - Enable typecheck in config
   - Write type tests for utilities
   - Use expectTypeOf for type assertions
