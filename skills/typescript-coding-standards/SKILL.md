---
name: typescript-coding-standards
description: Production-ready TypeScript coding standards enforcing type safety, modern patterns, and maintainability
risk: unknown
source: community
kind: mode
category: coding-standards
tags: [typescript, javascript, coding-standards, eslint, prettier]
---

# TypeScript Coding Standards Mode

You are a TypeScript code quality expert. Your role is to enforce type-safe patterns, modern ECMAScript features, and production-ready code following industry standards.

## Core Principles

1. **Type Safety** - Leverage TypeScript's type system fully
2. **Explicit Over Implicit** - Avoid `any`, use strict mode
3. **Immutability** - Prefer `const` and readonly
4. **Functional Patterns** - Pure functions, avoid side effects

## Naming Conventions

### Variables and Functions

```typescript
// ✅ camelCase for variables and functions
const userName = "Alice";
let totalCount = 0;

function calculateTotalPrice(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const getUserById = async (userId: string): Promise<User | null> => {
  // ...
};

// ✅ Use descriptive names
const isAuthenticated = true;
const hasPermission = false;
const canAccessResource = checkPermission(user, resource);
```

### Classes, Interfaces, and Types

```typescript
// ✅ PascalCase for classes, interfaces, types, enums
class UserService {}
interface UserRepository {}
type UserId = string;
enum OrderStatus {
  Pending,
  Confirmed,
  Shipped,
}

// ✅ Prefix interfaces with 'I' only when needed for clarity
interface User {} // Preferred
interface IUserRepository {} // When distinguishing from class

// ✅ Type aliases describe what they represent
type CreateUserDTO = {
  name: string;
  email: string;
};

type UserResponse = User & { token: string };
```

### Constants and Enums

```typescript
// ✅ SCREAMING_SNAKE_CASE for true constants
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = "https://api.example.com";
const DEFAULT_TIMEOUT_MS = 30_000;

// ✅ PascalCase for enum members
enum HttpStatus {
  Ok = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
}

// ✅ Const objects for string unions
const OrderStatus = {
  Pending: "pending",
  Confirmed: "confirmed",
  Shipped: "shipped",
} as const;

type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];
```

### File and Module Names

```typescript
// ✅ kebab-case for files
// user-service.ts
// http-client.ts
// order-repository.ts

// ✅ PascalCase for React components
// UserProfile.tsx
// OrderList.tsx

// ✅ index.ts for barrel exports
// src/services/index.ts
export { UserService } from "./user-service";
export { OrderService } from "./order-service";
```

## Type System

### Strict Type Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### Type Annotations

```typescript
// ✅ Explicit return types for exported functions
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ Use const assertions for literal types
const config = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
} as const;

// ✅ Prefer type inference for local variables
const numbers = [1, 2, 3]; // number[]
const user = { name: "Alice", age: 30 }; // inferred

// ❌ Avoid any
function bad(data: any): any {} // Never do this

// ✅ Use unknown for truly unknown types
function parseJson(json: string): unknown {
  return JSON.parse(json);
}

// ✅ Type guards for narrowing
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value && "email" in value;
}
```

### Utility Types

```typescript
// ✅ Use built-in utility types
type ReadonlyUser = Readonly<User>;
type PartialUser = Partial<User>;
type RequiredUser = Required<User>;
type UserKeys = keyof User;
type UserName = Pick<User, "firstName" | "lastName">;
type UserWithoutPassword = Omit<User, "password">;

// ✅ Record for dictionaries
type UserById = Record<string, User>;
type StatusMessage = Record<HttpStatus, string>;

// ✅ Conditional types
type NonNullable<T> = T extends null | undefined ? never : T;
type ArrayElement<T> = T extends (infer E)[] ? E : never;

// ✅ Template literal types
type EventName = `on${Capitalize<string>}`;
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
type Endpoint = `/${string}`;
```

### Discriminated Unions

```typescript
// ✅ Use discriminated unions for type-safe variants
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

function processResult<T>(result: Result<T>): T | null {
  if (result.success) {
    return result.data; // TypeScript knows data exists
  }
  console.error(result.error);
  return null;
}

// ✅ API response types
type ApiResponse<T> = { status: "loading" } | { status: "success"; data: T } | { status: "error"; error: string };

// ✅ Exhaustive switch
function handleResponse<T>(response: ApiResponse<T>): string {
  switch (response.status) {
    case "loading":
      return "Loading...";
    case "success":
      return `Got ${response.data}`;
    case "error":
      return `Error: ${response.error}`;
    default:
      // Exhaustiveness check
      const _exhaustive: never = response;
      throw new Error(`Unhandled case: ${_exhaustive}`);
  }
}
```

### Generics

```typescript
// ✅ Meaningful generic names
function first<T>(items: T[]): T | undefined {
  return items[0];
}

// ✅ Constrained generics
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// ✅ Generic interfaces
interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<boolean>;
}

// ✅ Generic classes
class Result<T, E = Error> {
  private constructor(
    private readonly value: T | null,
    private readonly error: E | null,
  ) {}

  static ok<T>(value: T): Result<T, never> {
    return new Result(value, null);
  }

  static err<E>(error: E): Result<never, E> {
    return new Result(null, error);
  }

  isOk(): this is Result<T, never> {
    return this.error === null;
  }

  unwrap(): T {
    if (this.value === null) {
      throw this.error;
    }
    return this.value;
  }
}
```

## Code Style

### ESLint Configuration

```javascript
// eslint.config.js
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/consistent-type-exports": "error",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
);
```

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### Imports

```typescript
// ✅ Use type imports for types
import type { User, UserRepository } from "./types";
import { UserService } from "./user-service";

// ✅ Group imports
// 1. Built-in modules
import { readFile } from "node:fs/promises";
import path from "node:path";

// 2. External packages
import express from "express";
import { z } from "zod";

// 3. Internal absolute imports
import { config } from "@/config";
import { logger } from "@/lib/logger";

// 4. Relative imports
import type { CreateUserDTO } from "./types";
import { validateUser } from "./validation";

// ✅ Barrel exports (index.ts)
export * from "./user";
export * from "./order";
export type { UserDTO, OrderDTO } from "./types";
```

## Error Handling

### Custom Errors

```typescript
// ✅ Create error hierarchy
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, "NOT_FOUND", 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}
```

### Result Type Pattern

```typescript
// ✅ Use Result for expected errors
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

async function fetchUser(id: string): Promise<Result<User, FetchError>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      return err(new FetchError(response.status, "Failed to fetch user"));
    }
    const data = await response.json();
    return ok(data as User);
  } catch (error) {
    return err(new FetchError(0, "Network error"));
  }
}

// Usage
const result = await fetchUser("123");
if (result.ok) {
  console.log(result.value.name);
} else {
  console.error(result.error.message);
}
```

### Try-Catch Best Practices

```typescript
// ✅ Type-safe error handling
async function processData(data: unknown): Promise<ProcessedData> {
  try {
    const validated = schema.parse(data);
    return await transform(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid data", error.errors[0]?.path.join(".") ?? "unknown");
    }
    if (error instanceof NetworkError) {
      throw new ServiceUnavailableError("External service unavailable");
    }
    // Re-throw unknown errors
    throw error;
  }
}

// ✅ Always handle promise rejections
async function main(): Promise<void> {
  try {
    await bootstrap();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// ✅ Use finally for cleanup
async function withConnection<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  const conn = await createConnection();
  try {
    return await fn(conn);
  } finally {
    await conn.close();
  }
}
```

## Async Programming

### Async/Await

```typescript
// ✅ Always await promises
async function fetchData(url: string): Promise<Data> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpError(response.status);
  }
  return response.json() as Promise<Data>;
}

// ✅ Concurrent operations with Promise.all
async function fetchAllUsers(ids: string[]): Promise<User[]> {
  return Promise.all(ids.map((id) => fetchUser(id)));
}

// ✅ Handle partial failures with Promise.allSettled
async function fetchAllWithResults(ids: string[]): Promise<Map<string, User | Error>> {
  const results = await Promise.allSettled(ids.map((id) => fetchUser(id)));
  const map = new Map<string, User | Error>();

  results.forEach((result, index) => {
    const id = ids[index]!;
    if (result.status === "fulfilled") {
      map.set(id, result.value);
    } else {
      map.set(id, result.reason);
    }
  });

  return map;
}

// ✅ Race with timeout
async function fetchWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError()), timeoutMs);
  });
  return Promise.race([promise, timeout]);
}
```

### Async Iterators

```typescript
// ✅ Async generators for streaming
async function* fetchPages<T>(fetcher: (page: number) => Promise<T[]>): AsyncGenerator<T, void, undefined> {
  let page = 1;
  while (true) {
    const items = await fetcher(page);
    if (items.length === 0) break;
    for (const item of items) {
      yield item;
    }
    page++;
  }
}

// Usage
for await (const item of fetchPages(fetchUsers)) {
  console.log(item);
}
```

## Functions

### Function Design

```typescript
// ✅ Single responsibility
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ✅ Use object parameters for multiple options
interface CreateUserOptions {
  name: string;
  email: string;
  role?: "admin" | "user";
  sendWelcomeEmail?: boolean;
}

function createUser(options: CreateUserOptions): Promise<User> {
  const { name, email, role = "user", sendWelcomeEmail = true } = options;
  // ...
}

// ✅ Overloads for different signatures
function find(predicate: (item: User) => boolean): User | undefined;
function find(id: string): User | undefined;
function find(arg: string | ((item: User) => boolean)): User | undefined {
  if (typeof arg === "string") {
    return users.find((u) => u.id === arg);
  }
  return users.find(arg);
}
```

### Pure Functions

```typescript
// ✅ Prefer pure functions
function addItem<T>(items: readonly T[], item: T): T[] {
  return [...items, item];
}

function updateUser(user: User, updates: Partial<User>): User {
  return { ...user, ...updates };
}

// ✅ Use readonly for immutable parameters
function processItems(items: readonly Item[]): ProcessedItem[] {
  return items.map(transform);
}

// ❌ Avoid mutations
function bad(items: Item[]): void {
  items.push(newItem); // Mutates input!
}
```

## Classes

### Class Design

```typescript
// ✅ Use readonly for immutable properties
class User {
  readonly id: string;
  readonly createdAt: Date;
  private _email: string;

  constructor(id: string, email: string) {
    this.id = id;
    this._email = email;
    this.createdAt = new Date();
  }

  get email(): string {
    return this._email;
  }

  set email(value: string) {
    if (!isValidEmail(value)) {
      throw new ValidationError("Invalid email", "email");
    }
    this._email = value;
  }
}

// ✅ Use private with #
class SecureService {
  #apiKey: string;

  constructor(apiKey: string) {
    this.#apiKey = apiKey;
  }

  async fetch(url: string): Promise<Response> {
    return fetch(url, {
      headers: { Authorization: `Bearer ${this.#apiKey}` },
    });
  }
}

// ✅ Abstract classes for shared behavior
abstract class BaseRepository<T extends { id: string }> {
  abstract findById(id: string): Promise<T | null>;
  abstract save(entity: T): Promise<T>;

  async exists(id: string): Promise<boolean> {
    const entity = await this.findById(id);
    return entity !== null;
  }
}
```

### Dependency Injection

```typescript
// ✅ Inject dependencies through constructor
interface Logger {
  info(message: string): void;
  error(message: string, error?: Error): void;
}

interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly logger: Logger,
  ) {}

  async getUser(id: string): Promise<User> {
    this.logger.info(`Fetching user ${id}`);
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User", id);
    }
    return user;
  }
}

// ✅ Factory for construction
function createUserService(): UserService {
  const repository = new PostgresUserRepository(db);
  const logger = new ConsoleLogger();
  return new UserService(repository, logger);
}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("UserService", () => {
  let service: UserService;
  let mockRepository: MockUserRepository;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };
    service = new UserService(mockRepository, mockLogger);
  });

  describe("getUser", () => {
    it("returns user when found", async () => {
      const expectedUser = { id: "1", name: "Alice", email: "alice@example.com" };
      mockRepository.findById.mockResolvedValue(expectedUser);

      const user = await service.getUser("1");

      expect(user).toEqual(expectedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith("1");
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("throws NotFoundError when user not found", async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getUser("999")).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Type Testing

```typescript
import { expectType, expectError } from "tsd";

// ✅ Test type inference
expectType<string>(user.name);
expectType<number>(calculateTotal(items));

// ✅ Test that invalid code produces errors
expectError(createUser({ name: 123 })); // name should be string
expectError(user.invalidProperty); // Property doesn't exist
```

## Documentation

### TSDoc Comments

````typescript
/**
 * Creates a new user account in the system.
 *
 * @param options - The user creation options
 * @returns The created user with generated ID
 * @throws {@link ValidationError} If the email is invalid
 * @throws {@link DuplicateError} If a user with this email already exists
 *
 * @example
 * ```typescript
 * const user = await createUser({
 *   name: "Alice",
 *   email: "alice@example.com",
 * });
 * console.log(user.id); // "abc123"
 * ```
 */
export async function createUser(options: CreateUserOptions): Promise<User> {
  // Implementation
}

/**
 * A repository for managing user entities.
 *
 * @typeParam T - The entity type, must have an id property
 *
 * @example
 * ```typescript
 * const repo: Repository<User> = new PostgresRepository(db);
 * const user = await repo.findById("123");
 * ```
 */
export interface Repository<T extends { id: string }> {
  /**
   * Finds an entity by its unique identifier.
   *
   * @param id - The entity's unique identifier
   * @returns The entity if found, null otherwise
   */
  findById(id: string): Promise<T | null>;
}
````

## Validation (Zod)

```typescript
import { z } from "zod";

// ✅ Define schemas for validation
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(["admin", "user"]).default("user"),
  createdAt: z.date(),
});

// ✅ Infer types from schemas
type User = z.infer<typeof userSchema>;

// ✅ Validate at boundaries
function parseUser(data: unknown): User {
  return userSchema.parse(data);
}

// ✅ Safe parsing
function tryParseUser(data: unknown): Result<User, z.ZodError> {
  const result = userSchema.safeParse(data);
  if (result.success) {
    return ok(result.data);
  }
  return err(result.error);
}

// ✅ API request validation
const createUserSchema = userSchema.omit({ id: true, createdAt: true });

app.post("/users", async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  const user = await createUser(result.data);
  return res.status(201).json(user);
});
```

## Validation Checklist

```text
□ TypeScript strict mode enabled
□ No any types (use unknown)
□ Explicit return types on exports
□ Type imports used for types
□ Discriminated unions for variants
□ Result type for expected errors
□ Custom error classes with codes
□ Async/await properly used
□ Dependencies injected
□ Pure functions preferred
□ Readonly for immutable data
□ Zod for runtime validation
□ TSDoc for public APIs
□ Tests cover types and behavior
```

## Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [typescript-eslint](https://typescript-eslint.io/)
- [Zod Documentation](https://zod.dev/)
- [Effect-TS](https://effect.website/) (Advanced)
