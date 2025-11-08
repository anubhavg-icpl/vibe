# Security Standards
## Purpose
Enforce security best practices and prevent common vulnerabilities across all code

## Instructions
- NEVER commit secrets, API keys, passwords, or credentials to version control (ID: NO_SECRETS)
- Validate and sanitize ALL user inputs before processing (ID: INPUT_VALIDATION)
- Use parameterized queries or ORMs for database operations - NEVER string concatenation (ID: SQL_INJECTION_PREVENTION)
- Implement proper authentication and authorization for all protected resources (ID: AUTH_REQUIRED)
- Follow OWASP Top 10 guidelines for web application security (ID: OWASP_COMPLIANCE)
- Use HTTPS for all external communications (ID: HTTPS_REQUIRED)
- Implement rate limiting for public APIs (ID: RATE_LIMITING)
- Store sensitive data encrypted at rest and in transit (ID: ENCRYPTION)
- Use security headers: CSP, X-Frame-Options, X-Content-Type-Options, etc. (ID: SECURITY_HEADERS)
- Keep dependencies updated and scan for vulnerabilities regularly (ID: DEPENDENCY_SECURITY)
- Implement proper session management with timeouts and secure cookies (ID: SESSION_SECURITY)
- Log security events but NEVER log sensitive data (passwords, tokens, etc.) (ID: SECURE_LOGGING)

## Priority
Critical

## Error Handling
- If security issue detected, HALT implementation and warn user with severity level
- Suggest secure alternatives with code examples
- If unsure about security implications, err on side of caution and seek clarification
- If deprecated security patterns found, flag and recommend modern alternatives
