# Security Modes

Security compliance, secret management, and vulnerability testing.

## Available Modes (8)

| Mode                            | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `container-security-mode`       | Container and Kubernetes security hardening        |
| `gdpr-expert-mode`              | GDPR compliance and data privacy                   |
| `hipaa-compliance-mode`         | HIPAA compliance for healthcare applications       |
| `multitenancy-spiffe-mode`      | SPIFFE/SPIRE for multi-tenant identity             |
| `pci-dss-compliance-mode`       | PCI-DSS compliance for payment systems             |
| `sast-dast-expert-mode`         | Static and dynamic application security testing    |
| `secret-management-expert-mode` | Secrets management with Vault, AWS Secrets Manager |
| `soc2-compliance-mode`          | SOC 2 compliance and audit preparation             |

## Usage

### Container Security Mode

Secure containerized workloads:

- Image scanning
- Runtime security
- Pod security policies
- Network policies
- Secrets handling

### GDPR Expert Mode

Data privacy compliance:

- Data subject rights
- Consent management
- Data processing records
- Privacy by design
- Breach notification

### HIPAA Compliance Mode

Healthcare data security:

- PHI protection
- Access controls
- Audit logging
- Encryption requirements
- Business associate agreements

### SPIFFE/SPIRE Mode

Zero-trust identity:

- Workload identity
- SVID management
- Federation
- Multi-tenant isolation
- Service mesh integration

### PCI-DSS Compliance Mode

Payment card security:

- Cardholder data protection
- Network segmentation
- Access control
- Encryption
- Vulnerability management

### SAST/DAST Expert Mode

Security testing:

- Static code analysis
- Dynamic scanning
- Vulnerability prioritization
- CI/CD integration
- Remediation guidance

### Secret Management Mode

Secure secrets handling:

- HashiCorp Vault
- AWS Secrets Manager
- Azure Key Vault
- Secret rotation
- Access policies

### SOC 2 Compliance Mode

Trust service criteria:

- Security controls
- Availability
- Processing integrity
- Confidentiality
- Privacy

## Compliance Matrix

| Framework | Data Type     | Industry       |
| --------- | ------------- | -------------- |
| GDPR      | Personal data | All (EU)       |
| HIPAA     | Health data   | Healthcare     |
| PCI-DSS   | Payment data  | Finance/Retail |
| SOC 2     | Customer data | SaaS/Cloud     |

## Recommended Workflow

1. **Assess**: Identify applicable compliance frameworks
2. **Gap Analysis**: Run relevant compliance mode
3. **Implement**: Apply security controls
4. **Test**: Use `sast-dast-expert-mode` for validation
5. **Audit**: Prepare documentation for certification
