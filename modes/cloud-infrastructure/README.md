# Cloud Infrastructure Modes

Cloud platform specialists and infrastructure-as-code modes.

## Available Modes (5)

| Mode                           | Description                                     |
| ------------------------------ | ----------------------------------------------- |
| `aws-solutions-architect-mode` | AWS architecture, services, and best practices  |
| `gcp-cloud-architect-mode`     | Google Cloud Platform design and implementation |
| `azure-solutions-expert-mode`  | Microsoft Azure solutions and services          |
| `terraform-iac-expert-mode`    | Infrastructure as Code with Terraform           |
| `kubernetes-expert-mode`       | Container orchestration with Kubernetes         |

## Usage

### AWS Solutions Architect Mode

Expertise in:

- EC2, Lambda, ECS, EKS
- S3, RDS, DynamoDB
- VPC, CloudFront, Route 53
- IAM, KMS, Secrets Manager
- CloudFormation, CDK

### GCP Cloud Architect Mode

Covers:

- Compute Engine, Cloud Run, GKE
- Cloud Storage, BigQuery, Firestore
- VPC, Cloud CDN, Cloud DNS
- IAM, Cloud KMS
- Deployment Manager, Terraform

### Azure Solutions Expert Mode

Includes:

- Virtual Machines, App Service, AKS
- Blob Storage, Cosmos DB, SQL Database
- Virtual Networks, Azure CDN
- Azure AD, Key Vault
- ARM Templates, Bicep

### Terraform IaC Expert Mode

Focuses on:

- HCL syntax and best practices
- Module development
- State management
- Multi-cloud deployments
- CI/CD integration

### Kubernetes Expert Mode

Covers:

- Pod, Deployment, StatefulSet
- Services, Ingress, NetworkPolicy
- ConfigMaps, Secrets
- Helm charts
- Operators and CRDs

## Multi-Cloud Strategy

For multi-cloud deployments:

1. Use `terraform-iac-expert-mode` as the foundation
2. Combine with cloud-specific modes for platform details
3. Apply `kubernetes-expert-mode` for container workloads
