# Coding Standards Modes

Production-ready coding standards for modern development stacks. These modes help any LLM enforce consistent, maintainable, and industry-standard code practices.

## Available Modes (12 Total)

| Mode                                                                      | Technology | Key Features                                              |
| ------------------------------------------------------------------------- | ---------- | --------------------------------------------------------- |
| [rust-coding-standards-mode](./rust-coding-standards-mode.md)             | Rust       | Ownership, clippy, idiomatic patterns, error handling     |
| [python-coding-standards-mode](./python-coding-standards-mode.md)         | Python     | PEP 8, type hints, ruff, mypy, async patterns             |
| [typescript-coding-standards-mode](./typescript-coding-standards-mode.md) | TypeScript | Strict types, ESLint, discriminated unions, Zod           |
| [go-coding-standards-mode](./go-coding-standards-mode.md)                 | Go         | golangci-lint, error handling, concurrency, interfaces    |
| [java-coding-standards-mode](./java-coding-standards-mode.md)             | Java       | Records, pattern matching, Optional, Spring patterns      |
| [csharp-coding-standards-mode](./csharp-coding-standards-mode.md)         | C# / .NET  | Nullable refs, async, LINQ, records, primary constructors |
| [swift-coding-standards-mode](./swift-coding-standards-mode.md)           | Swift      | Optionals, actors, async/await, SwiftUI, SwiftLint        |
| [kotlin-coding-standards-mode](./kotlin-coding-standards-mode.md)         | Kotlin     | Null safety, coroutines, Flow, Compose, detekt            |
| [cpp-coding-standards-mode](./cpp-coding-standards-mode.md)               | C/C++      | Smart pointers, RAII, concepts, ranges, clang-tidy        |
| [scala-coding-standards-mode](./scala-coding-standards-mode.md)           | Scala      | FP patterns, Cats Effect, tagless final, scalafmt         |
| [react-coding-standards-mode](./react-coding-standards-mode.md)           | React      | Hooks, composition, accessibility, TanStack Query         |

## What These Modes Do

### 1. Naming Conventions

Enforce consistent naming across:

- Types, classes, interfaces
- Functions, methods, variables
- Constants, enums
- Files, packages, modules

### 2. Code Style

Apply language-specific formatting and linting:

- Formatter configurations (rustfmt, ruff, prettier, gofmt, etc.)
- Linter rules (clippy, ESLint, golangci-lint, detekt, etc.)
- Import organization
- Line length and wrapping

### 3. Type Safety

Leverage type systems fully:

- Strict/null-safe mode configurations
- Type inference vs explicit annotations
- Generic constraints
- Union types and discriminated unions

### 4. Error Handling

Consistent error management:

- Custom exception/error types
- Result/Either patterns
- Error propagation
- Recovery strategies

### 5. Testing

Standard testing patterns:

- Unit test structure
- Mocking strategies
- Property-based testing
- Integration testing

## Quick Reference by Language Category

### Systems Languages

| Language | Key Pattern           | Memory              | Concurrency           |
| -------- | --------------------- | ------------------- | --------------------- |
| **Rust** | Ownership + RAII      | Compile-time safety | async/await, channels |
| **C++**  | RAII + Smart Pointers | Manual with guards  | std::thread, atomics  |
| **Go**   | Error returns         | GC                  | goroutines, channels  |

### JVM Languages

| Language   | Key Pattern           | Null Handling  | Async             |
| ---------- | --------------------- | -------------- | ----------------- |
| **Java**   | Records + Sealed      | Optional       | CompletableFuture |
| **Kotlin** | Data classes + Sealed | Nullable types | Coroutines, Flow  |
| **Scala**  | Case classes + ADTs   | Option         | Cats Effect, ZIO  |

### Dynamic/Scripting

| Language       | Key Pattern | Type Safety  | Async                 |
| -------------- | ----------- | ------------ | --------------------- |
| **Python**     | Type hints  | mypy strict  | asyncio               |
| **TypeScript** | Strict mode | Compile-time | Promises, async/await |

### Apple Platforms

| Language  | Key Pattern          | Null Handling | Async       |
| --------- | -------------------- | ------------- | ----------- |
| **Swift** | Value types + Actors | Optionals     | async/await |

### Frontend

| Framework | Key Pattern         | State          | Testing         |
| --------- | ------------------- | -------------- | --------------- |
| **React** | Hooks + Composition | TanStack Query | Testing Library |

## Common Standards Across Languages

### 1. Immutability First

```
Rust: let vs let mut
Python: dataclasses(frozen=True)
TypeScript: readonly, as const
Java: records, List.of()
Kotlin: val vs var
Scala: case class
```

### 2. Explicit Over Implicit

```
Rust: No implicit conversions
Python: Type hints everywhere
TypeScript: strict: true
Go: Explicit error handling
```

### 3. Fail Fast

```
Rust: panic! on invariant violation
Python: raise early
TypeScript: throw at boundaries
Go: return errors immediately
```

### 4. Composition Over Inheritance

```
Rust: Traits
Python: Protocols
TypeScript: Interfaces
Go: Interfaces
Kotlin: Delegation
```

## Usage Examples

### Code Review

```
"Review this Rust code for idiomatic patterns"
"Check if this Python follows PEP 8 and typing best practices"
"Verify this TypeScript uses strict mode properly"
```

### Writing Code

```
"Write this function following Go error handling conventions"
"Implement this class using Java record patterns"
"Create this React component with proper hooks patterns"
```

### Refactoring

```
"Refactor this to use Kotlin coroutines properly"
"Convert this to use C++ RAII patterns"
"Update this Scala code to use tagless final"
```

## Linter/Formatter Configurations

### Language Tooling Summary

| Language   | Formatter          | Linter        | Type Checker |
| ---------- | ------------------ | ------------- | ------------ |
| Rust       | rustfmt            | clippy        | rustc        |
| Python     | ruff format        | ruff          | mypy         |
| TypeScript | prettier           | ESLint        | tsc          |
| Go         | gofmt              | golangci-lint | go vet       |
| Java       | google-java-format | Checkstyle    | javac        |
| C#         | dotnet format      | StyleCop      | Roslyn       |
| Swift      | swift-format       | SwiftLint     | swiftc       |
| Kotlin     | ktfmt              | detekt        | kotlinc      |
| C++        | clang-format       | clang-tidy    | clang        |
| Scala      | scalafmt           | scalafix      | scalac       |
| React      | prettier           | ESLint        | tsc          |

## Contributing

When adding new coding standards modes:

1. Research official style guides and community conventions
2. Include comprehensive naming conventions
3. Provide formatter/linter configurations
4. Add code examples for each pattern
5. Include validation checklists
6. Reference official documentation

## Sources & References

### Official Style Guides

- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- [PEP 8 - Python Style Guide](https://peps.python.org/pep-0008/)
- [Google TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Effective Go](https://go.dev/doc/effective_go)
- [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)
- [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/)
- [Swift API Design Guidelines](https://swift.org/documentation/api-design-guidelines/)
- [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html)
- [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/)
- [Scala Style Guide](https://docs.scala-lang.org/style/)
- [React Documentation](https://react.dev/)

### Books

- Effective Java (Joshua Bloch)
- Clean Code (Robert Martin)
- The Rust Programming Language
- Effective Modern C++ (Scott Meyers)
- Functional Programming in Scala
