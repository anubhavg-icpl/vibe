---
name: google-cpp-style-guide
description: Use when writing, reviewing, or auditing C++ code that must conform to Google's style guide. Use when the brief mentions "Google C++ style", "Google style guide", "clang-format Google", "Google C++ naming", "GSG", or when working on Google-originated open-source projects (Abseil, Chromium, Protocol Buffers, gRPC, TensorFlow).
version: 1.0.0
tags: [cpp, style-guide, google, naming, formatting, smart-pointers, code-review, abseil, chromium]
---

# Google C++ Style Guide

## Overview

Google's C++ Style Guide is a comprehensive set of rules governing how C++ is written across Google's 100M+ line codebase and thousands of engineers. It targets C++20. The guide exists to manage C++ complexity, prevent bugs, and maintain readability at scale.

**Source:** <https://google.github.io/styleguide/cppguide.html>

**Core principles (the "why" behind every rule):**
1. Optimize for the reader, not the writer
2. Be consistent with existing code
3. Avoid surprising or dangerous constructs
4. Be mindful of scale (name collisions, compile times)
5. Style rules must pull their weight

## Formatting

### Indentation and Whitespace

- **Spaces only**, never tabs. Indent **2 spaces** per level.
- **Line length:** 80 characters max.
- **Trailing whitespace:** never.
- Open braces get a space before them: `void f() {` not `void f(){`
- No space inside parentheses for conditions/loops: `if (x) {`
- Spaces around binary operators: `x = y + z`
- No space after unary operators: `x = -5;` `++i;`

### Braces

Always use braces for control flow (K&R / Stroustrup placement):

```cpp
// GOOD
if (condition) {
  DoSomething();
} else {
  DoOther();
}

// BAD - no bare single-line bodies without braces in Google style
if (condition)
  DoSomething();
```

Function definitions: opening brace on its own line. All other braces (class, function body, control flow): opening brace at end of preceding line.

### Include Order

In `dir/foo.cc`, order includes as:

1. **Related header** (`dir2/foo2.h`) -- with quotes
2. Blank line
3. **C system headers** (`<unistd.h>`, `<sys/types.h>`)
4. Blank line
5. **C++ standard library headers** (`<string>`, `<vector>`)
6. Blank line
7. **Other libraries' headers**
8. Blank line
9. **Your project's headers**

Alphabetize within each group. Use angle brackets for standard/system; quotes for project headers.

## Naming Conventions

| Entity | Convention | Example |
|--------|-----------|---------|
| Classes, structs, type aliases, concepts | `PascalCase` | `UrlTable`, `HttpRequest` |
| Functions (free and member) | `PascalCase` | `AddTableEntry()`, `DeleteUrl()` |
| Variables (local, parameters) | `snake_case` | `num_entries`, `table_name` |
| Class member variables | `snake_case_` with trailing underscore | `num_entries_`, `table_name_` |
| Struct member variables | `snake_case` (no trailing underscore) | `num_entries`, `url` |
| Constants (`constexpr`, `const`) | `kCamelCase` | `kDaysInWeek`, `kMaxBufferSize` |
| Namespaces | `snake_case` | `namespace search_engine {}` |
| Enums | `kCamelCase` for values | `kMaxSize`, `kMinSize` |
| Macros | `UPPER_SNAKE_CASE` | `FOO_BAR_BAZ_H_` |
| File names | `snake_case` | `my_useful_class.cc`, `my_useful_class.h` |

## Header Files

- Every `.cc` file has an associated `.h` file (except unit tests and `main()`-only files).
- Headers must be **self-contained** (compile on their own).
- Use `#define` guards: `<PROJECT>_<PATH>_<FILE>_H_`
- **Include what you use.** Never rely on transitive includes.
- **Avoid forward declarations** -- prefer `#include`. Forward declarations hide dependencies and can silently break when libraries change.
- Define functions inline in headers only if the body is **10 lines or fewer**. Move longer definitions to `.cc` files.
- Use `.inc` extension for non-self-contained include files (rare).

## Namespaces

- Put all code in a namespace. Name based on project/path.
- **Never** use `using namespace foo;` (pollutes scope).
- **Never** declare anything in `namespace std` (undefined behavior).
- Do not use inline namespaces.
- No indentation inside namespaces.
- Close with a comment: `}  // namespace mynamespace`
- Use `internal` sub-namespaces for non-public API details.

## Type Deduction (`auto`)

Use `auto` **only when it makes code clearer or safer**:

```cpp
// GOOD: type is obvious from the initializer
auto p = std::make_unique<Widget>();
auto it = map.find(key);

// BAD: type is opaque, reader cannot tell what this is
auto val = my_widget_factory();
auto result = ComputeResult();
```

**Rules:**
- OK when the type is spelled out in the initializer (`make_unique<Foo>()`, `cast<Foo>(x)`)
- OK for iterators and lambda captures where the type is verbose but well-understood
- Never use `auto` just to save keystrokes on an opaque return type
- `auto` is acceptable in range-based for loops: `for (const auto& item : items)`

## Memory Ownership and Smart Pointers

Dynamic allocation must be **limited to the lowest possible scope** (the class that allocated it).

| Smart Pointer | Ownership | When to Use |
|---------------|-----------|-------------|
| `std::unique_ptr` | Exclusive, non-null | Default choice for heap allocation. Expresses unique ownership. |
| `std::shared_ptr` | Shared, reference-counted | Only when ownership is genuinely shared across multiple owners. |
| Raw pointer / reference | Non-owning | For observation/borrowing. Does not imply ownership. |

**Rules:**
- Use `std::unique_ptr` by default for dynamic allocation.
- Use `std::make_unique<T>(...)` rather than `new`.
- **Never** use owning raw pointers. Raw pointers are for non-owning observation only.
- Use `std::shared_ptr` only when ownership truly must be shared. It has overhead and creates cycles.
- Scoped memory (`std::unique_ptr`) is preferred over manual lifetime management.
- Do not use `std::weak_ptr` unless necessary to break `shared_ptr` cycles.

```cpp
// GOOD
class Factory {
 public:
  std::unique_ptr<Widget> CreateWidget() {
    return std::make_unique<Widget>(config_);
  }
 private:
  Config config_;
};

// BAD: raw owning pointer, no clear ownership
Widget* CreateWidget() {
  return new Widget();  // Who deletes this?
}
```

## Error Handling: No Exceptions

Google **does not use C++ exceptions**.

**Why:** Exceptions make control flow unpredictable. A deeply nested function throwing means every function in the call chain must be exception-safe, requiring developers to hold unreasonable amounts of context in their heads.

**Instead, use:**
- Return codes (`absl::Status`, `absl::StatusOr<T>`)
- `ABSL_CHECK` / `ABSL_DCHECK` for assertions (crash on failure)
- `absl::StatusOr<T>` for fallible operations that return a value

```cpp
// GOOD
absl::StatusOr<Widget> CreateWidget(const Config& cfg) {
  if (!cfg.IsValid()) {
    return absl::InvalidArgumentError("bad config");
  }
  return Widget(cfg);
}

// BAD: exceptions
Widget CreateWidget(const Config& cfg) {
  if (!cfg.IsValid()) {
    throw std::invalid_argument("bad config");  // Not allowed
  }
  return Widget(cfg);
}
```

## Inheritance: Interface + Composition

### Multiple Inheritance

Multiple inheritance is **strongly restricted**:

- **Allowed:** Interface inheritance -- inheriting from purely abstract classes (no data members, only pure virtual methods).
- **Restricted:** Implementation inheritance -- inheriting from a class with actual data or method implementations. Use composition instead.
- **Forbidden:** Diamond inheritance patterns without `virtual` inheritance.

### The Diamond Problem

```
     Person
    /      \
 Mother    Father
    \      /
     Child    // Person constructed TWICE, ambiguous method resolution
```

**Solution:** Prefer composition over implementation inheritance.

```cpp
// GOOD: composition
class Car {
  Engine engine_;  // HAS-A, not IS-A
  SteeringWheel wheel_;
};

// BAD: implementation inheritance where composition suffices
class Car : public Engine, public SteeringWheel {  // Why IS-A engine?
};
```

### Rules

- Only inherit from abstract interfaces (no data, pure virtuals).
- Use `override` (not `virtual`) on overriding methods in derived classes.
- Make base class destructors `public` and `virtual`, or `protected` and non-virtual.
- Prefer composition for code reuse.

## Scoping and Data Hiding

- Declare variables at **minimum scope** (inside loops, inside `if` blocks).
- Do not use global variables. Use namespaces and static data inside classes.
- Non-member functions should go in a namespace, never at global scope.
- Class sections in order: `public:` then `protected:` then `private:`.
- Declaration order within a class: types/enums, constants, constructors, methods, data members.

## Casting

- Prefer C++ casts over C-style casts.
- Use `absl::implicit_cast` for safe upcasts and implicit conversions.
- Use `static_cast` for explicit type conversions between related types.
- Use `const_cast` only when interfacing with const-incorrect APIs.
- **Never** use `reinterpret_cast` or C-style casts in normal code.

## Functions

- Short functions are better. If a function exceeds ~40 lines, consider splitting.
- Nonmember functions in a namespace > static member functions > global functions.
- Default arguments are allowed, but virtual functions cannot have default arguments.
- Function overloading is allowed, but avoid ambiguous overloads.

## Classes and Structs

- Use `struct` for passive data-only types (no invariants). Use `class` for types with invariants.
- Explicitly declare copy/move constructors and assignment operators, or `= delete` them.
- Use `explicit` on single-argument constructors to prevent implicit conversions.
- Only use `struct` vs `class` to distinguish passive data from invariant-holding types -- they are otherwise identical in C++.

## Other Key Rules

### `const` Correctness
- Use `const` aggressively: variables, parameters, return types, member functions.
- Prefer `const T&` for input parameters.
- Mark member functions `const` if they don't modify observable state.

### `constexpr`
- Use `constexpr` for compile-time constants and functions where possible.
- Prefer `constexpr` variables over macros for constants.

### Static and Thread-Local Objects
- Avoid non-const static and thread-local objects with non-trivial constructors.
- Use `absl::ConstInit` for static constants.

### RTTI
- Avoid `dynamic_cast` and `typeid`. Use virtual methods and design patterns instead.

### Lambdas
- Prefer lambdas over named functors for short call-site logic.
- Use `auto` for lambda types.
- Keep lambdas short. If exceeding ~10 lines, use a named function.

### C++20 Features
- Target C++20, do not use C++23 features.
- Use `std::span`, `std::string_view`, `std::optional`, `std::variant` where appropriate.
- Use designated initializers, structured bindings, `if constexpr`.

## Quick Reference Checklist

When writing or reviewing Google-style C++ code, verify:

- [ ] Spaces only, 2-space indent, 80-char line limit
- [ ] Includes in correct order (related header first, then C, C++, other, project)
- [ ] `#define` header guards present and correct
- [ ] Naming: `PascalCase` types/functions, `snake_case_` members, `kCamelCase` constants
- [ ] `auto` only where type is obvious
- [ ] Smart pointers for ownership, raw pointers for observation only
- [ ] No exceptions -- use `absl::Status` / `absl::StatusOr`
- [ ] Interface inheritance only, prefer composition over implementation inheritance
- [ ] No diamond inheritance
- [ ] `const` everywhere possible
- [ ] `explicit` on single-argument constructors
- [ ] `override` on overriding methods
- [ ] Functions under ~40 lines
- [ ] Minimum-scope variable declarations
- [ ] No `using namespace` directives
- [ ] Namespaces wrap all code, no indentation inside

## Enforcement

```bash
# clang-format with Google style
clang-format -style=Google file.cc

# clang-tidy with Google checks
clang-tidy -checks='google-*' file.cc -- -std=c++20

# cpplint (Google's own linter)
cpplint.py file.cc
```

## Sources

- Google C++ Style Guide: <https://google.github.io/styleguide/cppguide.html>
- Google C++ Style Guide (GitHub): <https://github.com/google/styleguide>
- Abseil Library: <https://abseil.io>
