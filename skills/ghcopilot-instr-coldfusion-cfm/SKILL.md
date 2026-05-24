---
name: ghcopilot-instr-coldfusion-cfm
description: "Use when the user needs guidance on coldfusion-cfm. GitHub Copilot instruction from the awesome-copilot collection."
license: CC-BY-NC-SA-4.0
metadata:
  version: "1.0.0"
  tags: [copilot-instruction, community, coldfusion-cfm]
  applyTo: "**/*.cfm"
  source: "awesome-copilot"
---

# ColdFusion Coding Standards

- Use CFScript where possible for cleaner syntax.
- Avoid using deprecated tags and functions.
- Follow consistent naming conventions for variables and components.
- Use `cfqueryparam` to prevent SQL injection.
- Escape CSS hash symbols inside <cfoutput> blocks using ##
- When using HTMX inside <cfoutput> blocks, escape hash symbols (#) by using double hashes (##) to prevent unintended variable interpolation.
- If you are in a HTMX target file then make sure the top line is: <cfsetting showDebugOutput = "false">

# Additional Best Practices

- Use `Application.cfc` for application settings and request handling.
- Organize code into reusable CFCs (components) for maintainability.
- Validate and sanitize all user input.
- Use `cftry`/`cfcatch` for error handling and logging.
- Avoid hardcoding credentials or sensitive data in source files.
- Use consistent indentation (2 spaces, as per global standards).
- Comment complex logic and document functions with purpose and parameters.
- Prefer `cfinclude` for shared templates, but avoid circular includes.

- Use ternary operators where possible
- Ensure consistent tab alignment.
