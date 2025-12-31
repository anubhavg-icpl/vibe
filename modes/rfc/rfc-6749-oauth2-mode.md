---
title: RFC 6749 - OAuth 2.0 Authorization Framework
description: Complete implementation guide for OAuth 2.0 Authorization Framework with multi-tenancy support
author: Anubhav Gain
rfc: 6749
tags: [oauth, authorization, identity, multi-tenancy]
---

# RFC 6749 - OAuth 2.0 Authorization Framework

You are an expert in implementing the OAuth 2.0 Authorization Framework as defined in RFC 6749. You provide secure, standards-compliant implementations with multi-tenancy considerations.

## RFC Overview

| Property   | Value                                 |
| ---------- | ------------------------------------- |
| RFC Number | 6749                                  |
| Title      | The OAuth 2.0 Authorization Framework |
| Status     | Proposed Standard                     |
| Published  | October 2012                          |
| Updated By | RFC 8252, RFC 9700                    |

## Protocol Flow

```
     +--------+                               +---------------+
     |        |--(A)- Authorization Request ->|   Resource    |
     |        |                               |     Owner     |
     |        |<-(B)-- Authorization Grant ---|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(C)-- Authorization Grant -->| Authorization |
     | Client |                               |     Server    |
     |        |<-(D)----- Access Token -------|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(E)----- Access Token ------>|    Resource   |
     |        |                               |     Server    |
     |        |<-(F)--- Protected Resource ---|               |
     +--------+                               +---------------+
```

## Grant Types

### Authorization Code Grant (Recommended)

```
+----------+
| Resource |
|   Owner  |
|          |
+----------+
     ^
     |
    (B)
+----|-----+          Client Identifier      +---------------+
|         -+----(A)-- & Redirection URI ---->|               |
|  User-   |                                 | Authorization |
|  Agent  -+----(B)-- User authenticates --->|     Server    |
|          |                                 |               |
|         -+----(C)-- Authorization Code ---<|               |
+-|----|---+                                 +---------------+
  |    |                                         ^      v
 (A)  (C)                                        |      |
  |    |                                         |      |
  ^    v                                         |      |
+---------+                                      |      |
|         |>---(D)-- Authorization Code ---------'      |
|  Client |          & Redirection URI                  |
|         |                                             |
|         |<---(E)----- Access Token -------------------'
+---------+       (w/ Optional Refresh Token)
```

### Implementation

```python
# authorization_server.py
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional
import secrets
import hashlib
import base64
from urllib.parse import urlencode, parse_qs

@dataclass
class AuthorizationCode:
    code: str
    client_id: str
    redirect_uri: str
    scope: str
    user_id: str
    tenant_id: str  # Multi-tenancy support
    code_challenge: Optional[str]  # PKCE
    code_challenge_method: Optional[str]
    expires_at: datetime
    used: bool = False

@dataclass
class AccessToken:
    token: str
    token_type: str
    client_id: str
    user_id: str
    tenant_id: str
    scope: str
    expires_at: datetime

@dataclass
class RefreshToken:
    token: str
    client_id: str
    user_id: str
    tenant_id: str
    scope: str
    expires_at: datetime
    revoked: bool = False

class OAuth2AuthorizationServer:
    """RFC 6749 compliant Authorization Server with multi-tenancy."""

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.authorization_codes: dict[str, AuthorizationCode] = {}
        self.access_tokens: dict[str, AccessToken] = {}
        self.refresh_tokens: dict[str, RefreshToken] = {}
        self.clients: dict[str, dict] = {}

    def register_client(
        self,
        client_id: str,
        client_secret: Optional[str],
        redirect_uris: list[str],
        grant_types: list[str],
        client_type: str = "confidential"  # or "public"
    ) -> dict:
        """
        Register an OAuth 2.0 client.

        RFC 6749 Section 2: Client Registration
        """
        client = {
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uris": redirect_uris,
            "grant_types": grant_types,
            "client_type": client_type,
            "tenant_id": self.tenant_id,
        }
        self.clients[client_id] = client
        return client

    def authorize(
        self,
        response_type: str,
        client_id: str,
        redirect_uri: str,
        scope: str,
        state: str,
        user_id: str,
        code_challenge: Optional[str] = None,
        code_challenge_method: Optional[str] = None,
    ) -> str:
        """
        Authorization Endpoint.

        RFC 6749 Section 4.1.1: Authorization Request
        """
        # Validate client
        client = self.clients.get(client_id)
        if not client:
            raise OAuth2Error("invalid_client", "Unknown client")

        # Validate redirect_uri
        if redirect_uri not in client["redirect_uris"]:
            raise OAuth2Error("invalid_request", "Invalid redirect_uri")

        # Validate response_type
        if response_type != "code":
            return self._build_error_redirect(
                redirect_uri, "unsupported_response_type", state
            )

        # Generate authorization code
        code = secrets.token_urlsafe(32)
        self.authorization_codes[code] = AuthorizationCode(
            code=code,
            client_id=client_id,
            redirect_uri=redirect_uri,
            scope=scope,
            user_id=user_id,
            tenant_id=self.tenant_id,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
        )

        # Build redirect with code
        params = {"code": code, "state": state}
        return f"{redirect_uri}?{urlencode(params)}"

    def token(
        self,
        grant_type: str,
        client_id: str,
        client_secret: Optional[str] = None,
        code: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        refresh_token: Optional[str] = None,
        code_verifier: Optional[str] = None,
        scope: Optional[str] = None,
    ) -> dict:
        """
        Token Endpoint.

        RFC 6749 Section 4.1.3: Access Token Request
        """
        # Authenticate client
        client = self._authenticate_client(client_id, client_secret)

        if grant_type == "authorization_code":
            return self._handle_authorization_code_grant(
                client, code, redirect_uri, code_verifier
            )
        elif grant_type == "refresh_token":
            return self._handle_refresh_token_grant(
                client, refresh_token, scope
            )
        elif grant_type == "client_credentials":
            return self._handle_client_credentials_grant(client, scope)
        else:
            raise OAuth2Error("unsupported_grant_type")

    def _handle_authorization_code_grant(
        self,
        client: dict,
        code: str,
        redirect_uri: str,
        code_verifier: Optional[str],
    ) -> dict:
        """RFC 6749 Section 4.1.3 + RFC 7636 PKCE"""

        auth_code = self.authorization_codes.get(code)

        # Validate authorization code
        if not auth_code:
            raise OAuth2Error("invalid_grant", "Invalid authorization code")

        if auth_code.used:
            # Revoke all tokens if code reuse detected (security)
            self._revoke_tokens_for_code(code)
            raise OAuth2Error("invalid_grant", "Authorization code already used")

        if auth_code.expires_at < datetime.utcnow():
            raise OAuth2Error("invalid_grant", "Authorization code expired")

        if auth_code.client_id != client["client_id"]:
            raise OAuth2Error("invalid_grant", "Client mismatch")

        if auth_code.redirect_uri != redirect_uri:
            raise OAuth2Error("invalid_grant", "Redirect URI mismatch")

        # PKCE verification (RFC 7636)
        if auth_code.code_challenge:
            if not code_verifier:
                raise OAuth2Error("invalid_grant", "Code verifier required")

            if not self._verify_pkce(
                code_verifier,
                auth_code.code_challenge,
                auth_code.code_challenge_method,
            ):
                raise OAuth2Error("invalid_grant", "PKCE verification failed")

        # Mark code as used
        auth_code.used = True

        # Generate tokens
        return self._issue_tokens(
            client["client_id"],
            auth_code.user_id,
            auth_code.scope,
        )

    def _handle_refresh_token_grant(
        self,
        client: dict,
        token: str,
        scope: Optional[str],
    ) -> dict:
        """RFC 6749 Section 6: Refreshing an Access Token"""

        refresh = self.refresh_tokens.get(token)

        if not refresh:
            raise OAuth2Error("invalid_grant", "Invalid refresh token")

        if refresh.revoked:
            raise OAuth2Error("invalid_grant", "Refresh token revoked")

        if refresh.expires_at < datetime.utcnow():
            raise OAuth2Error("invalid_grant", "Refresh token expired")

        if refresh.client_id != client["client_id"]:
            raise OAuth2Error("invalid_grant", "Client mismatch")

        # Scope validation - can only narrow, not expand
        if scope:
            requested_scopes = set(scope.split())
            original_scopes = set(refresh.scope.split())
            if not requested_scopes.issubset(original_scopes):
                raise OAuth2Error("invalid_scope")
            final_scope = scope
        else:
            final_scope = refresh.scope

        # Rotate refresh token (security best practice)
        refresh.revoked = True

        return self._issue_tokens(
            client["client_id"],
            refresh.user_id,
            final_scope,
        )

    def _handle_client_credentials_grant(
        self,
        client: dict,
        scope: Optional[str],
    ) -> dict:
        """RFC 6749 Section 4.4: Client Credentials Grant"""

        if client["client_type"] != "confidential":
            raise OAuth2Error("unauthorized_client")

        return self._issue_tokens(
            client["client_id"],
            None,  # No user in client credentials
            scope or "",
            include_refresh=False,
        )

    def _issue_tokens(
        self,
        client_id: str,
        user_id: Optional[str],
        scope: str,
        include_refresh: bool = True,
    ) -> dict:
        """Generate access and refresh tokens."""

        access_token = secrets.token_urlsafe(32)
        self.access_tokens[access_token] = AccessToken(
            token=access_token,
            token_type="Bearer",
            client_id=client_id,
            user_id=user_id,
            tenant_id=self.tenant_id,
            scope=scope,
            expires_at=datetime.utcnow() + timedelta(hours=1),
        )

        response = {
            "access_token": access_token,
            "token_type": "Bearer",
            "expires_in": 3600,
            "scope": scope,
        }

        if include_refresh and user_id:
            refresh_token = secrets.token_urlsafe(32)
            self.refresh_tokens[refresh_token] = RefreshToken(
                token=refresh_token,
                client_id=client_id,
                user_id=user_id,
                tenant_id=self.tenant_id,
                scope=scope,
                expires_at=datetime.utcnow() + timedelta(days=30),
            )
            response["refresh_token"] = refresh_token

        return response

    def _authenticate_client(
        self,
        client_id: str,
        client_secret: Optional[str],
    ) -> dict:
        """Authenticate the client."""

        client = self.clients.get(client_id)
        if not client:
            raise OAuth2Error("invalid_client")

        # Public clients don't require secret
        if client["client_type"] == "public":
            return client

        # Confidential clients must authenticate
        if not secrets.compare_digest(
            client.get("client_secret", ""),
            client_secret or "",
        ):
            raise OAuth2Error("invalid_client")

        return client

    def _verify_pkce(
        self,
        code_verifier: str,
        code_challenge: str,
        method: str,
    ) -> bool:
        """Verify PKCE code verifier against challenge."""

        if method == "S256":
            computed = base64.urlsafe_b64encode(
                hashlib.sha256(code_verifier.encode()).digest()
            ).decode().rstrip("=")
            return secrets.compare_digest(computed, code_challenge)
        elif method == "plain":
            return secrets.compare_digest(code_verifier, code_challenge)
        return False

    def _build_error_redirect(
        self,
        redirect_uri: str,
        error: str,
        state: str,
    ) -> str:
        params = {"error": error, "state": state}
        return f"{redirect_uri}?{urlencode(params)}"


class OAuth2Error(Exception):
    """OAuth 2.0 Error Response (RFC 6749 Section 5.2)"""

    def __init__(self, error: str, description: str = None):
        self.error = error
        self.description = description

    def to_response(self) -> dict:
        response = {"error": self.error}
        if self.description:
            response["error_description"] = self.description
        return response
```

## Multi-Tenancy Considerations

### Tenant Isolation

```python
class MultiTenantOAuth2Server:
    """OAuth 2.0 server with tenant isolation."""

    def __init__(self):
        self.tenant_servers: dict[str, OAuth2AuthorizationServer] = {}

    def get_tenant_server(self, tenant_id: str) -> OAuth2AuthorizationServer:
        """Get or create tenant-specific OAuth server."""
        if tenant_id not in self.tenant_servers:
            self.tenant_servers[tenant_id] = OAuth2AuthorizationServer(tenant_id)
        return self.tenant_servers[tenant_id]

    def validate_token(self, access_token: str, tenant_id: str) -> Optional[dict]:
        """Validate token with tenant isolation."""
        server = self.get_tenant_server(tenant_id)
        token = server.access_tokens.get(access_token)

        if not token:
            return None

        if token.tenant_id != tenant_id:
            return None  # Cross-tenant access denied

        if token.expires_at < datetime.utcnow():
            return None

        return {
            "active": True,
            "client_id": token.client_id,
            "user_id": token.user_id,
            "tenant_id": token.tenant_id,
            "scope": token.scope,
            "exp": int(token.expires_at.timestamp()),
        }
```

### Tenant-Aware Endpoints

```python
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.security import HTTPBearer

app = FastAPI()
security = HTTPBearer()
mt_server = MultiTenantOAuth2Server()

def get_tenant_id(request: Request) -> str:
    """Extract tenant from subdomain or header."""
    # Option 1: Subdomain
    host = request.headers.get("host", "")
    if "." in host:
        return host.split(".")[0]

    # Option 2: Header
    tenant = request.headers.get("X-Tenant-ID")
    if tenant:
        return tenant

    raise HTTPException(400, "Tenant not specified")

@app.post("/oauth/authorize")
async def authorize(
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
):
    server = mt_server.get_tenant_server(tenant_id)
    # ... authorization logic

@app.post("/oauth/token")
async def token(
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
):
    server = mt_server.get_tenant_server(tenant_id)
    # ... token logic
```

## Security Considerations

### From RFC 6749 Section 10

1. **Client Authentication** - Use strong client secrets, prefer mTLS
2. **Client Impersonation** - Validate redirect_uri strictly
3. **Access Token Scope** - Minimize scope, use least privilege
4. **Refresh Token Protection** - Bind to client, rotate on use
5. **Authorization Code Injection** - Use PKCE (RFC 7636)
6. **Cross-Site Request Forgery** - Use state parameter

### Security Best Practices

```python
# Always use PKCE for all clients
def generate_pkce():
    code_verifier = secrets.token_urlsafe(64)
    code_challenge = base64.urlsafe_b64encode(
        hashlib.sha256(code_verifier.encode()).digest()
    ).decode().rstrip("=")
    return code_verifier, code_challenge

# Use secure token storage
from cryptography.fernet import Fernet

class SecureTokenStore:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)

    def store_token(self, token: str) -> bytes:
        return self.cipher.encrypt(token.encode())

    def retrieve_token(self, encrypted: bytes) -> str:
        return self.cipher.decrypt(encrypted).decode()
```

## Related RFCs

| RFC      | Title               | Relationship                  |
| -------- | ------------------- | ----------------------------- |
| RFC 6750 | Bearer Token Usage  | How to use access tokens      |
| RFC 7636 | PKCE                | Security extension (required) |
| RFC 7662 | Token Introspection | Token validation              |
| RFC 9700 | Security BCP        | Security requirements         |

## Output Format

Provide:

- RFC-compliant OAuth 2.0 implementations
- Multi-tenancy patterns with isolation
- Security configurations
- Token management strategies
