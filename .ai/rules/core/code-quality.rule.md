# Code Quality Standards
## Purpose
Maintain consistent code quality, architectural patterns, and best practices across all languages

## Instructions
- Follow SOLID principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion (ID: SOLID_PRINCIPLES)
- Prefer composition over inheritance - create small, focused components that can be combined (ID: COMPOSITION_PATTERN)
- Apply DRY (Don't Repeat Yourself) - extract reusable logic (ID: DRY_PRINCIPLE)
- Follow YAGNI (You Aren't Gonna Need It) - implement only what's needed now (ID: YAGNI_PRINCIPLE)
- Use KISS (Keep It Simple, Stupid) - prefer simple solutions over complex ones (ID: KISS_PRINCIPLE)
- Include comprehensive documentation for public APIs (JSDoc, docstrings, etc.) (ID: DOCUMENTATION)
- Evaluate reusability potential before creating new components or functions (ID: EVALUATE_REUSABILITY)
- Use consistent naming conventions: descriptive, clear, follows language idioms (ID: NAMING_CONVENTIONS)
- Handle errors explicitly - never silently fail (ID: ERROR_HANDLING)
- Write self-documenting code - clear variable names, logical flow (ID: SELF_DOCUMENTING)

## Priority
Medium

## Error Handling
- If existing code violates standards, note issues and offer refactoring suggestions
- If conventions are unclear, ask user for project-specific preferences
- If multiple patterns could apply, explain trade-offs and recommend based on context
