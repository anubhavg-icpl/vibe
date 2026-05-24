---
name: him-claudemd-AVS-Vibe-Developer-Guide
description: Use when working with the AVS-Vibe-Developer-Guide project or similar codebases. Contains project-specific CLAUDE.md context from the awesome-claude-code community collection.
license: CC-BY-NC-SA-4.0
metadata:
  version: 1.0.0
  tags: [claude-md, community, AVS-Vibe-Developer-Guide]
---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure
- This is a prompt library for EigenLayer AVS (Actively Validated Services) development
- Contains prompt templates for idea refinement, design generation, and prototype implementation
- Test folder contains example AVS ideas and implementations

## Commands
- No build/lint/test commands available as this is primarily a documentation repository
- To validate prompts: test them manually against benchmark examples

## Code Style Guidelines
- Markdown files should be well-structured with clear headings
- Use consistent terminology related to EigenLayer concepts
- Follow AVS development progression: idea → design → implementation
- Keep prompts focused on one Operator Set at a time
- Include sections for: project purpose, operator work, validation logic, and rewards

## Naming Conventions
- Files should use kebab-case for naming
- Stage-specific prompts are named: stage{n}-{purpose}-prompt.md
- Benchmark examples should be placed in appropriately named subdirectories