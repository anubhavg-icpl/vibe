---
name: rfc-7662-introspection
description: Token validation endpoint for resource servers and admin panels. Use when implementing or validating rfc 7662 introspection protocol compliance.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rfc
  tags: [oauth, introspection, token-validation, admin-panel, multi-tenancy]
---

# RFC 7662 - OAuth 2.0 Token Introspection

You are an expert in implementing OAuth 2.0 Token Introspection as defined in RFC 7662. You enable resource servers and admin panels to validate tokens and retrieve token metadata.

## RFC Overview

| Property   | Value                         |
| ---------- | ----------------------------- |
| RFC Number | 7662                          |
| Title      | OAuth 2.0 Token Introspection |
| Status     | Proposed Standard             |
| Published  | October 2015                  |
| Extends    | RFC 6749                      |

## Introspection Flow

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     Token Introspection Flow                             │
│                                                                          │
│  ┌──────────────┐                           ┌──────────────────────┐   │
│  │              │  1. API Request           │                      │   │
│  │    Client    │  + Access Token           │   Resource Server    │   │
│  │              │─────────────────────────►│                      │   │
│  └──────────────┘                           └──────────┬───────────┘   │
│                                                        │               │
│                                                        │ 2. Introspect │
│                                                        │    Request    │
│                                                        ▼               │
│                                              ┌──────────────────────┐   │
│                                              │                      │   │
│                                              │   Authorization      │   │
│                                              │   Server             │   │
│                                              │                      │   │
│                                              └──────────┬───────────┘   │
│                                                        │               │
│                                                        │ 3. Token Info │
│                                                        │               │
│  ┌──────────────┐                           ┌──────────▼───────────┐   │
│  │              │  4. API Response          │                      │   │
│  │    Client    │◄─────────────────────────│   Resource Server    │   │
│  │              │                           │                      │   │
│  └──────────────┘                           └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Introspection Response

```json
{
  "active": true,
  "sub": "user-123",
  "client_id": "client-abc",
  "username": "john.doe",
  "token_type": "Bearer",
  "exp": 1419356238,
  "iat": 1419350238,
  "nbf": 1419350238,
  "aud": "https://api.example.com",
  "iss": "https://auth.example.com",
  "scope": "read write",
  "tenant_id": "tenant-xyz"
}
```

## Implementation

### Introspection Endpoint

```python
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime
import secrets

@dataclass
class IntrospectionRequest:
    """RFC 7662 Section 2.1: Introspection Request"""
    token: str
    token_type_hint: Optional[str] = None  # "access_token" or "refresh_token"


@dataclass
class IntrospectionResponse:
    """RFC 7662 Section 2.2: Introspection Response"""
    active: bool

    # Optional claims (present only if active=true)
    scope: Optional[str] = None
    client_id: Optional[str] = None
    username: Optional[str] = None
    token_type: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
    nbf: Optional[int] = None
    sub: Optional[str] = None
    aud: Optional[str] = None
    iss: Optional[str] = None
    jti: Optional[str] = None

    # Multi-tenancy
    tenant_id: Optional[str] = None

    # Token binding
    cnf: Optional[dict] = None

    def to_dict(self) -> dict:
        if not self.active:
            return {"active": False}

        d = {"active": True}
        for field in ["scope", "client_id", "username", "token_type",
                      "exp", "iat", "nbf", "sub", "aud", "iss", "jti",
                      "tenant_id", "cnf"]:
            value = getattr(self, field)
            if value is not None:
                d[field] = value
        return d


class TokenIntrospectionService:
    """
    OAuth 2.0 Token Introspection Service.

    RFC 7662: OAuth 2.0 Token Introspection
    """

    def __init__(self, token_store: "TokenStore"):
        self.token_store = token_store

        # Authorized introspection clients
        self.authorized_clients: Dict[str, List[str]] = {}

    def authorize_client(self, client_id: str, client_secret: str, scopes: List[str]):
        """Register client authorized to introspect tokens."""
        self.authorized_clients[client_id] = {
            "secret": client_secret,
            "scopes": scopes,
        }

    def introspect(
        self,
        request: IntrospectionRequest,
        calling_client_id: str,
        calling_client_secret: str,
        calling_tenant_id: str,
    ) -> IntrospectionResponse:
        """
        Introspect a token.

        RFC 7662 Section 2: Introspection Endpoint
        """
        # Authenticate the calling client
        if not self._authenticate_client(calling_client_id, calling_client_secret):
            raise IntrospectionError("invalid_client", "Client authentication failed")

        # Look up the token
        token_data = self._find_token(request.token, request.token_type_hint)

        if not token_data:
            return IntrospectionResponse(active=False)

        # Check if token is expired
        if token_data.get("exp", 0) < datetime.utcnow().timestamp():
            return IntrospectionResponse(active=False)

        # Check if token is revoked
        if token_data.get("revoked", False):
            return IntrospectionResponse(active=False)

        # Tenant isolation check
        token_tenant = token_data.get("tenant_id")
        if token_tenant != calling_tenant_id:
            # Cross-tenant introspection requires special permission
            if not self._can_introspect_cross_tenant(calling_client_id, token_tenant):
                return IntrospectionResponse(active=False)

        # Build response
        return IntrospectionResponse(
            active=True,
            scope=token_data.get("scope"),
            client_id=token_data.get("client_id"),
            username=token_data.get("username"),
            token_type=token_data.get("token_type", "Bearer"),
            exp=token_data.get("exp"),
            iat=token_data.get("iat"),
            nbf=token_data.get("nbf"),
            sub=token_data.get("sub"),
            aud=token_data.get("aud"),
            iss=token_data.get("iss"),
            jti=token_data.get("jti"),
            tenant_id=token_tenant,
            cnf=token_data.get("cnf"),
        )

    def _authenticate_client(self, client_id: str, client_secret: str) -> bool:
        """Authenticate the introspecting client."""
        client = self.authorized_clients.get(client_id)
        if not client:
            return False
        return secrets.compare_digest(client["secret"], client_secret)

    def _find_token(self, token: str, type_hint: Optional[str]) -> Optional[dict]:
        """Find token in store."""
        # Try the hinted type first
        if type_hint == "access_token":
            result = self.token_store.get_access_token(token)
            if result:
                return result
        elif type_hint == "refresh_token":
            result = self.token_store.get_refresh_token(token)
            if result:
                return result

        # Try both types
        result = self.token_store.get_access_token(token)
        if result:
            return result

        return self.token_store.get_refresh_token(token)

    def _can_introspect_cross_tenant(self, client_id: str, token_tenant: str) -> bool:
        """Check if client can introspect tokens from another tenant."""
        # Admin clients may have cross-tenant permissions
        client = self.authorized_clients.get(client_id, {})
        return "introspect:cross-tenant" in client.get("scopes", [])


class IntrospectionError(Exception):
    def __init__(self, error: str, description: str):
        self.error = error
        self.description = description
```

### FastAPI Introspection Endpoint

```python
from fastapi import FastAPI, Form, Depends, HTTPException, Header
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import base64

app = FastAPI()
security = HTTPBasic()

introspection_service = TokenIntrospectionService(token_store)

@app.post("/oauth/introspect")
async def introspect_token(
    token: str = Form(...),
    token_type_hint: Optional[str] = Form(None),
    credentials: HTTPBasicCredentials = Depends(security),
    x_tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    """
    Token Introspection Endpoint.

    RFC 7662 Section 2: Introspection Endpoint

    Returns token metadata if active, otherwise {"active": false}.
    """
    request = IntrospectionRequest(
        token=token,
        token_type_hint=token_type_hint,
    )

    try:
        response = introspection_service.introspect(
            request=request,
            calling_client_id=credentials.username,
            calling_client_secret=credentials.password,
            calling_tenant_id=x_tenant_id,
        )
        return response.to_dict()
    except IntrospectionError as e:
        raise HTTPException(401, {
            "error": e.error,
            "error_description": e.description,
        })
```

### Admin Panel Integration

```python
class AdminPanelTokenService:
    """
    Token management for Admin Panel.

    Uses RFC 7662 introspection for token validation
    and RFC 7009 revocation for token management.
    """

    def __init__(
        self,
        introspection_endpoint: str,
        client_id: str,
        client_secret: str,
    ):
        self.introspection_endpoint = introspection_endpoint
        self.client_id = client_id
        self.client_secret = client_secret

    async def get_token_details(
        self,
        token: str,
        tenant_id: str,
    ) -> dict:
        """
        Get detailed token information for admin display.
        """
        import httpx

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.introspection_endpoint,
                data={
                    "token": token,
                    "token_type_hint": "access_token",
                },
                auth=(self.client_id, self.client_secret),
                headers={"X-Tenant-ID": tenant_id},
            )

        if response.status_code != 200:
            raise AdminTokenError("Failed to introspect token")

        data = response.json()

        if not data.get("active"):
            return {"status": "inactive", "active": False}

        # Enrich with additional admin info
        return {
            "status": "active",
            "active": True,
            "subject": data.get("sub"),
            "client": data.get("client_id"),
            "scope": data.get("scope", "").split(),
            "issued_at": datetime.fromtimestamp(data.get("iat", 0)).isoformat(),
            "expires_at": datetime.fromtimestamp(data.get("exp", 0)).isoformat(),
            "remaining_lifetime": max(0, data.get("exp", 0) - datetime.utcnow().timestamp()),
            "tenant_id": data.get("tenant_id"),
            "token_binding": "dpop" if data.get("cnf", {}).get("jkt") else
                           "mtls" if data.get("cnf", {}).get("x5t#S256") else "none",
        }

    async def list_active_sessions(
        self,
        tenant_id: str,
        user_id: Optional[str] = None,
    ) -> List[dict]:
        """
        List active sessions/tokens for admin management.

        This would typically query a session store directly,
        as introspection is for individual tokens.
        """
        pass

    async def revoke_token(
        self,
        token: str,
        tenant_id: str,
    ) -> bool:
        """
        Revoke a token (RFC 7009).
        """
        import httpx

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.revocation_endpoint,
                data={
                    "token": token,
                    "token_type_hint": "access_token",
                },
                auth=(self.client_id, self.client_secret),
                headers={"X-Tenant-ID": tenant_id},
            )

        return response.status_code == 200

    async def revoke_all_user_tokens(
        self,
        user_id: str,
        tenant_id: str,
    ) -> int:
        """
        Revoke all tokens for a specific user.

        This is an admin operation not covered by RFC 7009,
        but commonly needed in admin panels.
        """
        pass


class AdminTokenError(Exception):
    pass
```

### Resource Server Integration

```python
class ResourceServerTokenValidator:
    """
    Validate tokens at resource server using introspection.

    RFC 7662 Section 4: Security Considerations
    """

    def __init__(
        self,
        introspection_endpoint: str,
        client_id: str,
        client_secret: str,
        cache_ttl: int = 60,  # Cache valid tokens for 60 seconds
    ):
        self.introspection_endpoint = introspection_endpoint
        self.client_id = client_id
        self.client_secret = client_secret
        self.cache_ttl = cache_ttl

        # Simple cache
        self._cache: Dict[str, tuple[dict, float]] = {}

    async def validate(
        self,
        token: str,
        tenant_id: str,
        required_scope: Optional[str] = None,
    ) -> dict:
        """
        Validate token using introspection.

        Returns claims if valid, raises exception otherwise.
        """
        # Check cache
        cached = self._get_cached(token)
        if cached:
            return self._check_scope(cached, required_scope)

        # Call introspection endpoint
        import httpx

        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.introspection_endpoint,
                data={"token": token},
                auth=(self.client_id, self.client_secret),
                headers={"X-Tenant-ID": tenant_id},
            )

        if response.status_code != 200:
            raise TokenValidationError("Introspection failed")

        data = response.json()

        if not data.get("active"):
            raise TokenValidationError("Token is not active")

        # Verify tenant
        if data.get("tenant_id") != tenant_id:
            raise TokenValidationError("Token not valid for this tenant")

        # Cache the result
        self._cache_token(token, data)

        return self._check_scope(data, required_scope)

    def _check_scope(self, claims: dict, required_scope: Optional[str]) -> dict:
        """Verify required scope is present."""
        if required_scope:
            token_scopes = set(claims.get("scope", "").split())
            required = set(required_scope.split())
            if not required.issubset(token_scopes):
                raise InsufficientScopeError(required_scope)
        return claims

    def _get_cached(self, token: str) -> Optional[dict]:
        """Get cached token data if still valid."""
        if token in self._cache:
            data, cached_at = self._cache[token]
            if datetime.utcnow().timestamp() - cached_at < self.cache_ttl:
                return data
            del self._cache[token]
        return None

    def _cache_token(self, token: str, data: dict):
        """Cache token introspection result."""
        self._cache[token] = (data, datetime.utcnow().timestamp())


class TokenValidationError(Exception):
    pass

class InsufficientScopeError(Exception):
    def __init__(self, required_scope: str):
        self.required_scope = required_scope
```

## Multi-Tenant Introspection

```python
class MultiTenantIntrospection:
    """
    Introspection service with multi-tenant support.
    """

    def __init__(self):
        self.tenant_stores: Dict[str, TokenStore] = {}

    def introspect(
        self,
        token: str,
        calling_tenant: str,
        token_tenant: Optional[str] = None,
    ) -> IntrospectionResponse:
        """
        Introspect token with tenant awareness.

        If token_tenant is specified, look in that tenant's store.
        Otherwise, determine tenant from token itself.
        """
        # Determine which tenant store to check
        if token_tenant:
            store = self.tenant_stores.get(token_tenant)
        else:
            # For JWTs, we can extract tenant from claims
            token_tenant = self._extract_tenant_from_token(token)
            store = self.tenant_stores.get(token_tenant) if token_tenant else None

        if not store:
            return IntrospectionResponse(active=False)

        # Validate cross-tenant access
        if token_tenant != calling_tenant:
            if not self._allow_cross_tenant(calling_tenant, token_tenant):
                return IntrospectionResponse(active=False)

        # Perform introspection
        token_data = store.get_token(token)

        if not token_data or self._is_expired(token_data):
            return IntrospectionResponse(active=False)

        return IntrospectionResponse(
            active=True,
            tenant_id=token_tenant,
            **token_data,
        )
```

## Security Considerations

1. **Client Authentication Required** - All introspection requests must authenticate
2. **TLS Required** - Always use HTTPS for introspection
3. **Rate Limiting** - Protect against brute-force token discovery
4. **Caching** - Cache results to reduce load, but respect token lifetime
5. **Cross-Tenant** - Carefully control cross-tenant introspection

## Related RFCs

| RFC      | Title            | Relationship       |
| -------- | ---------------- | ------------------ |
| RFC 6749 | OAuth 2.0        | Base framework     |
| RFC 7009 | Token Revocation | Companion endpoint |
| RFC 6750 | Bearer Token     | Token type         |

## Output Format

Provide:

- Introspection endpoint implementations
- Admin panel integrations
- Resource server validation
- Caching strategies
