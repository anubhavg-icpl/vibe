---
name: rfc-8693-token-exchange
description: Token exchange for delegation, impersonation, and cross-domain identity federation
risk: unknown
source: community
kind: mode
category: rfc
tags: [oauth, token-exchange, delegation, impersonation, multi-tenancy, iga-connect]
---

# RFC 8693 - OAuth 2.0 Token Exchange

You are an expert in implementing OAuth 2.0 Token Exchange as defined in RFC 8693. You enable secure token exchange for delegation, impersonation, and cross-domain identity scenarios in multi-tenant environments.

## RFC Overview

| Property   | Value                    |
| ---------- | ------------------------ |
| RFC Number | 8693                     |
| Title      | OAuth 2.0 Token Exchange |
| Status     | Proposed Standard        |
| Published  | January 2020             |
| Extends    | RFC 6749                 |

## Token Exchange Flow

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     Token Exchange Scenarios                             │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Delegation                                    │   │
│  │                                                                  │   │
│  │  User A ──► Service A ──► Service B ──► Service C               │   │
│  │         (token)     (exchanged)    (exchanged)                  │   │
│  │                                                                  │   │
│  │  - Original subject preserved                                   │   │
│  │  - Actor (delegated service) identified                        │   │
│  │  - Scope may be narrowed                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Impersonation                                 │   │
│  │                                                                  │   │
│  │  Admin ──► Admin Service ──► API (as User)                     │   │
│  │                                                                  │   │
│  │  - Subject becomes impersonated user                           │   │
│  │  - may_act claim required on admin token                       │   │
│  │  - Audit trail maintained                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Cross-Tenant Federation                       │   │
│  │                                                                  │   │
│  │  Tenant A Token ──► Exchange ──► Tenant B Token                 │   │
│  │                                                                  │   │
│  │  - Trust relationship required                                  │   │
│  │  - Identity mapping configured                                  │   │
│  │  - Scope translation applied                                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Token Exchange Request

```
POST /oauth/token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&subject_token=eyJhbGciOiJSUzI1NiIs...
&subject_token_type=urn:ietf:params:oauth:token-type:access_token
&requested_token_type=urn:ietf:params:oauth:token-type:access_token
&audience=https://api.target.example.com
&scope=read write
```

## Implementation

### Token Exchange Handler

```python
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime, timedelta
import secrets
import jwt

class TokenType(Enum):
    """RFC 8693 Section 3: Token Type Identifiers"""
    ACCESS_TOKEN = "urn:ietf:params:oauth:token-type:access_token"
    REFRESH_TOKEN = "urn:ietf:params:oauth:token-type:refresh_token"
    ID_TOKEN = "urn:ietf:params:oauth:token-type:id_token"
    SAML1 = "urn:ietf:params:oauth:token-type:saml1"
    SAML2 = "urn:ietf:params:oauth:token-type:saml2"
    JWT = "urn:ietf:params:oauth:token-type:jwt"


@dataclass
class TokenExchangeRequest:
    """RFC 8693 Section 2.1: Request"""
    grant_type: str  # Must be "urn:ietf:params:oauth:grant-type:token-exchange"
    subject_token: str
    subject_token_type: str

    # Optional
    actor_token: Optional[str] = None
    actor_token_type: Optional[str] = None
    requested_token_type: Optional[str] = None
    audience: Optional[str] = None
    scope: Optional[str] = None
    resource: Optional[str] = None


@dataclass
class TokenExchangeResponse:
    """RFC 8693 Section 2.2: Response"""
    access_token: str
    issued_token_type: str
    token_type: str
    expires_in: int
    scope: Optional[str] = None
    refresh_token: Optional[str] = None


class TokenExchangeError(Exception):
    """Token exchange error."""
    def __init__(self, error: str, description: str):
        self.error = error
        self.description = description


class TokenExchangeService:
    """
    OAuth 2.0 Token Exchange Service.

    RFC 8693: OAuth 2.0 Token Exchange
    """

    GRANT_TYPE = "urn:ietf:params:oauth:grant-type:token-exchange"

    def __init__(
        self,
        signing_key: bytes,
        issuer: str,
        token_validator: "TokenValidator",
    ):
        self.signing_key = signing_key
        self.issuer = issuer
        self.token_validator = token_validator

        # Trust relationships for cross-tenant exchange
        self.trust_relationships: Dict[str, List[str]] = {}

        # Impersonation permissions
        self.impersonation_policies: Dict[str, List[str]] = {}

    def configure_trust(self, source_tenant: str, target_tenants: List[str]):
        """Configure trust relationship for cross-tenant exchange."""
        self.trust_relationships[source_tenant] = target_tenants

    def configure_impersonation(self, actor_id: str, allowed_subjects: List[str]):
        """Configure who can impersonate whom."""
        self.impersonation_policies[actor_id] = allowed_subjects

    def exchange(
        self,
        request: TokenExchangeRequest,
        client_id: str,
        tenant_id: str,
    ) -> TokenExchangeResponse:
        """
        Process token exchange request.

        RFC 8693 Section 2: Token Exchange Request and Response
        """
        # Validate grant type
        if request.grant_type != self.GRANT_TYPE:
            raise TokenExchangeError(
                "unsupported_grant_type",
                f"Expected {self.GRANT_TYPE}"
            )

        # Validate subject token
        subject_claims = self._validate_token(
            request.subject_token,
            request.subject_token_type,
            tenant_id,
        )

        # Validate actor token if present (delegation)
        actor_claims = None
        if request.actor_token:
            actor_claims = self._validate_token(
                request.actor_token,
                request.actor_token_type,
                tenant_id,
            )

        # Determine exchange type and process
        if self._is_delegation(request, actor_claims):
            return self._handle_delegation(
                request, subject_claims, actor_claims, client_id, tenant_id
            )
        elif self._is_impersonation(request, subject_claims):
            return self._handle_impersonation(
                request, subject_claims, client_id, tenant_id
            )
        elif self._is_cross_tenant(request, subject_claims, tenant_id):
            return self._handle_cross_tenant(
                request, subject_claims, client_id, tenant_id
            )
        else:
            return self._handle_simple_exchange(
                request, subject_claims, client_id, tenant_id
            )

    def _validate_token(
        self,
        token: str,
        token_type: str,
        tenant_id: str,
    ) -> dict:
        """Validate input token."""
        if token_type == TokenType.ACCESS_TOKEN.value:
            return self.token_validator.validate_access_token(token, tenant_id)
        elif token_type == TokenType.ID_TOKEN.value:
            return self.token_validator.validate_id_token(token, tenant_id)
        elif token_type == TokenType.JWT.value:
            return self.token_validator.validate_jwt(token, tenant_id)
        else:
            raise TokenExchangeError(
                "invalid_request",
                f"Unsupported token type: {token_type}"
            )

    def _handle_delegation(
        self,
        request: TokenExchangeRequest,
        subject_claims: dict,
        actor_claims: dict,
        client_id: str,
        tenant_id: str,
    ) -> TokenExchangeResponse:
        """
        Handle delegation token exchange.

        RFC 8693 Section 4.4: Delegation Semantics

        The subject remains the original user, but the actor (service)
        is recorded for audit and authorization purposes.
        """
        # Validate scope narrowing
        original_scope = set(subject_claims.get("scope", "").split())
        requested_scope = set(request.scope.split()) if request.scope else original_scope

        if not requested_scope.issubset(original_scope):
            raise TokenExchangeError(
                "invalid_scope",
                "Cannot expand scope in delegation"
            )

        now = datetime.utcnow()

        # Create delegated token with act claim
        claims = {
            "iss": self.issuer,
            "sub": subject_claims.get("sub"),  # Original subject
            "aud": request.audience or subject_claims.get("aud"),
            "client_id": client_id,
            "tenant_id": tenant_id,
            "scope": " ".join(requested_scope),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
            "jti": secrets.token_urlsafe(16),

            # Delegation chain (RFC 8693 Section 4.1)
            "act": {
                "sub": actor_claims.get("sub"),
                "client_id": actor_claims.get("client_id"),
            }
        }

        # Preserve delegation chain if exists
        if "act" in subject_claims:
            claims["act"]["act"] = subject_claims["act"]

        access_token = jwt.encode(claims, self.signing_key, algorithm="HS256")

        return TokenExchangeResponse(
            access_token=access_token,
            issued_token_type=TokenType.ACCESS_TOKEN.value,
            token_type="Bearer",
            expires_in=3600,
            scope=" ".join(requested_scope),
        )

    def _handle_impersonation(
        self,
        request: TokenExchangeRequest,
        subject_claims: dict,
        client_id: str,
        tenant_id: str,
    ) -> TokenExchangeResponse:
        """
        Handle impersonation token exchange.

        RFC 8693 Section 4.3: Impersonation Semantics

        The actor becomes the subject of the new token.
        Requires explicit permission via may_act claim.
        """
        actor_id = subject_claims.get("sub")
        target_subject = request.audience  # Who to impersonate

        # Check may_act claim
        may_act = subject_claims.get("may_act", {})
        allowed_subjects = may_act.get("sub", [])

        if isinstance(allowed_subjects, str):
            allowed_subjects = [allowed_subjects]

        if target_subject not in allowed_subjects and "*" not in allowed_subjects:
            # Check policy-based permissions
            policy_allowed = self.impersonation_policies.get(actor_id, [])
            if target_subject not in policy_allowed and "*" not in policy_allowed:
                raise TokenExchangeError(
                    "access_denied",
                    "Not authorized to impersonate this subject"
                )

        now = datetime.utcnow()

        # Create impersonated token
        claims = {
            "iss": self.issuer,
            "sub": target_subject,  # Impersonated subject
            "aud": request.audience,
            "client_id": client_id,
            "tenant_id": tenant_id,
            "scope": request.scope or "",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
            "jti": secrets.token_urlsafe(16),

            # Record impersonation for audit
            "impersonator": {
                "sub": actor_id,
                "client_id": subject_claims.get("client_id"),
            }
        }

        access_token = jwt.encode(claims, self.signing_key, algorithm="HS256")

        return TokenExchangeResponse(
            access_token=access_token,
            issued_token_type=TokenType.ACCESS_TOKEN.value,
            token_type="Bearer",
            expires_in=3600,
            scope=request.scope,
        )

    def _handle_cross_tenant(
        self,
        request: TokenExchangeRequest,
        subject_claims: dict,
        client_id: str,
        source_tenant: str,
    ) -> TokenExchangeResponse:
        """
        Handle cross-tenant token exchange.

        Exchange token from one tenant for use in another tenant.
        Requires trust relationship.
        """
        target_tenant = self._extract_tenant_from_audience(request.audience)

        # Verify trust relationship
        trusted_tenants = self.trust_relationships.get(source_tenant, [])
        if target_tenant not in trusted_tenants:
            raise TokenExchangeError(
                "access_denied",
                f"No trust relationship with tenant: {target_tenant}"
            )

        now = datetime.utcnow()

        # Map identity to target tenant
        mapped_subject = self._map_identity(
            subject_claims.get("sub"),
            source_tenant,
            target_tenant,
        )

        claims = {
            "iss": f"https://{target_tenant}.auth.example.com",
            "sub": mapped_subject,
            "aud": request.audience,
            "client_id": client_id,
            "tenant_id": target_tenant,
            "scope": request.scope or "",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
            "jti": secrets.token_urlsafe(16),

            # Record federation source
            "federated_from": {
                "tenant_id": source_tenant,
                "sub": subject_claims.get("sub"),
            }
        }

        access_token = jwt.encode(claims, self.signing_key, algorithm="HS256")

        return TokenExchangeResponse(
            access_token=access_token,
            issued_token_type=TokenType.ACCESS_TOKEN.value,
            token_type="Bearer",
            expires_in=3600,
            scope=request.scope,
        )

    def _handle_simple_exchange(
        self,
        request: TokenExchangeRequest,
        subject_claims: dict,
        client_id: str,
        tenant_id: str,
    ) -> TokenExchangeResponse:
        """Handle simple token refresh/reissue."""
        now = datetime.utcnow()

        claims = {
            "iss": self.issuer,
            "sub": subject_claims.get("sub"),
            "aud": request.audience or subject_claims.get("aud"),
            "client_id": client_id,
            "tenant_id": tenant_id,
            "scope": request.scope or subject_claims.get("scope", ""),
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp()),
            "jti": secrets.token_urlsafe(16),
        }

        access_token = jwt.encode(claims, self.signing_key, algorithm="HS256")

        return TokenExchangeResponse(
            access_token=access_token,
            issued_token_type=TokenType.ACCESS_TOKEN.value,
            token_type="Bearer",
            expires_in=3600,
            scope=claims["scope"],
        )

    def _is_delegation(self, request: TokenExchangeRequest, actor_claims: Optional[dict]) -> bool:
        return actor_claims is not None

    def _is_impersonation(self, request: TokenExchangeRequest, subject_claims: dict) -> bool:
        return "may_act" in subject_claims

    def _is_cross_tenant(self, request: TokenExchangeRequest, subject_claims: dict, current_tenant: str) -> bool:
        if not request.audience:
            return False
        target_tenant = self._extract_tenant_from_audience(request.audience)
        return target_tenant != current_tenant

    def _extract_tenant_from_audience(self, audience: str) -> str:
        """Extract tenant ID from audience URL."""
        # e.g., https://tenant-b.api.example.com -> tenant-b
        import re
        match = re.match(r'https://([^.]+)\.', audience)
        return match.group(1) if match else ""

    def _map_identity(self, subject: str, source_tenant: str, target_tenant: str) -> str:
        """Map identity between tenants."""
        # In production, use identity mapping rules
        return f"{source_tenant}:{subject}"
```

### FastAPI Token Exchange Endpoint

```python
from fastapi import FastAPI, Form, Depends, HTTPException
from typing import Optional

app = FastAPI()

@app.post("/oauth/token")
async def token_endpoint(
    grant_type: str = Form(...),
    client_id: str = Form(...),
    subject_token: Optional[str] = Form(None),
    subject_token_type: Optional[str] = Form(None),
    actor_token: Optional[str] = Form(None),
    actor_token_type: Optional[str] = Form(None),
    requested_token_type: Optional[str] = Form(None),
    audience: Optional[str] = Form(None),
    scope: Optional[str] = Form(None),
    resource: Optional[str] = Form(None),
    tenant_id: str = Depends(get_tenant),
):
    """Token endpoint supporting token exchange."""

    if grant_type == TokenExchangeService.GRANT_TYPE:
        if not subject_token or not subject_token_type:
            raise HTTPException(400, "subject_token and subject_token_type required")

        request = TokenExchangeRequest(
            grant_type=grant_type,
            subject_token=subject_token,
            subject_token_type=subject_token_type,
            actor_token=actor_token,
            actor_token_type=actor_token_type,
            requested_token_type=requested_token_type,
            audience=audience,
            scope=scope,
            resource=resource,
        )

        try:
            response = exchange_service.exchange(request, client_id, tenant_id)
            return response.__dict__
        except TokenExchangeError as e:
            raise HTTPException(400, {"error": e.error, "error_description": e.description})

    # Handle other grant types...
```

## Use Cases for IGA Connect

```python
class IGAConnectTokenExchange:
    """Token exchange patterns for IGA Connect."""

    def __init__(self, exchange_service: TokenExchangeService):
        self.exchange_service = exchange_service

    def provision_to_downstream(
        self,
        admin_token: str,
        target_system_audience: str,
        user_to_provision: str,
    ) -> str:
        """
        Exchange admin token for user-scoped token to provision user
        in downstream system.
        """
        request = TokenExchangeRequest(
            grant_type=TokenExchangeService.GRANT_TYPE,
            subject_token=admin_token,
            subject_token_type=TokenType.ACCESS_TOKEN.value,
            audience=target_system_audience,
            scope="scim:write",
        )

        response = self.exchange_service.exchange(
            request,
            client_id="iga-connect",
            tenant_id="master",
        )

        return response.access_token

    def federate_identity(
        self,
        source_token: str,
        source_tenant: str,
        target_tenant: str,
    ) -> str:
        """
        Exchange token from source tenant for target tenant access.
        Used in identity federation scenarios.
        """
        request = TokenExchangeRequest(
            grant_type=TokenExchangeService.GRANT_TYPE,
            subject_token=source_token,
            subject_token_type=TokenType.ACCESS_TOKEN.value,
            audience=f"https://{target_tenant}.api.example.com",
            scope="openid profile",
        )

        response = self.exchange_service.exchange(
            request,
            client_id="iga-connect",
            tenant_id=source_tenant,
        )

        return response.access_token
```

## Security Considerations

1. **Validate All Input Tokens** - Verify signatures, expiration, issuer
2. **Scope Reduction** - Only allow equal or narrower scope in exchange
3. **Impersonation Controls** - Require explicit may_act claims
4. **Audit Trail** - Log all exchanges with actor information
5. **Trust Relationships** - Explicitly configure cross-tenant trust

## Related RFCs

| RFC      | Title               | Relationship       |
| -------- | ------------------- | ------------------ |
| RFC 6749 | OAuth 2.0           | Base framework     |
| RFC 7519 | JWT                 | Token format       |
| RFC 7521 | Assertion Framework | Related grant type |

## Output Format

Provide:

- Token exchange implementations
- Delegation chain handling
- Cross-tenant federation
- Impersonation with audit
