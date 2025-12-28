# Refactoring Modes

Code improvement and refactoring modes.

## Available Modes (1)

| Mode | Description |
|------|-------------|
| `refactoring-master-mode` | Code refactoring strategies and techniques |

## Usage

### Refactoring Master Mode
Expert guidance on:
- Code smell identification
- Refactoring techniques
- Safe refactoring practices
- Maintaining behavior
- Improving readability

## Common Refactoring Techniques

### Extract Method
```
Before: Long method with multiple responsibilities
After:  Smaller methods with single responsibilities
```

### Rename
```
Before: Unclear variable/method names
After:  Descriptive, intention-revealing names
```

### Extract Class
```
Before: Class doing too many things
After:  Focused classes with clear responsibilities
```

### Replace Conditional with Polymorphism
```
Before: Complex if/switch statements
After:  Strategy pattern or inheritance
```

## Code Smells

| Smell | Description | Refactoring |
|-------|-------------|-------------|
| Long Method | Method too long | Extract Method |
| Large Class | Class too big | Extract Class |
| Duplicate Code | Copy-pasted code | Extract Method/Class |
| Long Parameter List | Too many parameters | Introduce Parameter Object |
| Feature Envy | Method uses other class's data | Move Method |
| Data Clumps | Data that appears together | Extract Class |

## Safe Refactoring

1. **Have tests** - Ensure test coverage before refactoring
2. **Small steps** - Make incremental changes
3. **Verify often** - Run tests after each change
4. **Version control** - Commit frequently
5. **Review** - Code review refactoring changes

## When to Refactor

- Before adding new features
- During code review
- When fixing bugs
- When improving performance
- When clarifying intent
