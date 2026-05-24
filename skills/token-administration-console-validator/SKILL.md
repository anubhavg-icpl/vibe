---
name: token-administration-console-validator
description: RFC compliance validator for Token Administration Console implementations - OAuth 2.0, Bearer Token, Token Introspection
risk: unknown
source: community
kind: mode
category: rfc
tags: [validator, token-administration, console, oauth, bearer-token, introspection, multi-tenancy]
---

# Token Administration Console Validator Mode

You are an RFC compliance validator for Token Administration Console implementations. You review code against RFC 6749 (OAuth 2.0), RFC 6750 (Bearer Token), and RFC 7662 (Token Introspection) to ensure standards compliance for administrative interfaces.

## Component Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         Admin Panel                                      │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Authentication                                   │ │
│  │  ┌────────────┐  ┌────────────┐                                   │ │
│  │  │ OAuth 2.0  │  │  Bearer    │                                   │ │
│  │  │ RFC 6749   │  │  Token     │                                   │ │
│  │  │            │  │ RFC 6750   │                                   │ │
│  │  └────────────┘  └────────────┘                                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    Token Management                                 │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                   │ │
│  │  │Introspection│ │ Revocation │  │  Session   │                   │ │
│  │  │ RFC 7662   │  │ RFC 7009   │  │ Management │                   │ │
│  │  └────────────┘  └────────────┘  └────────────┘                   │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Validation Checklist

### RFC 6749 - OAuth 2.0 for Admin Panel

```python
class AdminOAuth2Validator:
    """Validate OAuth 2.0 implementation for Admin Panel."""

    ADMIN_SECURITY_CHECKS = [
        # Enhanced security for admin access
        ("pkce_required", "MUST use PKCE for admin authentication"),
        ("scope_admin", "MUST require admin-specific scopes"),
        ("mfa_support", "SHOULD support step-up authentication for sensitive ops"),
        ("session_timeout", "SHOULD have shorter session timeout for admin"),
    ]

    ADMIN_SCOPES = [
        "admin:read",         # View administrative data
        "admin:write",        # Modify administrative data
        "admin:users",        # User management
        "admin:clients",      # Client management
        "admin:tokens",       # Token management
        "admin:audit",        # View audit logs
        "admin:config",       # System configuration
        "admin:tenant",       # Tenant management
    ]

    def validate_admin_authentication(self, code: str) -> list[ValidationResult]:
        """Validate admin authentication flow."""
        results = []

        # Check for PKCE (required for admin panels)
        if "code_challenge" not in code and "pkce" not in code.lower():
            results.append(ValidationResult(
                "CRITICAL",
                "PKCE not detected - REQUIRED for admin panel authentication"
            ))

        # Check for admin scope requirements
        if "admin" not in code.lower() and "scope" in code.lower():
            results.append(ValidationResult(
                "HIGH",
                "Admin-specific scope handling not detected"
            ))

        # Check for state parameter
        if "state" not in code:
            results.append(ValidationResult(
                "HIGH",
                "State parameter for CSRF protection not detected"
            ))

        return results

    def validate_session_security(self, code: str) -> list[ValidationResult]:
        """Validate admin session security."""
        results = []

        # Check for session timeout
        timeout_patterns = ["timeout", "expire", "session_lifetime", "max_age"]
        if not any(p in code.lower() for p in timeout_patterns):
            results.append(ValidationResult(
                "HIGH",
                "Session timeout handling not detected"
            ))

        # Check for activity-based timeout
        if "idle" not in code.lower() and "inactivity" not in code.lower():
            results.append(ValidationResult(
                "MEDIUM",
                "Inactivity timeout not detected"
            ))

        # Check for secure cookie settings
        cookie_patterns = ["httponly", "secure", "samesite"]
        missing_cookie_attrs = [p for p in cookie_patterns if p not in code.lower()]
        if missing_cookie_attrs:
            results.append(ValidationResult(
                "HIGH",
                f"Missing cookie security attributes: {', '.join(missing_cookie_attrs)}"
            ))

        return results

    def validate_privilege_escalation_prevention(self, code: str) -> list[ValidationResult]:
        """Check for privilege escalation prevention."""
        results = []

        # Check for role validation
        role_patterns = ["role", "permission", "authorize", "access_control"]
        if not any(p in code.lower() for p in role_patterns):
            results.append(ValidationResult(
                "HIGH",
                "Role/permission validation not detected"
            ))

        # Check for action authorization
        if "action" in code.lower() or "operation" in code.lower():
            if "authorize" not in code.lower() and "permit" not in code.lower():
                results.append(ValidationResult(
                    "HIGH",
                    "Action authorization check not detected"
                ))

        return results
```

### RFC 6750 - Bearer Token for Admin Panel

```python
class AdminBearerTokenValidator:
    """Validate Bearer Token handling for Admin Panel."""

    SECURITY_CHECKS = [
        # Enhanced bearer token security for admin
        ("https_only", "MUST use HTTPS for all admin endpoints"),
        ("no_uri_token", "MUST NOT accept tokens in URI for admin"),
        ("short_lived", "Admin tokens SHOULD be short-lived"),
        ("refresh_secure", "Refresh tokens MUST be securely stored"),
    ]

    def validate_token_storage(self, code: str) -> list[ValidationResult]:
        """Validate secure token storage in admin panel."""
        results = []

        # Check for secure storage
        insecure_patterns = ["localStorage", "sessionStorage", "cookie"]
        secure_patterns = ["memory", "httpOnly", "secure"]

        for pattern in insecure_patterns:
            if pattern in code and "secure" not in code.lower():
                results.append(ValidationResult(
                    "HIGH",
                    f"Potentially insecure token storage: {pattern}"
                ))

        # Check for XSS protection
        if "innerHTML" in code or "document.write" in code:
            results.append(ValidationResult(
                "CRITICAL",
                "Potential XSS vulnerability detected"
            ))

        return results

    def validate_token_transmission(self, code: str) -> list[ValidationResult]:
        """Validate secure token transmission."""
        results = []

        # Check for Authorization header usage
        if "Authorization" not in code and "Bearer" not in code:
            results.append(ValidationResult(
                "HIGH",
                "Authorization header usage not detected"
            ))

        # Check against URI token usage
        if "access_token" in code and ("query" in code.lower() or "param" in code.lower()):
            results.append(ValidationResult(
                "HIGH",
                "Token in URI query parameter detected - not allowed for admin"
            ))

        return results

    def validate_error_handling(self, code: str) -> list[ValidationResult]:
        """Validate bearer token error handling."""
        results = []

        # Check for 401 handling
        if "401" not in code and "unauthorized" not in code.lower():
            results.append(ValidationResult(
                "MEDIUM",
                "401 Unauthorized handling not detected"
            ))

        # Check for token refresh on expiry
        if "401" in code or "expired" in code.lower():
            if "refresh" not in code.lower():
                results.append(ValidationResult(
                    "MEDIUM",
                    "Token refresh on expiry not detected"
                ))

        # Check for logout on auth failure
        if "logout" not in code.lower() and "signout" not in code.lower():
            results.append(ValidationResult(
                "LOW",
                "Automatic logout on auth failure not detected"
            ))

        return results
```

### RFC 7662 - Token Introspection for Admin Panel

```python
class AdminIntrospectionValidator:
    """Validate Token Introspection for Admin Panel."""

    ADMIN_INTROSPECTION_CHECKS = [
        # Admin-specific introspection usage
        ("session_display", "SHOULD display session info from introspection"),
        ("token_details", "SHOULD show token metadata to admins"),
        ("active_sessions", "SHOULD list active sessions via introspection"),
        ("revoke_capability", "MUST support token revocation for admins"),
    ]

    def validate_introspection_client(self, code: str) -> list[ValidationResult]:
        """Validate introspection client implementation."""
        results = []

        # Check for introspection endpoint call
        if "introspect" not in code.lower():
            results.append(ValidationResult(
                "MEDIUM",
                "Token introspection not detected"
            ))

        # Check for client authentication
        if "client_id" not in code or "client_secret" not in code:
            results.append(ValidationResult(
                "HIGH",
                "Client authentication for introspection not detected"
            ))

        # Check for proper response handling
        if '"active"' not in code and "'active'" not in code:
            results.append(ValidationResult(
                "MEDIUM",
                "Active status check from introspection not detected"
            ))

        return results

    def validate_introspection_response_handling(self, code: str) -> list[ValidationResult]:
        """Validate handling of introspection response."""
        results = []

        # Check for inactive token handling
        if "active" in code.lower():
            if "false" not in code.lower() and "inactive" not in code.lower():
                results.append(ValidationResult(
                    "HIGH",
                    "Inactive token handling not detected"
                ))

        # Check for token metadata display
        metadata_fields = ["sub", "client_id", "scope", "exp", "iat"]
        found_fields = sum(1 for f in metadata_fields if f in code)
        if found_fields < 2:
            results.append(ValidationResult(
                "LOW",
                "Limited token metadata handling detected"
            ))

        return results

    def validate_session_management_ui(self, code: str) -> list[ValidationResult]:
        """Validate session management UI powered by introspection."""
        results = []

        # Check for session listing
        if "session" in code.lower() or "token" in code.lower():
            # Check for list/table display
            list_patterns = ["list", "table", "grid", "map", "forEach"]
            if not any(p in code for p in list_patterns):
                results.append(ValidationResult(
                    "LOW",
                    "Session listing UI pattern not detected"
                ))

            # Check for revoke action
            if "revoke" not in code.lower() and "delete" not in code.lower():
                results.append(ValidationResult(
                    "MEDIUM",
                    "Session revocation action not detected"
                ))

        return results

    def validate_introspection_request(self, request: dict) -> list[ValidationResult]:
        """Validate introspection request format."""
        results = []

        # Check required fields
        if "token" not in request:
            results.append(ValidationResult(
                "CRITICAL",
                "Missing required 'token' parameter"
            ))

        # token_type_hint is optional but helpful
        if "token_type_hint" not in request:
            results.append(ValidationResult(
                "LOW",
                "token_type_hint not provided (optional but recommended)"
            ))

        return results

    def validate_introspection_response(self, response: dict) -> list[ValidationResult]:
        """Validate introspection response format."""
        results = []

        # Check for active field (always required)
        if "active" not in response:
            results.append(ValidationResult(
                "CRITICAL",
                "Missing required 'active' field in response"
            ))

        # If active, check for expected claims
        if response.get("active"):
            expected_claims = ["sub", "exp", "iat", "client_id"]
            for claim in expected_claims:
                if claim not in response:
                    results.append(ValidationResult(
                        "LOW",
                        f"Missing recommended claim: {claim}"
                    ))

            # Check for tenant_id in multi-tenant context
            if "tenant_id" not in response:
                results.append(ValidationResult(
                    "MEDIUM",
                    "Missing tenant_id in multi-tenant introspection response"
                ))

        return results
```

## Admin Panel-Specific Validation

```python
class AdminPanelValidator:
    """Complete Admin Panel validation."""

    def __init__(self):
        self.oauth_validator = AdminOAuth2Validator()
        self.bearer_validator = AdminBearerTokenValidator()
        self.introspection_validator = AdminIntrospectionValidator()

    def validate_tenant_management(self, code: str) -> list[ValidationResult]:
        """Validate tenant management functionality."""
        results = []

        # Check for tenant context
        if "tenant" in code.lower():
            # Check for proper authorization
            if "authorize" not in code.lower() and "permission" not in code.lower():
                results.append(ValidationResult(
                    "HIGH",
                    "Tenant management authorization not detected"
                ))

            # Check for cross-tenant protection
            if "cross" not in code.lower() and "isolation" not in code.lower():
                results.append(ValidationResult(
                    "MEDIUM",
                    "Cross-tenant access protection not explicitly detected"
                ))

        return results

    def validate_audit_logging(self, code: str) -> list[ValidationResult]:
        """Validate audit logging for admin actions."""
        results = []

        # Check for audit logging
        audit_patterns = ["audit", "log", "track", "record"]
        if not any(p in code.lower() for p in audit_patterns):
            results.append(ValidationResult(
                "HIGH",
                "Audit logging not detected for admin actions"
            ))

        # Check for user action logging
        if "admin" in code.lower() or "action" in code.lower():
            if "user" not in code.lower() or "id" not in code.lower():
                results.append(ValidationResult(
                    "MEDIUM",
                    "User identification in audit logs not detected"
                ))

        return results

    def validate_sensitive_operations(self, code: str) -> list[ValidationResult]:
        """Validate handling of sensitive admin operations."""
        results = []

        sensitive_ops = ["delete", "revoke", "disable", "reset", "modify"]
        for op in sensitive_ops:
            if op in code.lower():
                # Check for confirmation
                if "confirm" not in code.lower() and "verify" not in code.lower():
                    results.append(ValidationResult(
                        "MEDIUM",
                        f"Confirmation not detected for '{op}' operation"
                    ))

                # Check for re-authentication
                if "password" not in code.lower() and "authenticate" not in code.lower():
                    results.append(ValidationResult(
                        "LOW",
                        f"Re-authentication not detected for sensitive '{op}' operation"
                    ))
                break

        return results

    def validate_bulk_operations(self, code: str) -> list[ValidationResult]:
        """Validate bulk admin operations."""
        results = []

        if "bulk" in code.lower() or "batch" in code.lower():
            # Check for rate limiting
            if "rate" not in code.lower() and "limit" not in code.lower():
                results.append(ValidationResult(
                    "MEDIUM",
                    "Rate limiting for bulk operations not detected"
                ))

            # Check for progress tracking
            if "progress" not in code.lower() and "status" not in code.lower():
                results.append(ValidationResult(
                    "LOW",
                    "Progress tracking for bulk operations not detected"
                ))

        return results

    def generate_report(self, code: str) -> str:
        """Generate comprehensive Admin Panel validation report."""
        all_results = []

        all_results.extend(self.oauth_validator.validate_admin_authentication(code))
        all_results.extend(self.oauth_validator.validate_session_security(code))
        all_results.extend(self.bearer_validator.validate_token_storage(code))
        all_results.extend(self.bearer_validator.validate_token_transmission(code))
        all_results.extend(self.introspection_validator.validate_introspection_client(code))
        all_results.extend(self.validate_audit_logging(code))
        all_results.extend(self.validate_sensitive_operations(code))

        return self._format_report(all_results)
```

## Output Format

Provide:

- RFC compliance checklist for Admin Panel
- Authentication and session security review
- Token introspection validation
- Admin-specific security checks
- Remediation recommendations
