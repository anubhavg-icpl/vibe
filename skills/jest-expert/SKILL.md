---
name: jest-expert
description: Expert in Jest testing framework for unit tests, integration tests, mocking, and snapshot testing
risk: unknown
source: community
kind: mode
category: testing
tags: [jest, testing, unit-testing, mocking, javascript, typescript]
---

# Jest Expert Mode

You are an expert in Jest, the JavaScript testing framework. You help teams write comprehensive tests with advanced mocking, snapshot testing, and best practices.

## Configuration

### jest.config.ts

```typescript
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/*.test.ts", "**/*.spec.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@tests/(.*)$": "<rootDir>/tests/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/**/index.ts", "!src/**/*.stories.{ts,tsx}"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ["text", "lcov", "html"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  verbose: true,
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
};

export default config;
```

### React Configuration

```typescript
// jest.config.react.ts
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        useESM: true,
      },
    ],
  },
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
};

export default config;
```

### Setup Files

```typescript
// tests/setup.ts
import "@testing-library/jest-dom";

// Global test timeout
jest.setTimeout(10000);

// Mock console.error to catch React warnings
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("Warning: ReactDOM.render is no longer supported")) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
```

## Mocking Patterns

### Module Mocking

```typescript
// __mocks__/axios.ts
const mockAxios = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn(() => mockAxios),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
};

export default mockAxios;
```

```typescript
// tests/services/api.test.ts
import axios from "axios";
import { UserService } from "@/services/user";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("UserService", () => {
  const userService = new UserService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUser", () => {
    it("should fetch user by id", async () => {
      const mockUser = { id: 1, name: "John", email: "john@example.com" };
      mockedAxios.get.mockResolvedValueOnce({ data: mockUser });

      const result = await userService.getUser(1);

      expect(mockedAxios.get).toHaveBeenCalledWith("/api/users/1");
      expect(result).toEqual(mockUser);
    });

    it("should throw error when user not found", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Not found"));

      await expect(userService.getUser(999)).rejects.toThrow("Not found");
    });
  });

  describe("createUser", () => {
    it("should create a new user", async () => {
      const newUser = { name: "Jane", email: "jane@example.com" };
      const createdUser = { id: 2, ...newUser };
      mockedAxios.post.mockResolvedValueOnce({ data: createdUser });

      const result = await userService.createUser(newUser);

      expect(mockedAxios.post).toHaveBeenCalledWith("/api/users", newUser);
      expect(result).toEqual(createdUser);
    });
  });
});
```

### Function Mocking

```typescript
// tests/utils/helpers.test.ts
import * as helpers from "@/utils/helpers";
import { processData } from "@/services/processor";

describe("processData", () => {
  it("should use helper functions", () => {
    const validateSpy = jest.spyOn(helpers, "validate").mockReturnValue(true);
    const transformSpy = jest.spyOn(helpers, "transform").mockReturnValue({ transformed: true });

    const result = processData({ input: "test" });

    expect(validateSpy).toHaveBeenCalledWith({ input: "test" });
    expect(transformSpy).toHaveBeenCalled();
    expect(result).toEqual({ transformed: true });

    validateSpy.mockRestore();
    transformSpy.mockRestore();
  });

  it("should throw when validation fails", () => {
    jest.spyOn(helpers, "validate").mockReturnValue(false);

    expect(() => processData({ input: "invalid" })).toThrow("Validation failed");
  });
});
```

### Timer Mocking

```typescript
// tests/utils/debounce.test.ts
import { debounce, throttle } from "@/utils/timing";

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should delay function execution", () => {
    const callback = jest.fn();
    const debounced = debounce(callback, 1000);

    debounced();
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should reset timer on subsequent calls", () => {
    const callback = jest.fn();
    const debounced = debounce(callback, 1000);

    debounced();
    jest.advanceTimersByTime(500);
    debounced();
    jest.advanceTimersByTime(500);
    debounced();
    jest.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments to callback", () => {
    const callback = jest.fn();
    const debounced = debounce(callback, 100);

    debounced("arg1", "arg2");
    jest.runAllTimers();

    expect(callback).toHaveBeenCalledWith("arg1", "arg2");
  });
});

describe("throttle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should execute immediately on first call", () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 1000);

    throttled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should ignore calls within throttle period", () => {
    const callback = jest.fn();
    const throttled = throttle(callback, 1000);

    throttled();
    throttled();
    throttled();

    expect(callback).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    throttled();

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
```

### Date Mocking

```typescript
// tests/utils/date.test.ts
import { formatRelativeDate, isExpired, getDaysUntil } from "@/utils/date";

describe("Date utilities", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-06-15T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("formatRelativeDate", () => {
    it('should return "today" for current date', () => {
      expect(formatRelativeDate(new Date())).toBe("today");
    });

    it('should return "yesterday" for previous day', () => {
      const yesterday = new Date("2024-06-14T12:00:00Z");
      expect(formatRelativeDate(yesterday)).toBe("yesterday");
    });

    it('should return "X days ago" for past dates', () => {
      const pastDate = new Date("2024-06-10T12:00:00Z");
      expect(formatRelativeDate(pastDate)).toBe("5 days ago");
    });
  });

  describe("isExpired", () => {
    it("should return true for past dates", () => {
      const pastDate = new Date("2024-06-14T12:00:00Z");
      expect(isExpired(pastDate)).toBe(true);
    });

    it("should return false for future dates", () => {
      const futureDate = new Date("2024-06-16T12:00:00Z");
      expect(isExpired(futureDate)).toBe(false);
    });
  });

  describe("getDaysUntil", () => {
    it("should calculate days until future date", () => {
      const futureDate = new Date("2024-06-20T12:00:00Z");
      expect(getDaysUntil(futureDate)).toBe(5);
    });
  });
});
```

## Async Testing

### Promise Testing

```typescript
// tests/services/async.test.ts
import { fetchData, retryFetch } from "@/services/async";

describe("Async operations", () => {
  describe("fetchData", () => {
    it("should resolve with data", async () => {
      const result = await fetchData("users");
      expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ id: expect.any(Number) })]));
    });

    it("should reject with error on failure", async () => {
      await expect(fetchData("invalid")).rejects.toThrow("Resource not found");
    });

    it("should resolve within timeout", async () => {
      const start = Date.now();
      await fetchData("users");
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000);
    });
  });

  describe("retryFetch", () => {
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockFetch = jest.fn();
    });

    it("should succeed on first attempt", async () => {
      mockFetch.mockResolvedValueOnce({ data: "success" });

      const result = await retryFetch(mockFetch, 3);

      expect(result).toEqual({ data: "success" });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Fail 1"))
        .mockRejectedValueOnce(new Error("Fail 2"))
        .mockResolvedValueOnce({ data: "success" });

      const result = await retryFetch(mockFetch, 3);

      expect(result).toEqual({ data: "success" });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should throw after max retries", async () => {
      mockFetch.mockRejectedValue(new Error("Always fails"));

      await expect(retryFetch(mockFetch, 3)).rejects.toThrow("Always fails");
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
```

### Callback Testing

```typescript
// tests/utils/callback.test.ts
import { EventEmitter } from "@/utils/events";

describe("EventEmitter", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  it("should call listener when event is emitted", () => {
    const listener = jest.fn();
    emitter.on("test", listener);

    emitter.emit("test", "arg1", "arg2");

    expect(listener).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("should handle multiple listeners", () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    emitter.on("test", listener1);
    emitter.on("test", listener2);
    emitter.emit("test");

    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
  });

  it("should use done callback for async assertions", (done) => {
    emitter.on("async", (data) => {
      try {
        expect(data).toBe("async data");
        done();
      } catch (error) {
        done(error);
      }
    });

    setTimeout(() => {
      emitter.emit("async", "async data");
    }, 100);
  });

  it("should use waitFor for async events", async () => {
    const listener = jest.fn();
    emitter.on("async", listener);

    setTimeout(() => {
      emitter.emit("async", "data");
    }, 100);

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(listener).toHaveBeenCalledWith("data");
  });
});
```

## Snapshot Testing

### Component Snapshots

```typescript
// tests/components/Button.test.tsx
import { render } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('matches snapshot with default props', () => {
    const { container } = render(<Button>Click me</Button>);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for each variant', () => {
    const variants = ['primary', 'secondary', 'danger', 'ghost'] as const;

    variants.forEach((variant) => {
      const { container } = render(<Button variant={variant}>Button</Button>);
      expect(container).toMatchSnapshot(`Button-${variant}`);
    });
  });

  it('matches snapshot when disabled', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with icon', () => {
    const { container } = render(
      <Button icon={<span>Icon</span>}>With Icon</Button>
    );
    expect(container).toMatchSnapshot();
  });
});
```

### Inline Snapshots

```typescript
// tests/utils/format.test.ts
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

describe("Formatters", () => {
  describe("formatCurrency", () => {
    it("formats USD", () => {
      expect(formatCurrency(1234.56, "USD")).toMatchInlineSnapshot(`"$1,234.56"`);
    });

    it("formats EUR", () => {
      expect(formatCurrency(1234.56, "EUR")).toMatchInlineSnapshot(`"€1,234.56"`);
    });

    it("handles negative values", () => {
      expect(formatCurrency(-500, "USD")).toMatchInlineSnapshot(`"-$500.00"`);
    });
  });

  describe("formatDate", () => {
    it("formats default date", () => {
      const date = new Date("2024-06-15");
      expect(formatDate(date)).toMatchInlineSnapshot(`"June 15, 2024"`);
    });

    it("formats short date", () => {
      const date = new Date("2024-06-15");
      expect(formatDate(date, "short")).toMatchInlineSnapshot(`"6/15/24"`);
    });
  });

  describe("formatNumber", () => {
    it("formats with abbreviations", () => {
      expect(formatNumber(1500)).toMatchInlineSnapshot(`"1.5K"`);
      expect(formatNumber(1500000)).toMatchInlineSnapshot(`"1.5M"`);
      expect(formatNumber(1500000000)).toMatchInlineSnapshot(`"1.5B"`);
    });
  });
});
```

### Serializers

```typescript
// tests/setup/serializers.ts
import { AxiosError } from "axios";

expect.addSnapshotSerializer({
  test: (val) => val instanceof AxiosError,
  serialize: (val: AxiosError) => {
    return `AxiosError: ${val.message} (status: ${val.response?.status})`;
  },
});

expect.addSnapshotSerializer({
  test: (val) => val instanceof Date,
  serialize: (val: Date) => val.toISOString(),
});

// Custom serializer for DOM elements
expect.addSnapshotSerializer({
  test: (val) => val && typeof val.tagName === "string",
  serialize: (val, config, indentation, depth, refs, printer) => {
    const tag = val.tagName.toLowerCase();
    const classes = val.className ? ` class="${val.className}"` : "";
    return `<${tag}${classes}>${val.textContent}</${tag}>`;
  },
});
```

## Test Utilities

### Custom Matchers

```typescript
// tests/matchers/index.ts
import { expect } from "@jest/globals";

interface CustomMatchers<R = unknown> {
  toBeWithinRange(floor: number, ceiling: number): R;
  toBeValidEmail(): R;
  toBeValidUUID(): R;
  toContainObject(expected: object): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },

  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      pass,
      message: () =>
        pass ? `expected ${received} not to be a valid email` : `expected ${received} to be a valid email`,
    };
  },

  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    return {
      pass,
      message: () => (pass ? `expected ${received} not to be a valid UUID` : `expected ${received} to be a valid UUID`),
    };
  },

  toContainObject(received: object[], expected: object) {
    const pass = received.some((item) =>
      Object.entries(expected).every(([key, value]) => (item as Record<string, unknown>)[key] === value),
    );
    return {
      pass,
      message: () =>
        pass
          ? `expected array not to contain object ${JSON.stringify(expected)}`
          : `expected array to contain object ${JSON.stringify(expected)}`,
    };
  },
});
```

### Test Factories

```typescript
// tests/factories/user.ts
import { faker } from "@faker-js/faker";

interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user" | "guest";
  createdAt: Date;
  updatedAt: Date;
}

export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.number.int({ min: 1, max: 10000 }),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: "user",
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

export function createUsers(count: number, overrides: Partial<User> = {}): User[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

export function createAdmin(overrides: Partial<User> = {}): User {
  return createUser({ ...overrides, role: "admin" });
}

// tests/factories/index.ts
export * from "./user";
export * from "./product";
export * from "./order";
```

### Test Helpers

```typescript
// tests/helpers/index.ts
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function expectToThrowAsync(fn: () => Promise<unknown>, expectedError?: string | RegExp): Promise<void> {
  let error: Error | null = null;
  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  expect(error).not.toBeNull();
  if (expectedError) {
    if (typeof expectedError === "string") {
      expect(error?.message).toContain(expectedError);
    } else {
      expect(error?.message).toMatch(expectedError);
    }
  }
}

export function mockEnv(vars: Record<string, string>): () => void {
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...vars };

  return () => {
    process.env = originalEnv;
  };
}

export function createMockResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {},
    config: {},
  };
}
```

## Best Practices

1. **Test Structure**
   - Use AAA pattern (Arrange, Act, Assert)
   - One assertion per test when possible
   - Use descriptive test names
   - Group related tests with describe

2. **Mocking**
   - Only mock what you need
   - Prefer dependency injection
   - Reset mocks between tests
   - Avoid mocking too much

3. **Async Testing**
   - Always await async operations
   - Use fake timers for time-dependent tests
   - Set appropriate timeouts
   - Handle promise rejections

4. **Coverage**
   - Set meaningful thresholds
   - Focus on critical paths
   - Don't chase 100% coverage
   - Test edge cases

5. **Performance**
   - Use beforeAll for expensive setup
   - Parallelize test files
   - Avoid unnecessary setup/teardown
   - Use test.concurrent for independent tests
