---
name: rfc-7636-pkce
description: Proof Key for Code Exchange implementation for secure OAuth 2.0 authorization. Use when implementing or validating rfc 7636 pkce protocol compliance.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rfc
  tags: [oauth, pkce, security, authorization-code, multi-tenancy]
---

# RFC 7636 - Proof Key for Code Exchange (PKCE)

You are an expert in implementing PKCE as defined in RFC 7636. PKCE is now required for ALL OAuth 2.0 clients, not just public clients.

## RFC Overview

| Property   | Value                                               |
| ---------- | --------------------------------------------------- |
| RFC Number | 7636                                                |
| Title      | Proof Key for Code Exchange by OAuth Public Clients |
| Status     | Proposed Standard                                   |
| Published  | September 2015                                      |
| Extends    | RFC 6749                                            |

## PKCE Flow

```
                                                 +-------------------+
                                                 |   Authz Server    |
       +--------+                                | +---------------+ |
       |        |--(A)- Authorization Request ---->|               | |
       |        |       + t(code_verifier), t_m  | | Authorization | |
       |        |                                | |    Endpoint   | |
       |        |<-(B)---- Authorization Code -----|               | |
       |        |                                | +---------------+ |
       | Client |                                |                   |
       |        |                                | +---------------+ |
       |        |--(C)-- Access Token Request ---->|               | |
       |        |          + code_verifier       | |    Token      | |
       |        |                                | |   Endpoint    | |
       |        |<-(D)------ Access Token --------|               | |
       +--------+                                | +---------------+ |
                                                 +-------------------+

  Where:
    t(code_verifier) = code_challenge
    t_m = code_challenge_method
```

## Implementation

### PKCE Generator

```python
import secrets
import hashlib
import base64
from dataclasses import dataclass
from typing import Literal

@dataclass
class PKCEChallenge:
    code_verifier: str
    code_challenge: str
    code_challenge_method: Literal["S256", "plain"]

class PKCEGenerator:
    """
    Generate PKCE code verifier and challenge.

    RFC 7636 Section 4.1: Client Creates a Code Verifier
    """

    # RFC 7636 Section 4.1: code_verifier length between 43-128 characters
    MIN_VERIFIER_LENGTH = 43
    MAX_VERIFIER_LENGTH = 128
    DEFAULT_VERIFIER_LENGTH = 64

    @classmethod
    def generate(
        cls,
        method: Literal["S256", "plain"] = "S256",
        verifier_length: int = DEFAULT_VERIFIER_LENGTH,
    ) -> PKCEChallenge:
        """
        Generate PKCE code verifier and challenge.

        Args:
            method: Challenge method (S256 recommended, plain for legacy)
            verifier_length: Length of code verifier (43-128 chars)

        Returns:
            PKCEChallenge with verifier and challenge
        """
        if not cls.MIN_VERIFIER_LENGTH <= verifier_length <= cls.MAX_VERIFIER_LENGTH:
            raise ValueError(
                f"verifier_length must be between {cls.MIN_VERIFIER_LENGTH} "
                f"and {cls.MAX_VERIFIER_LENGTH}"
            )

        # Generate code_verifier
        # RFC 7636: unreserved characters [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
        code_verifier = secrets.token_urlsafe(verifier_length)[:verifier_length]

        # Generate code_challenge
        if method == "S256":
            code_challenge = cls._generate_s256_challenge(code_verifier)
        else:
            code_challenge = code_verifier

        return PKCEChallenge(
            code_verifier=code_verifier,
            code_challenge=code_challenge,
            code_challenge_method=method,
        )

    @staticmethod
    def _generate_s256_challenge(code_verifier: str) -> str:
        """
        Generate S256 code challenge.

        RFC 7636 Section 4.2:
        code_challenge = BASE64URL(SHA256(ASCII(code_verifier)))
        """
        digest = hashlib.sha256(code_verifier.encode("ascii")).digest()
        return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


class PKCEValidator:
    """
    Validate PKCE code verifier against challenge.

    RFC 7636 Section 4.6: Server Verifies code_verifier
    """

    @staticmethod
    def validate(
        code_verifier: str,
        code_challenge: str,
        code_challenge_method: str,
    ) -> bool:
        """
        Verify code_verifier matches code_challenge.

        Args:
            code_verifier: The code verifier from token request
            code_challenge: The code challenge from authorization request
            code_challenge_method: Method used ("S256" or "plain")

        Returns:
            True if verification succeeds
        """
        if code_challenge_method == "S256":
            computed = PKCEGenerator._generate_s256_challenge(code_verifier)
            return secrets.compare_digest(computed, code_challenge)
        elif code_challenge_method == "plain":
            return secrets.compare_digest(code_verifier, code_challenge)
        else:
            return False
```

### Integration with OAuth 2.0 Flow

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

@dataclass
class AuthorizationRequest:
    """PKCE-enhanced authorization request."""
    client_id: str
    redirect_uri: str
    scope: str
    state: str
    code_challenge: str
    code_challenge_method: str
    response_type: str = "code"

    def to_url(self, authorization_endpoint: str) -> str:
        """Build authorization URL with PKCE parameters."""
        params = {
            "response_type": self.response_type,
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": self.scope,
            "state": self.state,
            "code_challenge": self.code_challenge,
            "code_challenge_method": self.code_challenge_method,
        }
        return f"{authorization_endpoint}?{urlencode(params)}"


@dataclass
class StoredAuthorizationCode:
    """Authorization code with PKCE challenge stored."""
    code: str
    client_id: str
    redirect_uri: str
    scope: str
    user_id: str
    tenant_id: str
    code_challenge: str
    code_challenge_method: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    expires_at: datetime = field(default_factory=lambda: datetime.utcnow() + timedelta(minutes=10))
    used: bool = False


class PKCEAuthorizationServer:
    """OAuth 2.0 Authorization Server with mandatory PKCE."""

    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.codes: dict[str, StoredAuthorizationCode] = {}

    def authorize(
        self,
        client_id: str,
        redirect_uri: str,
        scope: str,
        state: str,
        user_id: str,
        code_challenge: str,
        code_challenge_method: str,
    ) -> str:
        """
        Handle authorization request with PKCE.

        RFC 7636 Section 4.3: Server Stores code_challenge
        """
        # Validate code_challenge_method
        if code_challenge_method not in ("S256", "plain"):
            raise ValueError("Invalid code_challenge_method")

        # Prefer S256, reject plain unless specifically allowed
        if code_challenge_method == "plain":
            # Log warning - plain should only be used for legacy support
            pass

        # Generate authorization code
        code = secrets.token_urlsafe(32)

        # Store code with PKCE challenge
        self.codes[code] = StoredAuthorizationCode(
            code=code,
            client_id=client_id,
            redirect_uri=redirect_uri,
            scope=scope,
            user_id=user_id,
            tenant_id=self.tenant_id,
            code_challenge=code_challenge,
            code_challenge_method=code_challenge_method,
        )

        return f"{redirect_uri}?code={code}&state={state}"

    def exchange_code(
        self,
        code: str,
        client_id: str,
        redirect_uri: str,
        code_verifier: str,
    ) -> dict:
        """
        Exchange authorization code for tokens with PKCE verification.

        RFC 7636 Section 4.5: Client Sends the Code Verifier
        RFC 7636 Section 4.6: Server Verifies code_verifier
        """
        stored = self.codes.get(code)

        if not stored:
            raise OAuth2Error("invalid_grant", "Invalid authorization code")

        if stored.used:
            # Code reuse attack detected - revoke all associated tokens
            self._revoke_tokens_for_user(stored.user_id)
            raise OAuth2Error("invalid_grant", "Authorization code already used")

        if stored.expires_at < datetime.utcnow():
            raise OAuth2Error("invalid_grant", "Authorization code expired")

        if stored.client_id != client_id:
            raise OAuth2Error("invalid_grant", "Client mismatch")

        if stored.redirect_uri != redirect_uri:
            raise OAuth2Error("invalid_grant", "Redirect URI mismatch")

        # PKCE verification (RFC 7636 Section 4.6)
        if not PKCEValidator.validate(
            code_verifier,
            stored.code_challenge,
            stored.code_challenge_method,
        ):
            raise OAuth2Error("invalid_grant", "PKCE verification failed")

        # Mark code as used
        stored.used = True

        # Issue tokens
        return self._issue_tokens(stored)

    def _issue_tokens(self, stored: StoredAuthorizationCode) -> dict:
        """Issue access and refresh tokens."""
        return {
            "access_token": secrets.token_urlsafe(32),
            "token_type": "Bearer",
            "expires_in": 3600,
            "refresh_token": secrets.token_urlsafe(32),
            "scope": stored.scope,
        }

    def _revoke_tokens_for_user(self, user_id: str):
        """Revoke all tokens for user (security measure)."""
        pass
```

### Client Implementation

```typescript
// TypeScript PKCE Client Implementation

interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

async function generatePKCE(): Promise<PKCEChallenge> {
  // Generate code_verifier
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  const codeVerifier = base64UrlEncode(array);

  // Generate code_challenge using S256
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const codeChallenge = base64UrlEncode(new Uint8Array(digest));

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256",
  };
}

function base64UrlEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

class OAuth2PKCEClient {
  private authorizationEndpoint: string;
  private tokenEndpoint: string;
  private clientId: string;
  private redirectUri: string;

  constructor(config: { authorizationEndpoint: string; tokenEndpoint: string; clientId: string; redirectUri: string }) {
    this.authorizationEndpoint = config.authorizationEndpoint;
    this.tokenEndpoint = config.tokenEndpoint;
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
  }

  async startAuthorization(scope: string): Promise<string> {
    const pkce = await generatePKCE();
    const state = crypto.randomUUID();

    // Store PKCE verifier and state securely
    sessionStorage.setItem("pkce_verifier", pkce.codeVerifier);
    sessionStorage.setItem("oauth_state", state);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope,
      state,
      code_challenge: pkce.codeChallenge,
      code_challenge_method: pkce.codeChallengeMethod,
    });

    return `${this.authorizationEndpoint}?${params}`;
  }

  async handleCallback(callbackUrl: string): Promise<TokenResponse> {
    const url = new URL(callbackUrl);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    // Verify state
    const storedState = sessionStorage.getItem("oauth_state");
    if (state !== storedState) {
      throw new Error("State mismatch - possible CSRF attack");
    }

    // Get stored PKCE verifier
    const codeVerifier = sessionStorage.getItem("pkce_verifier");
    if (!codeVerifier) {
      throw new Error("PKCE verifier not found");
    }

    // Exchange code for tokens
    const response = await fetch(this.tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code!,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        code_verifier: codeVerifier,
      }),
    });

    // Clean up stored values
    sessionStorage.removeItem("pkce_verifier");
    sessionStorage.removeItem("oauth_state");

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || error.error);
    }

    return response.json();
  }
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}
```

## Multi-Tenancy Considerations

### Tenant-Specific PKCE Storage

```python
class MultiTenantPKCEServer:
    """PKCE-enabled OAuth server with tenant isolation."""

    def __init__(self):
        self.tenant_codes: dict[str, dict[str, StoredAuthorizationCode]] = {}

    def store_code(self, tenant_id: str, code: StoredAuthorizationCode):
        """Store authorization code in tenant-specific storage."""
        if tenant_id not in self.tenant_codes:
            self.tenant_codes[tenant_id] = {}
        self.tenant_codes[tenant_id][code.code] = code

    def get_code(self, tenant_id: str, code: str) -> Optional[StoredAuthorizationCode]:
        """Retrieve code with tenant isolation."""
        tenant_codes = self.tenant_codes.get(tenant_id, {})
        stored = tenant_codes.get(code)

        # Verify tenant matches
        if stored and stored.tenant_id != tenant_id:
            return None  # Cross-tenant access denied

        return stored
```

## Security Requirements

Per RFC 7636 and RFC 9700 (Security BCP):

1. **Always use S256** - Never use "plain" in production
2. **PKCE is mandatory** - Required for ALL clients (public and confidential)
3. **Secure storage** - Store code_verifier securely on client
4. **One-time use** - Authorization codes must be single-use
5. **Short lifetime** - Codes should expire in 10 minutes or less

## Related RFCs

| RFC      | Title        | Relationship       |
| -------- | ------------ | ------------------ |
| RFC 6749 | OAuth 2.0    | Base framework     |
| RFC 9700 | Security BCP | Mandates PKCE      |
| RFC 9126 | PAR          | Enhanced with PKCE |

## Output Format

Provide:

- PKCE generation implementations
- OAuth integration patterns
- Client-side storage strategies
- Multi-tenant isolation patterns
