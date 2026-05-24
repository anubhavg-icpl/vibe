---
name: rfc-8705-mtls
description: Certificate-based client authentication and token binding for high-security OAuth 2.0
risk: unknown
source: community
kind: mode
category: rfc
tags: [oauth, mtls, certificates, security, multi-tenancy, identity-broker]
---

# RFC 8705 - OAuth 2.0 Mutual-TLS Client Authentication

You are an expert in implementing mTLS for OAuth 2.0 as defined in RFC 8705. You provide certificate-based client authentication and sender-constrained access tokens for high-security multi-tenant environments.

## RFC Overview

| Property   | Value                                                                          |
| ---------- | ------------------------------------------------------------------------------ |
| RFC Number | 8705                                                                           |
| Title      | OAuth 2.0 Mutual-TLS Client Authentication and Certificate-Bound Access Tokens |
| Status     | Proposed Standard                                                              |
| Published  | February 2020                                                                  |
| Extends    | RFC 6749                                                                       |

## mTLS Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     mTLS OAuth 2.0 Flow                                  │
│                                                                          │
│  ┌──────────────┐                           ┌──────────────────────┐   │
│  │              │   TLS with Client Cert    │                      │   │
│  │    Client    │◄─────────────────────────►│  Authorization       │   │
│  │  (with cert) │                           │  Server              │   │
│  │              │                           │                      │   │
│  └──────┬───────┘                           └──────────────────────┘   │
│         │                                                               │
│         │  Certificate-bound                                            │
│         │  Access Token                                                 │
│         │  (contains x5t#S256)                                         │
│         │                                                               │
│         ▼                                                               │
│  ┌──────────────┐   TLS with Client Cert    ┌──────────────────────┐   │
│  │              │◄─────────────────────────►│                      │   │
│  │   Resource   │   + Access Token          │  Resource Server     │   │
│  │   Request    │                           │  (validates cert     │   │
│  │              │                           │   matches token)     │   │
│  └──────────────┘                           └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Certificate Thumbprint Calculation

```python
import hashlib
import base64
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID
from datetime import datetime, timedelta

class CertificateThumbprint:
    """
    Calculate certificate thumbprint for mTLS token binding.

    RFC 8705 Section 3: Certificate Thumbprint Confirmation Method
    """

    @staticmethod
    def calculate_x5t_s256(cert_pem: bytes) -> str:
        """
        Calculate x5t#S256 thumbprint.

        This is the SHA-256 hash of the DER-encoded certificate,
        base64url encoded.
        """
        cert = x509.load_pem_x509_certificate(cert_pem, default_backend())
        der_bytes = cert.public_bytes(serialization.Encoding.DER)
        digest = hashlib.sha256(der_bytes).digest()
        return base64.urlsafe_b64encode(digest).decode().rstrip('=')

    @staticmethod
    def from_tls_connection(ssl_socket) -> str:
        """Extract certificate thumbprint from TLS connection."""
        peer_cert_der = ssl_socket.getpeercert(binary_form=True)
        digest = hashlib.sha256(peer_cert_der).digest()
        return base64.urlsafe_b64encode(digest).decode().rstrip('=')
```

## Implementation

### mTLS Client Authentication

```python
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum
import ssl

class MTLSClientAuthMethod(Enum):
    """RFC 8705 Section 2: Client Authentication Methods"""
    TLS_CLIENT_AUTH = "tls_client_auth"  # PKI-based
    SELF_SIGNED_TLS_CLIENT_AUTH = "self_signed_tls_client_auth"  # Self-signed

@dataclass
class MTLSClientConfig:
    """mTLS client configuration for multi-tenant environment."""
    client_id: str
    tenant_id: str
    auth_method: MTLSClientAuthMethod

    # For tls_client_auth (PKI)
    tls_client_auth_subject_dn: Optional[str] = None
    tls_client_auth_san_dns: Optional[str] = None
    tls_client_auth_san_uri: Optional[str] = None
    tls_client_auth_san_ip: Optional[str] = None
    tls_client_auth_san_email: Optional[str] = None

    # For self_signed_tls_client_auth
    jwks_uri: Optional[str] = None
    jwks: Optional[dict] = None


class MTLSAuthenticator:
    """
    Authenticate OAuth clients using mTLS.

    RFC 8705 Section 2: Mutual-TLS Client Authentication
    """

    def __init__(self):
        self.clients: dict[str, MTLSClientConfig] = {}

    def register_client(self, config: MTLSClientConfig) -> None:
        """Register mTLS client configuration."""
        key = f"{config.tenant_id}:{config.client_id}"
        self.clients[key] = config

    def authenticate(
        self,
        client_id: str,
        tenant_id: str,
        client_cert: x509.Certificate,
    ) -> bool:
        """
        Authenticate client using presented certificate.

        RFC 8705 Section 2.1 & 2.2
        """
        key = f"{tenant_id}:{client_id}"
        config = self.clients.get(key)

        if not config:
            return False

        if config.auth_method == MTLSClientAuthMethod.TLS_CLIENT_AUTH:
            return self._authenticate_pki(config, client_cert)
        else:
            return self._authenticate_self_signed(config, client_cert)

    def _authenticate_pki(
        self,
        config: MTLSClientConfig,
        cert: x509.Certificate,
    ) -> bool:
        """
        PKI-based authentication.

        RFC 8705 Section 2.1: PKI Mutual-TLS Method
        """
        # Check Subject DN
        if config.tls_client_auth_subject_dn:
            subject_dn = cert.subject.rfc4514_string()
            if subject_dn != config.tls_client_auth_subject_dn:
                return False

        # Check SAN (Subject Alternative Name)
        try:
            san = cert.extensions.get_extension_for_class(
                x509.SubjectAlternativeName
            )

            if config.tls_client_auth_san_dns:
                dns_names = san.value.get_values_for_type(x509.DNSName)
                if config.tls_client_auth_san_dns not in dns_names:
                    return False

            if config.tls_client_auth_san_uri:
                uris = san.value.get_values_for_type(x509.UniformResourceIdentifier)
                if config.tls_client_auth_san_uri not in uris:
                    return False

            if config.tls_client_auth_san_email:
                emails = san.value.get_values_for_type(x509.RFC822Name)
                if config.tls_client_auth_san_email not in emails:
                    return False

        except x509.ExtensionNotFound:
            if any([
                config.tls_client_auth_san_dns,
                config.tls_client_auth_san_uri,
                config.tls_client_auth_san_email,
            ]):
                return False

        return True

    def _authenticate_self_signed(
        self,
        config: MTLSClientConfig,
        cert: x509.Certificate,
    ) -> bool:
        """
        Self-signed certificate authentication.

        RFC 8705 Section 2.2: Self-Signed Certificate Mutual-TLS Method
        """
        # Get public key from certificate
        cert_public_key = cert.public_key()

        # Verify against registered JWKS
        if config.jwks:
            return self._verify_against_jwks(cert_public_key, config.jwks)

        return False

    def _verify_against_jwks(self, public_key, jwks: dict) -> bool:
        """Verify certificate public key matches a key in JWKS."""
        for key in jwks.get("keys", []):
            if self._keys_match(public_key, key):
                return True
        return False

    def _keys_match(self, cert_key, jwk: dict) -> bool:
        """Compare certificate public key with JWK."""
        # Implementation would compare key parameters
        pass
```

### Certificate-Bound Access Tokens

```python
@dataclass
class CertificateBoundToken:
    """
    Access token bound to client certificate.

    RFC 8705 Section 3: Client Certificate-Bound Access Tokens
    """
    access_token: str
    token_type: str
    expires_in: int
    scope: str

    # Certificate binding
    cnf: dict  # Contains x5t#S256

class MTLSTokenIssuer:
    """Issue certificate-bound access tokens."""

    def __init__(self, signing_key: bytes, issuer: str):
        self.signing_key = signing_key
        self.issuer = issuer

    def issue_token(
        self,
        client_id: str,
        tenant_id: str,
        user_id: Optional[str],
        scope: str,
        client_cert_thumbprint: str,
        expires_in: int = 3600,
    ) -> dict:
        """
        Issue certificate-bound JWT access token.

        RFC 8705 Section 3.1: JWT Certificate Thumbprint Confirmation Method
        """
        now = datetime.utcnow()

        claims = {
            "iss": f"https://{tenant_id}.auth.example.com",
            "sub": user_id or client_id,
            "aud": f"https://{tenant_id}.api.example.com",
            "client_id": client_id,
            "tenant_id": tenant_id,
            "scope": scope,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(seconds=expires_in)).timestamp()),
            "jti": secrets.token_urlsafe(16),

            # Certificate binding (RFC 8705 Section 3.1)
            "cnf": {
                "x5t#S256": client_cert_thumbprint
            }
        }

        access_token = self._sign_jwt(claims)

        return {
            "access_token": access_token,
            "token_type": "Bearer",  # Still Bearer, but cert-bound
            "expires_in": expires_in,
            "scope": scope,
        }

    def _sign_jwt(self, claims: dict) -> str:
        """Sign JWT with server key."""
        import jwt
        return jwt.encode(claims, self.signing_key, algorithm="HS256")


class MTLSTokenValidator:
    """
    Validate certificate-bound tokens at resource server.

    RFC 8705 Section 3: Confirmation of Possession
    """

    def validate(
        self,
        access_token: str,
        client_cert_thumbprint: str,
        expected_tenant: str,
    ) -> dict:
        """
        Validate token and confirm certificate binding.

        The resource server MUST verify that the certificate thumbprint
        in the token matches the certificate used in the TLS connection.
        """
        # Decode and verify JWT
        try:
            claims = jwt.decode(access_token, options={"verify_signature": True})
        except jwt.InvalidTokenError as e:
            raise TokenValidationError(f"Invalid token: {e}")

        # Verify tenant
        if claims.get("tenant_id") != expected_tenant:
            raise TokenValidationError("Token not valid for this tenant")

        # Verify certificate binding (RFC 8705 Section 3)
        cnf = claims.get("cnf", {})
        token_thumbprint = cnf.get("x5t#S256")

        if not token_thumbprint:
            raise TokenValidationError("Token is not certificate-bound")

        if not secrets.compare_digest(token_thumbprint, client_cert_thumbprint):
            raise TokenValidationError(
                "Certificate does not match token binding"
            )

        return claims


class TokenValidationError(Exception):
    pass
```

### FastAPI mTLS Integration

```python
from fastapi import FastAPI, Request, HTTPException, Depends
from starlette.middleware.base import BaseHTTPMiddleware
import ssl

app = FastAPI()

class MTLSMiddleware(BaseHTTPMiddleware):
    """Extract client certificate from TLS connection."""

    async def dispatch(self, request: Request, call_next):
        # Get client certificate from TLS connection
        # This depends on your reverse proxy configuration

        # Option 1: Certificate in header (from nginx/envoy)
        cert_pem = request.headers.get("X-Client-Cert")

        # Option 2: Direct TLS termination
        # cert_der = request.scope.get("transport").get_extra_info("ssl_object").getpeercert(binary_form=True)

        if cert_pem:
            thumbprint = CertificateThumbprint.calculate_x5t_s256(
                cert_pem.encode()
            )
            request.state.client_cert_thumbprint = thumbprint
        else:
            request.state.client_cert_thumbprint = None

        return await call_next(request)


def require_mtls(request: Request) -> str:
    """Dependency to require mTLS client certificate."""
    thumbprint = getattr(request.state, "client_cert_thumbprint", None)
    if not thumbprint:
        raise HTTPException(401, "Client certificate required")
    return thumbprint


@app.post("/oauth/token")
async def token_endpoint(
    request: Request,
    cert_thumbprint: str = Depends(require_mtls),
):
    """Token endpoint with mTLS client authentication."""
    form = await request.form()
    client_id = form.get("client_id")
    tenant_id = request.headers.get("X-Tenant-ID")

    # Authenticate client via mTLS
    authenticator = MTLSAuthenticator()
    # ... client authentication logic

    # Issue certificate-bound token
    issuer = MTLSTokenIssuer(signing_key, issuer_url)
    token_response = issuer.issue_token(
        client_id=client_id,
        tenant_id=tenant_id,
        user_id=None,  # Client credentials grant
        scope=form.get("scope", ""),
        client_cert_thumbprint=cert_thumbprint,
    )

    return token_response


@app.get("/api/resource")
async def protected_resource(
    request: Request,
    cert_thumbprint: str = Depends(require_mtls),
):
    """Protected resource requiring certificate-bound token."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Bearer token required")

    token = auth_header[7:]
    tenant_id = request.headers.get("X-Tenant-ID")

    # Validate token with certificate binding
    validator = MTLSTokenValidator()
    try:
        claims = validator.validate(
            access_token=token,
            client_cert_thumbprint=cert_thumbprint,
            expected_tenant=tenant_id,
        )
    except TokenValidationError as e:
        raise HTTPException(401, str(e))

    return {"data": "protected resource", "client": claims.get("client_id")}
```

### Nginx mTLS Configuration

```nginx
# nginx.conf for mTLS termination

server {
    listen 443 ssl;
    server_name api.example.com;

    # Server certificate
    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;

    # Client certificate verification
    ssl_client_certificate /etc/nginx/certs/ca-bundle.crt;
    ssl_verify_client optional;  # or 'on' to require
    ssl_verify_depth 2;

    location /oauth/token {
        # Require client certificate for token endpoint
        if ($ssl_client_verify != SUCCESS) {
            return 403;
        }

        # Pass certificate to backend
        proxy_set_header X-Client-Cert $ssl_client_escaped_cert;
        proxy_set_header X-Client-Cert-DN $ssl_client_s_dn;
        proxy_set_header X-Client-Cert-Verify $ssl_client_verify;

        proxy_pass http://auth-backend;
    }

    location /api/ {
        # Optional client certificate for API
        proxy_set_header X-Client-Cert $ssl_client_escaped_cert;
        proxy_set_header X-Client-Cert-Verify $ssl_client_verify;

        proxy_pass http://api-backend;
    }
}
```

## Multi-Tenancy Patterns

### Per-Tenant Certificate Authority

```python
class MultiTenantPKI:
    """Manage per-tenant certificate authorities."""

    def __init__(self):
        self.tenant_cas: dict[str, x509.Certificate] = {}

    def register_tenant_ca(self, tenant_id: str, ca_cert: x509.Certificate):
        """Register CA certificate for tenant."""
        self.tenant_cas[tenant_id] = ca_cert

    def verify_client_cert(
        self,
        tenant_id: str,
        client_cert: x509.Certificate,
    ) -> bool:
        """Verify client certificate against tenant CA."""
        ca_cert = self.tenant_cas.get(tenant_id)
        if not ca_cert:
            return False

        try:
            # Verify certificate chain
            ca_cert.public_key().verify(
                client_cert.signature,
                client_cert.tbs_certificate_bytes,
                # padding and algorithm from signature
            )
            return True
        except Exception:
            return False
```

## Security Considerations

1. **Certificate Validation** - Always verify full certificate chain
2. **Revocation Checking** - Check CRL/OCSP for revoked certificates
3. **Thumbprint Binding** - Use SHA-256 for thumbprint calculation
4. **TLS Version** - Require TLS 1.2+ for mTLS
5. **Certificate Lifetime** - Use short-lived certificates when possible

## Related RFCs

| RFC      | Title     | Relationship        |
| -------- | --------- | ------------------- |
| RFC 6749 | OAuth 2.0 | Base framework      |
| RFC 9449 | DPoP      | Alternative binding |
| RFC 7517 | JWK       | Key representation  |

## Output Format

Provide:

- mTLS client authentication implementations
- Certificate-bound token issuance
- Token validation with binding verification
- Nginx/reverse proxy configurations
