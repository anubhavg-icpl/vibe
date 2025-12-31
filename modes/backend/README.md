# Backend Development Modes

Modern backend runtimes and full-stack frameworks.

## Available Modes (3)

| Mode                  | Description                                         |
| --------------------- | --------------------------------------------------- |
| `bun-runtime-mode`    | Bun runtime for fast JavaScript/TypeScript backends |
| `deno-runtime-mode`   | Deno runtime with built-in TypeScript and security  |
| `trpc-fullstack-mode` | End-to-end typesafe APIs with tRPC                  |

## Usage

### Bun Runtime Mode

Fast JavaScript runtime featuring:

- Native TypeScript support
- Built-in bundler and test runner
- SQLite and file I/O APIs
- npm compatibility
- Hot reloading

### Deno Runtime Mode

Secure runtime with:

- First-class TypeScript support
- Permission-based security model
- Standard library
- Web platform APIs
- Deno Deploy integration

### tRPC Full-Stack Mode

Type-safe API development:

- End-to-end type inference
- React Query integration
- Zod validation
- Subscription support
- Procedure batching

## Recommended Workflow

1. **Choose Runtime**: Select `bun-runtime-mode` or `deno-runtime-mode`
2. **Build APIs**: Use `trpc-fullstack-mode` for type-safe endpoints
3. **Deploy**: Follow runtime-specific deployment guides

## Comparison

| Feature     | Bun      | Deno      |
| ----------- | -------- | --------- |
| Speed       | Fastest  | Fast      |
| TypeScript  | Native   | Native    |
| npm Support | Full     | Partial   |
| Security    | Standard | Sandboxed |
| Bundler     | Built-in | Built-in  |
