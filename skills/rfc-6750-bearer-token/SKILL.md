---
name: rfc-6750-bearer-token
description: Implementation guide for OAuth 2.0 Bearer Token Usage with multi-tenancy security
risk: unknown
source: community
kind: mode
category: rfc
tags: [oauth, bearer-token, authorization, http, multi-tenancy]
---

# RFC 6750 - Bearer Token Usage

You are an expert in implementing OAuth 2.0 Bearer Token Usage as defined in RFC 6750. You provide secure token transmission and validation patterns with multi-tenancy support.

## RFC Overview

| Property   | Value                                                     |
| ---------- | --------------------------------------------------------- |
| RFC Number | 6750                                                      |
| Title      | The OAuth 2.0 Authorization Framework: Bearer Token Usage |
| Status     | Proposed Standard                                         |
| Published  | October 2012                                              |
| Requires   | RFC 6749                                                  |

## Token Transmission Methods

### 1. Authorization Header (Recommended)

```http
GET /resource HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Form-Encoded Body Parameter

```http
POST /resource HTTP/1.1
Host: api.example.com
Content-Type: application/x-www-form-urlencoded

access_token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. URI Query Parameter (Not Recommended)

```http
GET /resource?access_token=eyJhbGciOiJSUzI1NiIs... HTTP/1.1
Host: api.example.com
```

## Implementation

### Bearer Token Validation

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Callable
from enum import Enum
import re

class TokenError(Enum):
    INVALID_REQUEST = "invalid_request"
    INVALID_TOKEN = "invalid_token"
    INSUFFICIENT_SCOPE = "insufficient_scope"

@dataclass
class TokenValidationResult:
    valid: bool
    client_id: Optional[str] = None
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    scope: Optional[str] = None
    expires_at: Optional[datetime] = None
    error: Optional[TokenError] = None
    error_description: Optional[str] = None

class BearerTokenValidator:
    """RFC 6750 Bearer Token Validator with multi-tenancy."""

    def __init__(
        self,
        token_store: Callable[[str], Optional[dict]],
        tenant_extractor: Callable[[dict], str],
    ):
        self.token_store = token_store
        self.tenant_extractor = tenant_extractor

    def extract_token(self, request) -> tuple[Optional[str], Optional[TokenError]]:
        """
        Extract bearer token from request.

        RFC 6750 Section 2: Authenticated Requests
        """
        # Try Authorization header first (Section 2.1)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            if self._is_valid_token_format(token):
                return token, None
            return None, TokenError.INVALID_REQUEST

        # Try form body parameter (Section 2.2)
        content_type = request.headers.get("Content-Type", "")
        if "application/x-www-form-urlencoded" in content_type:
            token = request.form.get("access_token")
            if token and self._is_valid_token_format(token):
                return token, None

        # Try query parameter (Section 2.3) - discouraged
        token = request.args.get("access_token")
        if token and self._is_valid_token_format(token):
            return token, None

        return None, TokenError.INVALID_REQUEST

    def validate(
        self,
        token: str,
        required_scope: Optional[str] = None,
        required_tenant: Optional[str] = None,
    ) -> TokenValidationResult:
        """
        Validate bearer token.

        RFC 6750 Section 3: The WWW-Authenticate Response Header Field
        """
        # Look up token
        token_data = self.token_store(token)

        if not token_data:
            return TokenValidationResult(
                valid=False,
                error=TokenError.INVALID_TOKEN,
                error_description="Token not found or expired",
            )

        # Check expiration
        expires_at = token_data.get("expires_at")
        if expires_at and datetime.fromisoformat(expires_at) < datetime.utcnow():
            return TokenValidationResult(
                valid=False,
                error=TokenError.INVALID_TOKEN,
                error_description="Token has expired",
            )

        # Check tenant isolation
        token_tenant = self.tenant_extractor(token_data)
        if required_tenant and token_tenant != required_tenant:
            return TokenValidationResult(
                valid=False,
                error=TokenError.INVALID_TOKEN,
                error_description="Token not valid for this tenant",
            )

        # Check scope
        if required_scope:
            token_scopes = set(token_data.get("scope", "").split())
            required_scopes = set(required_scope.split())
            if not required_scopes.issubset(token_scopes):
                return TokenValidationResult(
                    valid=False,
                    error=TokenError.INSUFFICIENT_SCOPE,
                    error_description=f"Required scope: {required_scope}",
                )

        return TokenValidationResult(
            valid=True,
            client_id=token_data.get("client_id"),
            user_id=token_data.get("user_id"),
            tenant_id=token_tenant,
            scope=token_data.get("scope"),
            expires_at=datetime.fromisoformat(expires_at) if expires_at else None,
        )

    def _is_valid_token_format(self, token: str) -> bool:
        """Validate token format (b64token from RFC 6750)."""
        # b64token = 1*( ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" ) *"="
        pattern = r'^[A-Za-z0-9\-._~+/]+=*$'
        return bool(re.match(pattern, token))
```

### HTTP Response Handling

```python
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.responses import JSONResponse

app = FastAPI()

def bearer_error_response(
    error: TokenError,
    description: Optional[str] = None,
    scope: Optional[str] = None,
) -> Response:
    """
    Generate WWW-Authenticate error response.

    RFC 6750 Section 3: The WWW-Authenticate Response Header Field
    """
    # Determine status code
    status_codes = {
        TokenError.INVALID_REQUEST: 400,
        TokenError.INVALID_TOKEN: 401,
        TokenError.INSUFFICIENT_SCOPE: 403,
    }
    status_code = status_codes.get(error, 401)

    # Build WWW-Authenticate header
    parts = [f'error="{error.value}"']
    if description:
        parts.append(f'error_description="{description}"')
    if scope:
        parts.append(f'scope="{scope}"')

    www_auth = f'Bearer realm="api", {", ".join(parts)}'

    return JSONResponse(
        status_code=status_code,
        content={"error": error.value, "error_description": description},
        headers={"WWW-Authenticate": www_auth},
    )

# Middleware for bearer token validation
@app.middleware("http")
async def validate_bearer_token(request: Request, call_next):
    # Skip auth for public endpoints
    public_paths = ["/health", "/oauth/token", "/.well-known"]
    if any(request.url.path.startswith(p) for p in public_paths):
        return await call_next(request)

    validator = BearerTokenValidator(
        token_store=lambda t: token_db.get(t),
        tenant_extractor=lambda d: d.get("tenant_id"),
    )

    token, error = validator.extract_token(request)

    if error:
        return bearer_error_response(error, "Missing or malformed token")

    # Get required tenant from request
    tenant_id = request.headers.get("X-Tenant-ID")

    result = validator.validate(
        token,
        required_tenant=tenant_id,
    )

    if not result.valid:
        return bearer_error_response(
            result.error,
            result.error_description,
        )

    # Add token info to request state
    request.state.token = result
    return await call_next(request)
```

### Scope-Based Authorization

```python
from functools import wraps
from typing import List

def require_scope(*required_scopes: str):
    """Decorator to require specific scopes."""
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            token_result: TokenValidationResult = request.state.token

            token_scopes = set(token_result.scope.split() if token_result.scope else [])
            required = set(required_scopes)

            if not required.issubset(token_scopes):
                return bearer_error_response(
                    TokenError.INSUFFICIENT_SCOPE,
                    f"Required scopes: {' '.join(required_scopes)}",
                    scope=" ".join(required_scopes),
                )

            return await func(request, *args, **kwargs)
        return wrapper
    return decorator

# Usage
@app.get("/api/users")
@require_scope("users:read")
async def list_users(request: Request):
    return {"users": []}

@app.post("/api/users")
@require_scope("users:write")
async def create_user(request: Request):
    return {"created": True}

@app.delete("/api/users/{user_id}")
@require_scope("users:delete", "admin")
async def delete_user(request: Request, user_id: str):
    return {"deleted": user_id}
```

## Multi-Tenancy Patterns

### Tenant-Scoped Token Validation

```python
class MultiTenantBearerValidator:
    """Bearer token validator with strict tenant isolation."""

    def __init__(self, tenant_token_stores: dict):
        self.tenant_stores = tenant_token_stores

    def validate_for_tenant(
        self,
        token: str,
        tenant_id: str,
        required_scope: Optional[str] = None,
    ) -> TokenValidationResult:
        """Validate token strictly within tenant context."""

        # Get tenant-specific store
        store = self.tenant_stores.get(tenant_id)
        if not store:
            return TokenValidationResult(
                valid=False,
                error=TokenError.INVALID_TOKEN,
                error_description="Unknown tenant",
            )

        # Look up token in tenant store only
        token_data = store.get(token)
        if not token_data:
            return TokenValidationResult(
                valid=False,
                error=TokenError.INVALID_TOKEN,
                error_description="Token not found",
            )

        # Double-check tenant matches (defense in depth)
        if token_data.get("tenant_id") != tenant_id:
            return TokenValidationResult(
                valid=False,
                error=TokenError.INVALID_TOKEN,
                error_description="Token tenant mismatch",
            )

        # Validate expiration and scope...
        return self._validate_token_data(token_data, required_scope)
```

### Token Binding to Tenant

```python
import jwt
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa

class TenantBoundTokenIssuer:
    """Issue tokens bound to specific tenants."""

    def __init__(self, signing_key: rsa.RSAPrivateKey):
        self.signing_key = signing_key

    def issue_token(
        self,
        client_id: str,
        user_id: str,
        tenant_id: str,
        scope: str,
        expires_in: int = 3600,
    ) -> str:
        """Issue JWT bound to tenant."""

        now = datetime.utcnow()
        claims = {
            "iss": f"https://{tenant_id}.auth.example.com",
            "sub": user_id,
            "aud": f"https://{tenant_id}.api.example.com",
            "client_id": client_id,
            "tenant_id": tenant_id,
            "scope": scope,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
            "jti": secrets.token_urlsafe(16),
        }

        return jwt.encode(claims, self.signing_key, algorithm="RS256")

    def validate_token(
        self,
        token: str,
        expected_tenant: str,
        public_key: rsa.RSAPublicKey,
    ) -> TokenValidationResult:
        """Validate JWT with tenant verification."""

        try:
            claims = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=f"https://{expected_tenant}.api.example.com",
                issuer=f"https://{expected_tenant}.auth.example.com",
            )

            # Additional tenant validation
            if claims.get("tenant_id") != expected_tenant:
                return TokenValidationResult(
                    valid=False,
                    error=TokenError.INVALID_TOKEN,
                    error_description="Token not valid for this tenant",
                )

            return TokenValidationResult(
                valid=True,
                client_id=claims.get("client_id"),
                user_id=claims.get("sub"),
                tenant_id=claims.get("tenant_id"),
                scope=claims.get("scope"),
                expires_at=datetime.fromtimestamp(claims.get("exp")),
            )

        except jwt.ExpiredSignatureError:
            return TokenValidationResult(
                valid=False,
                error=TokenError.INVALID_TOKEN,
                error_description="Token has expired",
            )
        except jwt.InvalidTokenError as e:
            return TokenValidationResult(
                valid=False,
                error=TokenError.INVALID_TOKEN,
                error_description=str(e),
            )
```

## Security Considerations

### From RFC 6750 Section 5

1. **TLS Required** - Always use HTTPS
2. **Don't Store in Cookies** - Avoid CSRF attacks
3. **Don't Pass in URI** - Tokens in logs/history
4. **Token Entropy** - Use sufficient randomness
5. **Token Lifetime** - Keep access tokens short-lived

### Security Implementation

```python
class SecureBearerTokenConfig:
    """Security configuration for bearer tokens."""

    # Token lifetime
    ACCESS_TOKEN_LIFETIME = 3600  # 1 hour max
    REFRESH_TOKEN_LIFETIME = 86400 * 30  # 30 days

    # Token entropy
    TOKEN_BYTES = 32  # 256 bits

    # Required headers
    REQUIRE_TLS = True
    REQUIRE_AUTHORIZATION_HEADER = True

    @staticmethod
    def validate_request_security(request) -> bool:
        """Validate request meets security requirements."""
        # Require TLS
        if SecureBearerTokenConfig.REQUIRE_TLS:
            if request.url.scheme != "https":
                return False

        # Reject tokens in query string
        if "access_token" in request.query_params:
            return False

        return True
```

## Related RFCs

| RFC      | Title         | Relationship              |
| -------- | ------------- | ------------------------- |
| RFC 6749 | OAuth 2.0     | Base framework            |
| RFC 9449 | DPoP          | Sender-constrained tokens |
| RFC 8705 | mTLS          | Certificate-bound tokens  |
| RFC 7662 | Introspection | Token validation          |

## Output Format

Provide:

- Bearer token validation implementations
- HTTP header handling
- Multi-tenant token binding
- Scope-based authorization
