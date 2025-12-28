# Contributing to Vibe

Thank you for your interest in contributing to Vibe! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Adding a New Mode](#adding-a-new-mode)
- [Adding a New Rule](#adding-a-new-rule)
- [Documentation Guidelines](#documentation-guidelines)
- [Pull Request Process](#pull-request-process)
- [Style Guide](#style-guide)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

## How to Contribute

### Reporting Issues

- Use GitHub Issues to report bugs or suggest enhancements
- Check existing issues before creating a new one
- Provide clear descriptions and steps to reproduce (if applicable)

### Types of Contributions

1. **New Modes** - Add specialized AI chat modes
2. **New Rules** - Add universal rules for the rules engine
3. **Documentation** - Improve or fix documentation
4. **Bug Fixes** - Fix issues in existing modes or rules
5. **Enhancements** - Improve existing modes with better prompts or examples

## Adding a New Mode

### 1. Choose the Right Category

Place your mode in the appropriate category under `/modes/`:

| Category | Description |
|----------|-------------|
| `development/` | General development and coding modes |
| `architecture/` | System design and architecture modes |
| `analysis/` | Code analysis and review modes |
| `cloud/` | Cloud platform-specific modes (AWS, GCP, Azure) |
| `databases/` | Database-specific modes |
| `mobile/` | Mobile development modes |
| `games/` | Game development modes |
| `design/` | UI/UX design modes |
| `testing/` | QA and testing modes |
| `coding-standards/` | Language-specific coding standards |
| `project-structure/` | Project scaffolding templates |
| `personalities/` | Character-based AI personas |

### 2. File Structure

Create a new markdown file with this structure:

```markdown
---
name: Mode Name
version: "1.0"
category: category-name
description: Brief description of the mode
author: Your Name
tags: [tag1, tag2, tag3]
---

# Mode Name

## Overview

Brief explanation of what this mode does.

## Core Principles

- Principle 1
- Principle 2
- Principle 3

## Behavior Guidelines

Detailed instructions for how the AI should behave.

## Examples

### Example 1
[Provide concrete examples]

## Anti-patterns

- What NOT to do
```

### 3. Naming Conventions

- Use kebab-case for file names: `my-new-mode.md`
- Be descriptive but concise
- Avoid generic names like `helper-mode.md`

## Adding a New Rule

Rules go in `.ai/rules/` and follow this structure:

```markdown
---
name: Rule Name
version: "1.0"
category: core|workflow|security|language
applies_to: [claude, copilot, cursor, etc.]
---

# Rule Name

## Purpose

Why this rule exists.

## Requirements

- [ ] Requirement 1
- [ ] Requirement 2

## Examples

### Good
\`\`\`
Example of correct behavior
\`\`\`

### Bad
\`\`\`
Example of incorrect behavior
\`\`\`
```

## Documentation Guidelines

### Writing Style

- Use clear, concise language
- Write in present tense
- Use active voice
- Include practical examples
- Avoid jargon without explanation

### Markdown Standards

- Use ATX-style headers (`#`, `##`, `###`)
- Use fenced code blocks with language identifiers
- Use tables for structured data
- Include alt text for any images

### YAML Frontmatter

All mode and rule files must include YAML frontmatter with:
- `name` (required)
- `version` (required)
- `category` (required)
- `description` (required)
- `author` (required for new contributions)
- `tags` (recommended)

## Pull Request Process

### Before Submitting

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the style guide
4. **Test** your changes locally
5. **Update documentation** if needed

### Submission Checklist

- [ ] Mode/rule file has proper YAML frontmatter
- [ ] File is in the correct category directory
- [ ] Content is well-formatted markdown
- [ ] No spelling or grammar errors
- [ ] Examples are provided where applicable
- [ ] Category README is updated (if applicable)

### PR Description Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] New mode
- [ ] New rule
- [ ] Documentation update
- [ ] Bug fix
- [ ] Enhancement

## Checklist
- [ ] I have read the contributing guidelines
- [ ] My changes follow the style guide
- [ ] I have updated relevant documentation
```

### Review Process

1. Submit your PR against `main`
2. Maintainers will review within 3-5 business days
3. Address any feedback or requested changes
4. Once approved, your PR will be merged

## Style Guide

### Mode Content Guidelines

1. **Be Specific** - Vague instructions lead to inconsistent AI behavior
2. **Include Examples** - Show don't just tell
3. **Define Boundaries** - What should the AI NOT do
4. **Consider Edge Cases** - How should unusual situations be handled
5. **Test Your Mode** - Actually use it before submitting

### Rule Content Guidelines

1. **Actionable** - Rules must be clearly enforceable
2. **Measurable** - Success/failure should be obvious
3. **Platform-Agnostic** - Unless specifically for one platform
4. **Non-Conflicting** - Don't contradict existing rules

### Code Examples

When including code examples:
- Use realistic, production-quality code
- Include comments explaining key points
- Show both good and bad examples
- Use appropriate language syntax highlighting

## Questions?

If you have questions about contributing, please:
1. Check existing documentation
2. Search closed issues for similar questions
3. Open a new issue with the `question` label

Thank you for helping make Vibe better!
