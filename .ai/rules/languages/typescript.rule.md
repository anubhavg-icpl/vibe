# TypeScript Standards
## Purpose
Enforce TypeScript best practices and type safety standards

## Instructions
- Use strict mode - enable all strict type checking options (ID: STRICT_MODE)
- Prefer interfaces over type aliases for object shapes (ID: PREFER_INTERFACES)
- Use explicit return types for public functions (ID: EXPLICIT_RETURN_TYPES)
- Avoid `any` type - use `unknown` if type is truly unknown (ID: AVOID_ANY)
- Use const assertions and readonly when appropriate (ID: CONST_READONLY)
- Leverage discriminated unions for type-safe state management (ID: DISCRIMINATED_UNIONS)
- Use utility types: Partial, Required, Pick, Omit, etc. (ID: UTILITY_TYPES)
- Prefer type inference for local variables (ID: TYPE_INFERENCE)
- Use enums for fixed sets of related constants (ID: USE_ENUMS)
- Implement proper null/undefined handling with optional chaining and nullish coalescing (ID: NULL_HANDLING)
- Use generics for reusable, type-safe components (ID: USE_GENERICS)
- Configure and follow ESLint and Prettier rules (ID: LINTING)

## Priority
Medium

## Error Handling
- If type errors detected, explain the issue and suggest proper typing
- If tsconfig.json missing or misconfigured, suggest proper configuration
- If using deprecated TypeScript features, recommend modern alternatives
