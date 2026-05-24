---
name: rfc-7519-jwt
description: Complete JWT implementation guide with claims validation and multi-tenancy patterns
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: rfc
  tags: [jwt, jose, token, claims, multi-tenancy]
---

# RFC 7519 - JSON Web Token (JWT)

You are an expert in implementing JSON Web Tokens as defined in RFC 7519. You create secure, standards-compliant JWTs with proper claims validation and multi-tenancy support.

## RFC Overview

| Property   | Value                          |
| ---------- | ------------------------------ |
| RFC Number | 7519                           |
| Title      | JSON Web Token (JWT)           |
| Status     | Proposed Standard              |
| Published  | May 2015                       |
| Requires   | RFC 7515 (JWS), RFC 7516 (JWE) |

## JWT Structure

```text
┌─────────────────────────────────────────────────────────────────┐
│                         JSON Web Token                           │
│                                                                  │
│  ┌────────────┐   ┌────────────────────┐   ┌────────────────┐  │
│  │   HEADER   │ . │      PAYLOAD       │ . │   SIGNATURE    │  │
│  │  (Base64)  │   │     (Base64)       │   │    (Base64)    │  │
│  └────────────┘   └────────────────────┘   └────────────────┘  │
│                                                                  │
│  eyJhbGciOiJS . eyJzdWIiOiIxMjM0 . SflKxwRJSMeKKF             │
│  UzI1NiIsInR5     NTY3ODkwIiwibmF     2QT4fwpMeJf36P            │
│  cCI6IkpXVCJ9     tZSI6IkpvaG4gRG     Ok1bAoHlXxq_cY            │
│                   9lIiwiaWF0Ijox     ...                         │
│                   NTE2MjM5MDIyfQ                                │
└─────────────────────────────────────────────────────────────────┘
```

## Standard Claims (RFC 7519 Section 4.1)

| Claim | Name       | Description                 | Required    |
| ----- | ---------- | --------------------------- | ----------- |
| iss   | Issuer     | Token issuer identifier     | Recommended |
| sub   | Subject    | Principal (user) identifier | Recommended |
| aud   | Audience   | Intended recipient(s)       | Recommended |
| exp   | Expiration | Token expiration timestamp  | Recommended |
| nbf   | Not Before | Token validity start time   | Optional    |
| iat   | Issued At  | Token creation timestamp    | Recommended |
| jti   | JWT ID     | Unique token identifier     | Optional    |

## Implementation

### JWT Creation and Validation

```python
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional, List, Union, Any
import json
import base64
import hmac
import hashlib
import secrets

@dataclass
class JWTHeader:
    """JWT Header (RFC 7519 Section 5)."""
    alg: str  # Algorithm
    typ: str = "JWT"
    kid: Optional[str] = None  # Key ID

    def to_dict(self) -> dict:
        d = {"alg": self.alg, "typ": self.typ}
        if self.kid:
            d["kid"] = self.kid
        return d

@dataclass
class JWTClaims:
    """JWT Claims Set (RFC 7519 Section 4)."""
    # Registered claims
    iss: Optional[str] = None  # Issuer
    sub: Optional[str] = None  # Subject
    aud: Optional[Union[str, List[str]]] = None  # Audience
    exp: Optional[int] = None  # Expiration Time
    nbf: Optional[int] = None  # Not Before
    iat: Optional[int] = None  # Issued At
    jti: Optional[str] = None  # JWT ID

    # Multi-tenancy claims
    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None

    # Application-specific claims
    scope: Optional[str] = None
    roles: Optional[List[str]] = None
    permissions: Optional[List[str]] = None

    # Custom claims
    custom: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = {}
        for claim in ["iss", "sub", "aud", "exp", "nbf", "iat", "jti",
                      "tenant_id", "tenant_name", "scope", "roles", "permissions"]:
            value = getattr(self, claim)
            if value is not None:
                d[claim] = value
        d.update(self.custom)
        return d

    @classmethod
    def from_dict(cls, data: dict) -> "JWTClaims":
        known_claims = {"iss", "sub", "aud", "exp", "nbf", "iat", "jti",
                        "tenant_id", "tenant_name", "scope", "roles", "permissions"}
        custom = {k: v for k, v in data.items() if k not in known_claims}
        return cls(
            iss=data.get("iss"),
            sub=data.get("sub"),
            aud=data.get("aud"),
            exp=data.get("exp"),
            nbf=data.get("nbf"),
            iat=data.get("iat"),
            jti=data.get("jti"),
            tenant_id=data.get("tenant_id"),
            tenant_name=data.get("tenant_name"),
            scope=data.get("scope"),
            roles=data.get("roles"),
            permissions=data.get("permissions"),
            custom=custom,
        )


class JWTBuilder:
    """Build JWTs with proper claims."""

    def __init__(
        self,
        issuer: str,
        signing_key: bytes,
        algorithm: str = "HS256",
        key_id: Optional[str] = None,
    ):
        self.issuer = issuer
        self.signing_key = signing_key
        self.algorithm = algorithm
        self.key_id = key_id

    def build(
        self,
        subject: str,
        audience: Union[str, List[str]],
        tenant_id: str,
        expires_in: int = 3600,
        scope: Optional[str] = None,
        roles: Optional[List[str]] = None,
        custom_claims: Optional[dict] = None,
    ) -> str:
        """
        Build a JWT with standard and custom claims.

        Args:
            subject: User/principal identifier
            audience: Intended recipient(s)
            tenant_id: Tenant identifier for multi-tenancy
            expires_in: Token lifetime in seconds
            scope: OAuth 2.0 scope
            roles: User roles
            custom_claims: Additional claims

        Returns:
            Encoded JWT string
        """
        now = datetime.utcnow()

        claims = JWTClaims(
            iss=self.issuer,
            sub=subject,
            aud=audience,
            exp=int((now + timedelta(seconds=expires_in)).timestamp()),
            iat=int(now.timestamp()),
            nbf=int(now.timestamp()),
            jti=secrets.token_urlsafe(16),
            tenant_id=tenant_id,
            scope=scope,
            roles=roles,
            custom=custom_claims or {},
        )

        return self._encode(claims)

    def _encode(self, claims: JWTClaims) -> str:
        """Encode JWT with signature."""
        header = JWTHeader(alg=self.algorithm, kid=self.key_id)

        # Base64url encode header and payload
        header_b64 = self._base64url_encode(json.dumps(header.to_dict()))
        payload_b64 = self._base64url_encode(json.dumps(claims.to_dict()))

        # Create signature
        signing_input = f"{header_b64}.{payload_b64}"
        signature = self._sign(signing_input)
        signature_b64 = self._base64url_encode_bytes(signature)

        return f"{header_b64}.{payload_b64}.{signature_b64}"

    def _sign(self, data: str) -> bytes:
        """Sign data using configured algorithm."""
        if self.algorithm == "HS256":
            return hmac.new(
                self.signing_key,
                data.encode(),
                hashlib.sha256
            ).digest()
        elif self.algorithm == "HS384":
            return hmac.new(
                self.signing_key,
                data.encode(),
                hashlib.sha384
            ).digest()
        elif self.algorithm == "HS512":
            return hmac.new(
                self.signing_key,
                data.encode(),
                hashlib.sha512
            ).digest()
        else:
            raise ValueError(f"Unsupported algorithm: {self.algorithm}")

    @staticmethod
    def _base64url_encode(data: str) -> str:
        return base64.urlsafe_b64encode(data.encode()).decode().rstrip("=")

    @staticmethod
    def _base64url_encode_bytes(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode().rstrip("=")


@dataclass
class JWTValidationResult:
    """Result of JWT validation."""
    valid: bool
    claims: Optional[JWTClaims] = None
    error: Optional[str] = None


class JWTValidator:
    """Validate JWTs with comprehensive checks."""

    def __init__(
        self,
        signing_key: bytes,
        issuer: str,
        audience: Union[str, List[str]],
        algorithms: List[str] = None,
        clock_skew: int = 60,  # seconds
    ):
        self.signing_key = signing_key
        self.issuer = issuer
        self.audience = audience if isinstance(audience, list) else [audience]
        self.algorithms = algorithms or ["HS256"]
        self.clock_skew = clock_skew

    def validate(
        self,
        token: str,
        required_tenant: Optional[str] = None,
        required_scope: Optional[str] = None,
    ) -> JWTValidationResult:
        """
        Validate JWT with all standard checks.

        RFC 7519 Section 7.2: Validating a JWT
        """
        try:
            # Split token
            parts = token.split(".")
            if len(parts) != 3:
                return JWTValidationResult(valid=False, error="Invalid token format")

            header_b64, payload_b64, signature_b64 = parts

            # Decode header
            header = json.loads(self._base64url_decode(header_b64))

            # Verify algorithm
            alg = header.get("alg")
            if alg not in self.algorithms:
                return JWTValidationResult(
                    valid=False,
                    error=f"Algorithm {alg} not allowed"
                )

            # Verify signature
            signing_input = f"{header_b64}.{payload_b64}"
            expected_sig = self._sign(signing_input, alg)
            actual_sig = self._base64url_decode_bytes(signature_b64)

            if not hmac.compare_digest(expected_sig, actual_sig):
                return JWTValidationResult(valid=False, error="Invalid signature")

            # Decode payload
            payload = json.loads(self._base64url_decode(payload_b64))
            claims = JWTClaims.from_dict(payload)

            # Validate claims
            now = datetime.utcnow().timestamp()

            # Check exp
            if claims.exp and claims.exp < now - self.clock_skew:
                return JWTValidationResult(valid=False, error="Token expired")

            # Check nbf
            if claims.nbf and claims.nbf > now + self.clock_skew:
                return JWTValidationResult(valid=False, error="Token not yet valid")

            # Check iss
            if claims.iss != self.issuer:
                return JWTValidationResult(valid=False, error="Invalid issuer")

            # Check aud
            token_aud = claims.aud if isinstance(claims.aud, list) else [claims.aud]
            if not any(aud in self.audience for aud in token_aud if aud):
                return JWTValidationResult(valid=False, error="Invalid audience")

            # Check tenant
            if required_tenant and claims.tenant_id != required_tenant:
                return JWTValidationResult(
                    valid=False,
                    error="Token not valid for this tenant"
                )

            # Check scope
            if required_scope:
                token_scopes = set(claims.scope.split() if claims.scope else [])
                required_scopes = set(required_scope.split())
                if not required_scopes.issubset(token_scopes):
                    return JWTValidationResult(
                        valid=False,
                        error="Insufficient scope"
                    )

            return JWTValidationResult(valid=True, claims=claims)

        except Exception as e:
            return JWTValidationResult(valid=False, error=str(e))

    def _sign(self, data: str, algorithm: str) -> bytes:
        """Sign data using specified algorithm."""
        hash_funcs = {
            "HS256": hashlib.sha256,
            "HS384": hashlib.sha384,
            "HS512": hashlib.sha512,
        }
        return hmac.new(
            self.signing_key,
            data.encode(),
            hash_funcs[algorithm]
        ).digest()

    @staticmethod
    def _base64url_decode(data: str) -> str:
        padding = 4 - len(data) % 4
        if padding != 4:
            data += "=" * padding
        return base64.urlsafe_b64decode(data).decode()

    @staticmethod
    def _base64url_decode_bytes(data: str) -> bytes:
        padding = 4 - len(data) % 4
        if padding != 4:
            data += "=" * padding
        return base64.urlsafe_b64decode(data)
```

### RSA Signing (Production)

```python
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization

class RSAJWTBuilder:
    """JWT builder using RSA signatures (RS256/RS384/RS512)."""

    def __init__(
        self,
        private_key: rsa.RSAPrivateKey,
        issuer: str,
        key_id: str,
        algorithm: str = "RS256",
    ):
        self.private_key = private_key
        self.issuer = issuer
        self.key_id = key_id
        self.algorithm = algorithm

    def build(
        self,
        subject: str,
        audience: Union[str, List[str]],
        tenant_id: str,
        expires_in: int = 3600,
        **additional_claims,
    ) -> str:
        """Build RSA-signed JWT."""
        now = datetime.utcnow()

        header = {
            "alg": self.algorithm,
            "typ": "JWT",
            "kid": self.key_id,
        }

        payload = {
            "iss": self.issuer,
            "sub": subject,
            "aud": audience,
            "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
            "iat": int(now.timestamp()),
            "nbf": int(now.timestamp()),
            "jti": secrets.token_urlsafe(16),
            "tenant_id": tenant_id,
            **additional_claims,
        }

        header_b64 = self._base64url_encode(json.dumps(header))
        payload_b64 = self._base64url_encode(json.dumps(payload))

        signing_input = f"{header_b64}.{payload_b64}".encode()

        # Get hash algorithm
        hash_algs = {
            "RS256": hashes.SHA256(),
            "RS384": hashes.SHA384(),
            "RS512": hashes.SHA512(),
        }

        signature = self.private_key.sign(
            signing_input,
            padding.PKCS1v15(),
            hash_algs[self.algorithm],
        )

        signature_b64 = self._base64url_encode_bytes(signature)

        return f"{header_b64}.{payload_b64}.{signature_b64}"

    @staticmethod
    def _base64url_encode(data: str) -> str:
        return base64.urlsafe_b64encode(data.encode()).decode().rstrip("=")

    @staticmethod
    def _base64url_encode_bytes(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode().rstrip("=")
```

## Multi-Tenancy Patterns

### Tenant-Scoped JWT Issuer

```python
class MultiTenantJWTService:
    """JWT service with tenant isolation."""

    def __init__(self, master_key: bytes):
        self.master_key = master_key
        self.tenant_keys: dict[str, bytes] = {}

    def get_tenant_key(self, tenant_id: str) -> bytes:
        """Derive tenant-specific signing key."""
        if tenant_id not in self.tenant_keys:
            # Derive key using HKDF
            from cryptography.hazmat.primitives.kdf.hkdf import HKDF
            from cryptography.hazmat.primitives import hashes

            hkdf = HKDF(
                algorithm=hashes.SHA256(),
                length=32,
                salt=None,
                info=f"jwt-signing-{tenant_id}".encode(),
            )
            self.tenant_keys[tenant_id] = hkdf.derive(self.master_key)

        return self.tenant_keys[tenant_id]

    def create_token(
        self,
        tenant_id: str,
        subject: str,
        scope: str,
        expires_in: int = 3600,
    ) -> str:
        """Create tenant-scoped JWT."""
        key = self.get_tenant_key(tenant_id)

        builder = JWTBuilder(
            issuer=f"https://{tenant_id}.auth.example.com",
            signing_key=key,
            algorithm="HS256",
        )

        return builder.build(
            subject=subject,
            audience=f"https://{tenant_id}.api.example.com",
            tenant_id=tenant_id,
            expires_in=expires_in,
            scope=scope,
        )

    def validate_token(
        self,
        token: str,
        expected_tenant: str,
    ) -> JWTValidationResult:
        """Validate JWT for specific tenant."""
        key = self.get_tenant_key(expected_tenant)

        validator = JWTValidator(
            signing_key=key,
            issuer=f"https://{expected_tenant}.auth.example.com",
            audience=f"https://{expected_tenant}.api.example.com",
        )

        return validator.validate(token, required_tenant=expected_tenant)
```

## Security Best Practices (RFC 8725)

```python
class SecureJWTConfig:
    """Security configuration per RFC 8725 JWT BCP."""

    # Allowed algorithms (never allow "none")
    ALLOWED_ALGORITHMS = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"]

    # Maximum token lifetime
    MAX_LIFETIME_SECONDS = 3600  # 1 hour

    # Clock skew tolerance
    CLOCK_SKEW_SECONDS = 60

    # Required claims
    REQUIRED_CLAIMS = ["iss", "sub", "aud", "exp", "iat"]

    @classmethod
    def validate_security(cls, header: dict, claims: dict) -> List[str]:
        """Validate JWT meets security requirements."""
        issues = []

        # Check algorithm
        alg = header.get("alg")
        if alg == "none":
            issues.append("Algorithm 'none' is not allowed")
        if alg and alg not in cls.ALLOWED_ALGORITHMS:
            issues.append(f"Algorithm {alg} is not allowed")

        # Check required claims
        for claim in cls.REQUIRED_CLAIMS:
            if claim not in claims:
                issues.append(f"Missing required claim: {claim}")

        # Check token lifetime
        if "exp" in claims and "iat" in claims:
            lifetime = claims["exp"] - claims["iat"]
            if lifetime > cls.MAX_LIFETIME_SECONDS:
                issues.append(f"Token lifetime {lifetime}s exceeds maximum {cls.MAX_LIFETIME_SECONDS}s")

        return issues
```

## Related RFCs

| RFC      | Title            | Relationship      |
| -------- | ---------------- | ----------------- |
| RFC 7515 | JWS              | Signature format  |
| RFC 7516 | JWE              | Encryption format |
| RFC 7517 | JWK              | Key format        |
| RFC 8725 | JWT BCP          | Security guidance |
| RFC 9068 | JWT Access Token | OAuth profile     |

## Output Format

Provide:

- JWT creation and validation implementations
- Multi-tenant key management
- Claims validation patterns
- Security configuration
