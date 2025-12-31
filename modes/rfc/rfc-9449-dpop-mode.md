---
title: RFC 9449 - DPoP (Demonstrating Proof-of-Possession)
description: Sender-constrained access tokens using DPoP for enhanced OAuth 2.0 security
rfc: 9449
tags: [oauth, dpop, proof-of-possession, security, multi-tenancy]
---

# RFC 9449 - Demonstrating Proof-of-Possession (DPoP)

You are an expert in implementing DPoP as defined in RFC 9449. DPoP provides sender-constrained access tokens that are bound to a cryptographic key, preventing token theft and replay attacks.

## RFC Overview

| Property | Value |
|----------|-------|
| RFC Number | 9449 |
| Title | OAuth 2.0 Demonstrating Proof-of-Possession (DPoP) |
| Status | Proposed Standard |
| Published | September 2023 |
| Extends | RFC 6749, RFC 6750 |

## DPoP Flow

```
+--------+                                  +---------------+
|        |                                  |               |
|        |--(1)-- Token Request ---------->| Authorization |
|        |        + DPoP Proof             |    Server     |
|        |                                  |               |
|        |<-(2)-- DPoP-bound Access Token --|               |
|        |        token_type=DPoP           |               |
| Client |                                  +---------------+
|        |
|        |                                  +---------------+
|        |--(3)-- Resource Request ------->|               |
|        |        DPoP: <proof>             |   Resource    |
|        |        Authorization: DPoP <at>  |    Server     |
|        |                                  |               |
|        |<-(4)-- Protected Resource ------|               |
+--------+                                  +---------------+
```

## DPoP Proof Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                        DPoP Proof JWT                            │
│                                                                  │
│  Header:                                                         │
│  {                                                               │
│    "typ": "dpop+jwt",                                           │
│    "alg": "ES256",                                              │
│    "jwk": {                           <- Public key embedded    │
│      "kty": "EC",                                               │
│      "crv": "P-256",                                            │
│      "x": "...",                                                │
│      "y": "..."                                                 │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  Payload:                                                        │
│  {                                                               │
│    "jti": "unique-id",                <- Unique identifier      │
│    "htm": "POST",                     <- HTTP method            │
│    "htu": "https://server/token",     <- HTTP URI               │
│    "iat": 1234567890,                 <- Issued at              │
│    "ath": "fUHyO2r2..."               <- Access token hash      │
│  }                                     (only for resource req)  │
│                                                                  │
│  Signature: signed with private key                             │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation

### DPoP Key Pair Generation

```python
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import json
import base64
import hashlib
import time
import secrets

class DPoPKeyPair:
    """DPoP asymmetric key pair for proof generation."""

    def __init__(self, curve=ec.SECP256R1()):
        self.private_key = ec.generate_private_key(curve, default_backend())
        self.public_key = self.private_key.public_key()

    def get_jwk(self) -> dict:
        """Get public key as JWK for DPoP proof header."""
        public_numbers = self.public_key.public_numbers()

        # Encode coordinates as base64url
        x = base64.urlsafe_b64encode(
            public_numbers.x.to_bytes(32, 'big')
        ).decode().rstrip('=')

        y = base64.urlsafe_b64encode(
            public_numbers.y.to_bytes(32, 'big')
        ).decode().rstrip('=')

        return {
            "kty": "EC",
            "crv": "P-256",
            "x": x,
            "y": y,
        }

    def get_thumbprint(self) -> str:
        """Calculate JWK thumbprint (RFC 7638)."""
        jwk = self.get_jwk()

        # Canonical JSON representation
        canonical = json.dumps(
            {"crv": jwk["crv"], "kty": jwk["kty"], "x": jwk["x"], "y": jwk["y"]},
            separators=(',', ':'),
            sort_keys=True,
        )

        digest = hashlib.sha256(canonical.encode()).digest()
        return base64.urlsafe_b64encode(digest).decode().rstrip('=')


class DPoPProofBuilder:
    """Build DPoP proofs for OAuth 2.0 requests."""

    def __init__(self, key_pair: DPoPKeyPair):
        self.key_pair = key_pair

    def create_proof(
        self,
        http_method: str,
        http_uri: str,
        access_token: str = None,
        nonce: str = None,
    ) -> str:
        """
        Create a DPoP proof JWT.

        RFC 9449 Section 4: DPoP Proof JWT Syntax

        Args:
            http_method: The HTTP method (GET, POST, etc.)
            http_uri: The HTTP URI (scheme + host + path, no query/fragment)
            access_token: Access token for ath claim (resource requests only)
            nonce: Server-provided nonce for replay protection

        Returns:
            DPoP proof JWT string
        """
        header = {
            "typ": "dpop+jwt",
            "alg": "ES256",
            "jwk": self.key_pair.get_jwk(),
        }

        payload = {
            "jti": secrets.token_urlsafe(16),
            "htm": http_method.upper(),
            "htu": self._normalize_uri(http_uri),
            "iat": int(time.time()),
        }

        # Add access token hash for resource requests
        if access_token:
            ath = hashlib.sha256(access_token.encode('ascii')).digest()
            payload["ath"] = base64.urlsafe_b64encode(ath).decode().rstrip('=')

        # Add nonce if provided by server
        if nonce:
            payload["nonce"] = nonce

        return self._sign_jwt(header, payload)

    def _normalize_uri(self, uri: str) -> str:
        """Normalize URI per RFC 9449 Section 4.1."""
        from urllib.parse import urlparse

        parsed = urlparse(uri)
        # Remove query and fragment, keep scheme + host + path
        return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

    def _sign_jwt(self, header: dict, payload: dict) -> str:
        """Sign JWT with private key."""
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.asymmetric import ec

        header_b64 = self._base64url_encode(json.dumps(header))
        payload_b64 = self._base64url_encode(json.dumps(payload))

        signing_input = f"{header_b64}.{payload_b64}".encode()

        signature = self.key_pair.private_key.sign(
            signing_input,
            ec.ECDSA(hashes.SHA256())
        )

        # Convert DER signature to raw R||S format
        from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
        r, s = decode_dss_signature(signature)
        raw_signature = r.to_bytes(32, 'big') + s.to_bytes(32, 'big')

        signature_b64 = base64.urlsafe_b64encode(raw_signature).decode().rstrip('=')

        return f"{header_b64}.{payload_b64}.{signature_b64}"

    @staticmethod
    def _base64url_encode(data: str) -> str:
        return base64.urlsafe_b64encode(data.encode()).decode().rstrip('=')
```

### DPoP-Enabled OAuth Client

```typescript
// TypeScript DPoP Client Implementation

interface DPoPKeyPair {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  jwk: JsonWebKey;
}

class DPoPClient {
  private keyPair: DPoPKeyPair | null = null;
  private nonce: string | null = null;

  async initialize(): Promise<void> {
    // Generate ECDSA key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,  // extractable
      ['sign', 'verify']
    );

    const jwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

    this.keyPair = {
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      jwk: {
        kty: jwk.kty,
        crv: jwk.crv,
        x: jwk.x,
        y: jwk.y,
      },
    };
  }

  async createProof(
    method: string,
    uri: string,
    accessToken?: string
  ): Promise<string> {
    if (!this.keyPair) {
      throw new Error('DPoP not initialized');
    }

    const header = {
      typ: 'dpop+jwt',
      alg: 'ES256',
      jwk: this.keyPair.jwk,
    };

    const payload: Record<string, any> = {
      jti: crypto.randomUUID(),
      htm: method.toUpperCase(),
      htu: this.normalizeUri(uri),
      iat: Math.floor(Date.now() / 1000),
    };

    // Add access token hash for resource requests
    if (accessToken) {
      const encoder = new TextEncoder();
      const data = encoder.encode(accessToken);
      const hash = await crypto.subtle.digest('SHA-256', data);
      payload.ath = this.base64UrlEncode(new Uint8Array(hash));
    }

    // Add nonce if we have one from the server
    if (this.nonce) {
      payload.nonce = this.nonce;
    }

    return this.signJwt(header, payload);
  }

  async requestToken(
    tokenEndpoint: string,
    params: URLSearchParams
  ): Promise<TokenResponse> {
    const proof = await this.createProof('POST', tokenEndpoint);

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'DPoP': proof,
      },
      body: params,
    });

    // Handle DPoP-Nonce
    const newNonce = response.headers.get('DPoP-Nonce');
    if (newNonce) {
      this.nonce = newNonce;

      // Retry with nonce if error
      if (response.status === 400) {
        const retryProof = await this.createProof('POST', tokenEndpoint);
        return this.retryRequest(tokenEndpoint, params, retryProof);
      }
    }

    return response.json();
  }

  async callApi(
    url: string,
    accessToken: string,
    method: string = 'GET',
    body?: any
  ): Promise<Response> {
    const proof = await this.createProof(method, url, accessToken);

    const headers: Record<string, string> = {
      'Authorization': `DPoP ${accessToken}`,
      'DPoP': proof,
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Update nonce if provided
    const newNonce = response.headers.get('DPoP-Nonce');
    if (newNonce) {
      this.nonce = newNonce;
    }

    return response;
  }

  private normalizeUri(uri: string): string {
    const url = new URL(uri);
    return `${url.protocol}//${url.host}${url.pathname}`;
  }

  private async signJwt(
    header: object,
    payload: object
  ): Promise<string> {
    const headerB64 = this.base64UrlEncode(
      new TextEncoder().encode(JSON.stringify(header))
    );
    const payloadB64 = this.base64UrlEncode(
      new TextEncoder().encode(JSON.stringify(payload))
    );

    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      this.keyPair!.privateKey,
      signingInput
    );

    const signatureB64 = this.base64UrlEncode(new Uint8Array(signature));

    return `${headerB64}.${payloadB64}.${signatureB64}`;
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

// Usage
const dpop = new DPoPClient();
await dpop.initialize();

// Token request
const tokenResponse = await dpop.requestToken(
  'https://auth.example.com/token',
  new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: pkceVerifier,
  })
);

// API call with DPoP-bound token
const apiResponse = await dpop.callApi(
  'https://api.example.com/users',
  tokenResponse.access_token
);
```

### Server-Side DPoP Validation

```python
from dataclasses import dataclass
from typing import Optional, Set
import time
import hashlib

@dataclass
class DPoPValidationResult:
    valid: bool
    jkt: Optional[str] = None  # JWK Thumbprint
    error: Optional[str] = None

class DPoPValidator:
    """Validate DPoP proofs per RFC 9449."""

    def __init__(
        self,
        allowed_algorithms: list[str] = None,
        max_age_seconds: int = 60,
        nonce_store: Optional[Set[str]] = None,
    ):
        self.allowed_algorithms = allowed_algorithms or ["ES256", "ES384", "ES512"]
        self.max_age = max_age_seconds
        self.used_jtis: Set[str] = set()  # For replay protection
        self.nonce_store = nonce_store

    def validate_for_token_request(
        self,
        dpop_proof: str,
        http_method: str,
        http_uri: str,
        expected_nonce: Optional[str] = None,
    ) -> DPoPValidationResult:
        """
        Validate DPoP proof for token endpoint.

        RFC 9449 Section 4.3: Checking DPoP Proofs
        """
        return self._validate(
            dpop_proof,
            http_method,
            http_uri,
            expected_nonce=expected_nonce,
            access_token=None,
        )

    def validate_for_resource_request(
        self,
        dpop_proof: str,
        http_method: str,
        http_uri: str,
        access_token: str,
        expected_jkt: str,
        expected_nonce: Optional[str] = None,
    ) -> DPoPValidationResult:
        """
        Validate DPoP proof for resource server.

        RFC 9449 Section 7.1: Checking DPoP Proofs
        """
        result = self._validate(
            dpop_proof,
            http_method,
            http_uri,
            expected_nonce=expected_nonce,
            access_token=access_token,
        )

        if not result.valid:
            return result

        # Verify JWK thumbprint matches token binding
        if result.jkt != expected_jkt:
            return DPoPValidationResult(
                valid=False,
                error="DPoP proof key does not match token binding"
            )

        return result

    def _validate(
        self,
        dpop_proof: str,
        http_method: str,
        http_uri: str,
        expected_nonce: Optional[str],
        access_token: Optional[str],
    ) -> DPoPValidationResult:
        """Core DPoP validation logic."""
        try:
            # Decode JWT without verification first
            parts = dpop_proof.split('.')
            if len(parts) != 3:
                return DPoPValidationResult(valid=False, error="Invalid JWT format")

            import base64
            import json

            def decode_b64(s):
                padding = 4 - len(s) % 4
                if padding != 4:
                    s += '=' * padding
                return base64.urlsafe_b64decode(s)

            header = json.loads(decode_b64(parts[0]))
            payload = json.loads(decode_b64(parts[1]))

            # Validate header
            if header.get("typ") != "dpop+jwt":
                return DPoPValidationResult(valid=False, error="Invalid typ")

            alg = header.get("alg")
            if alg not in self.allowed_algorithms:
                return DPoPValidationResult(valid=False, error=f"Algorithm {alg} not allowed")

            jwk = header.get("jwk")
            if not jwk:
                return DPoPValidationResult(valid=False, error="Missing jwk in header")

            # Validate payload
            if payload.get("htm", "").upper() != http_method.upper():
                return DPoPValidationResult(valid=False, error="Method mismatch")

            if not self._uri_matches(payload.get("htu", ""), http_uri):
                return DPoPValidationResult(valid=False, error="URI mismatch")

            iat = payload.get("iat")
            if not iat or abs(time.time() - iat) > self.max_age:
                return DPoPValidationResult(valid=False, error="Proof too old or future-dated")

            jti = payload.get("jti")
            if not jti:
                return DPoPValidationResult(valid=False, error="Missing jti")

            if jti in self.used_jtis:
                return DPoPValidationResult(valid=False, error="Replay detected")

            # Validate nonce if required
            if expected_nonce and payload.get("nonce") != expected_nonce:
                return DPoPValidationResult(valid=False, error="Invalid nonce")

            # Validate ath for resource requests
            if access_token:
                expected_ath = base64.urlsafe_b64encode(
                    hashlib.sha256(access_token.encode('ascii')).digest()
                ).decode().rstrip('=')

                if payload.get("ath") != expected_ath:
                    return DPoPValidationResult(valid=False, error="Invalid access token hash")

            # Verify signature
            if not self._verify_signature(dpop_proof, jwk, alg):
                return DPoPValidationResult(valid=False, error="Invalid signature")

            # Calculate JWK thumbprint
            jkt = self._calculate_thumbprint(jwk)

            # Mark jti as used
            self.used_jtis.add(jti)

            return DPoPValidationResult(valid=True, jkt=jkt)

        except Exception as e:
            return DPoPValidationResult(valid=False, error=str(e))

    def _uri_matches(self, proof_uri: str, request_uri: str) -> bool:
        """Compare URIs per RFC 9449."""
        from urllib.parse import urlparse

        proof = urlparse(proof_uri)
        request = urlparse(request_uri)

        return (
            proof.scheme == request.scheme and
            proof.netloc == request.netloc and
            proof.path == request.path
        )

    def _calculate_thumbprint(self, jwk: dict) -> str:
        """Calculate JWK thumbprint per RFC 7638."""
        if jwk.get("kty") == "EC":
            canonical = json.dumps(
                {"crv": jwk["crv"], "kty": "EC", "x": jwk["x"], "y": jwk["y"]},
                separators=(',', ':'),
                sort_keys=True,
            )
        else:
            raise ValueError(f"Unsupported key type: {jwk.get('kty')}")

        digest = hashlib.sha256(canonical.encode()).digest()
        return base64.urlsafe_b64encode(digest).decode().rstrip('=')

    def _verify_signature(self, jwt: str, jwk: dict, alg: str) -> bool:
        """Verify JWT signature using JWK."""
        # Implementation would use cryptography library
        # to verify ECDSA/RSA signature
        return True  # Placeholder
```

## Multi-Tenancy with DPoP

### Tenant-Bound DPoP Tokens

```python
class MultiTenantDPoPServer:
    """DPoP-enabled authorization server with multi-tenancy."""

    def issue_dpop_token(
        self,
        tenant_id: str,
        client_id: str,
        user_id: str,
        dpop_jkt: str,  # JWK Thumbprint from DPoP proof
        scope: str,
    ) -> dict:
        """Issue DPoP-bound access token."""

        # Create token with DPoP binding
        claims = {
            "iss": f"https://{tenant_id}.auth.example.com",
            "sub": user_id,
            "aud": f"https://{tenant_id}.api.example.com",
            "client_id": client_id,
            "tenant_id": tenant_id,
            "scope": scope,
            "cnf": {
                "jkt": dpop_jkt  # Key binding per RFC 9449 Section 6
            },
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600,
        }

        access_token = self._sign_token(claims, tenant_id)

        return {
            "access_token": access_token,
            "token_type": "DPoP",  # Important: not "Bearer"
            "expires_in": 3600,
        }
```

## Security Considerations

1. **Key Binding** - Tokens are cryptographically bound to client key
2. **Replay Protection** - jti claim prevents replay attacks
3. **Nonce Support** - Server can require fresh proofs
4. **Token Theft Mitigation** - Stolen tokens unusable without private key

## Related RFCs

| RFC | Title | Relationship |
|-----|-------|--------------|
| RFC 6749 | OAuth 2.0 | Base framework |
| RFC 8705 | mTLS | Alternative binding |
| RFC 7638 | JWK Thumbprint | Key identification |
| RFC 9700 | Security BCP | Recommends DPoP |

## Output Format

Provide:
- DPoP proof generation
- Token binding implementations
- Validation patterns
- Multi-tenant key management
