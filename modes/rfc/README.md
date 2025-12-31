# RFC Standards Modes

IETF RFC compliance, validators, and multi-tenancy architecture.

## Available Modes (16)

### RFC Specification Modes

| Mode                           | RFC  | Description                              |
| ------------------------------ | ---- | ---------------------------------------- |
| `rfc-6749-oauth2-mode`         | 6749 | OAuth 2.0 Authorization Framework        |
| `rfc-6750-bearer-token-mode`   | 6750 | Bearer Token Usage                       |
| `rfc-7519-jwt-mode`            | 7519 | JSON Web Token (JWT)                     |
| `rfc-7636-pkce-mode`           | 7636 | Proof Key for Code Exchange              |
| `rfc-7643-scim-schema-mode`    | 7643 | SCIM Core Schema                         |
| `rfc-7644-scim-protocol-mode`  | 7644 | SCIM Protocol                            |
| `rfc-7662-introspection-mode`  | 7662 | Token Introspection                      |
| `rfc-8693-token-exchange-mode` | 8693 | Token Exchange                           |
| `rfc-8705-mtls-mode`           | 8705 | Mutual TLS Client Authentication         |
| `rfc-9449-dpop-mode`           | 9449 | DPoP (Demonstrating Proof of Possession) |

### Validator Modes

| Mode                                           | Component                     | RFCs Validated               |
| ---------------------------------------------- | ----------------------------- | ---------------------------- |
| `oauth-authorization-server-validator-mode`    | OAuth Authorization Server    | 6749, 7519, 7636, 9449, 8705 |
| `scim-provisioning-gateway-validator-mode`     | SCIM Provisioning Gateway     | 7643, 7644, 6750             |
| `identity-governance-connector-validator-mode` | Identity Governance Connector | 6749, 7519, 8693             |
| `token-administration-console-validator-mode`  | Token Administration Console  | 6749, 6750, 7662             |

### Architecture Modes

| Mode                                 | Description                                     |
| ------------------------------------ | ----------------------------------------------- |
| `rfc-multitenancy-architecture-mode` | Multi-tenancy architecture using RFC standards  |
| `rfc-compliance-agent-mode`          | Autonomous agent for RFC compliance refactoring |

## Usage

### RFC Specification Modes

Each RFC mode provides:

- Complete specification overview
- Implementation patterns
- Code examples
- Validation checklists
- Security considerations

### Validator Modes

Component validators that:

- Check code against multiple RFCs
- Identify compliance gaps
- Generate severity-rated findings
- Provide remediation guidance

### RFC Compliance Agent

Autonomous agent that:

1. Analyzes codebase for protocols
2. Searches internet for RFC docs
3. Performs gap analysis
4. Generates refactoring plan
5. Applies compliant changes

## Multi-Tenancy Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Tenant Platform                         │
├─────────────────────────────────────────────────────────────────┤
│  OAuth Authorization Server  │  RFC 6749, 7636, 9449, 8705      │
│  SCIM Provisioning Gateway   │  RFC 7643, 7644, 6750            │
│  Identity Governance         │  RFC 6749, 7519, 8693            │
│  Token Administration        │  RFC 6749, 6750, 7662            │
└─────────────────────────────────────────────────────────────────┘
```

## Recommended Workflow

1. **Learn**: Study relevant RFC modes
2. **Validate**: Run validator on existing code
3. **Plan**: Use compliance agent for gap analysis
4. **Implement**: Apply RFC-compliant patterns
5. **Verify**: Re-run validators to confirm compliance
