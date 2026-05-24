---
name: azure-keyvault-certificates-rust
description: |
  Azure Key Vault Certificates library for Rust. Create, manage, and use X.509 certificates including self-signed and CA-issued.
  Triggers: "keyvault certificates rust", "CertificateClient rust", "create certificate rust", "self-signed certificate rust", "X.509 rust".
license: MIT
metadata:
  author: Microsoft
  package: azure_security_keyvault_certificates
---

# Azure Key Vault Certificates library for Rust

Manage X.509 certificates for TLS/SSL, code signing, and authentication.

Use this skill when:

- An app needs to create or manage X.509 certificates in Key Vault from Rust
- You need self-signed or CA-issued certificates
- You need long-running operations (LRO) for certificate issuance
- You need to sign data using a certificate's key

> **IMPORTANT:** Only use the official `azure_security_keyvault_certificates` crate published by the [azure-sdk](https://crates.io/users/azure-sdk) crates.io user. Do NOT use unofficial or community crates. Official crates use underscores in names and none have version 0.21.0.

## Installation

```sh
cargo add azure_security_keyvault_certificates azure_identity tokio futures
```

> **Do not** add `azure_core` directly to `Cargo.toml`. It is re-exported by `azure_security_keyvault_certificates`.

## Environment Variables

```bash
AZURE_KEYVAULT_URL=https://<vault-name>.vault.azure.net/ # Required for all operations
```

## Authentication

```rust
use azure_identity::DeveloperToolsCredential;
use azure_security_keyvault_certificates::CertificateClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Local dev: DeveloperToolsCredential. Production: use ManagedIdentityCredential.
    let credential = DeveloperToolsCredential::new(None)?;
    let client = CertificateClient::new(
        "https://<vault-name>.vault.azure.net/",
        credential.clone(),
        None,
    )?;

    let cert = client
        .get_certificate("cert-name", None)
        .await?
        .into_model()?;
    println!("Certificate: {:?}", cert.id);
    Ok(())
}
```

## Core Workflow

### Create Self-Signed Certificate (LRO)

Creating a certificate is a long-running operation. `Poller<T>` implements `IntoFuture` — just `.await`:

```rust
use azure_security_keyvault_certificates::{
    models::{
        CertificateCreateParameters, IssuerParameters, SecretProperties,
        SubjectAlternativeNames, X509CertificateProperties,
    },
    ResourceExt,
};

let body = CertificateCreateParameters {
    certificate_policy: Some(Box::new(
        azure_security_keyvault_certificates::models::CertificatePolicy {
            issuer_parameters: Some(IssuerParameters {
                name: Some("Self".into()),
                ..Default::default()
            }),
            secret_properties: Some(SecretProperties {
                content_type: Some("application/x-pkcs12".into()),
                ..Default::default()
            }),
            x509_certificate_properties: Some(X509CertificateProperties {
                subject: Some("CN=example.com".into()),
                subject_alternative_names: Some(SubjectAlternativeNames {
                    dns_names: Some(vec!["example.com".into()]),
                    ..Default::default()
                }),
                ..Default::default()
            }),
            ..Default::default()
        },
    )),
    ..Default::default()
};

// Poller implements IntoFuture — await directly for completion
let cert = client
    .create_certificate("cert-name", body.try_into()?, None)?
    .await?
    .into_model()?;

println!(
    "Name: {:?}, Version: {:?}",
    cert.resource_id()?.name,
    cert.resource_id()?.version,
);
```

### Update Certificate Properties

```rust
use azure_security_keyvault_certificates::models::CertificateUpdateParameters;
use std::collections::HashMap;

#[allow(clippy::needless_update)]
let params = CertificateUpdateParameters {
    tags: Some(HashMap::from_iter(vec![("env".into(), "prod".into())])),
    ..Default::default()
};

client
    .update_certificate("cert-name", params.try_into()?, None)
    .await?
    .into_model()?;
```

### Delete Certificate

```rust
client.delete_certificate("cert-name", None).await?;
```

### List Certificates (Pagination)

`list_certificate_properties` returns a `Pager<T>` — iterate items directly:

```rust
use azure_security_keyvault_certificates::ResourceExt;
use futures::TryStreamExt as _;

let mut pager = client.list_certificate_properties(None)?;
while let Some(cert) = pager.try_next().await? {
    println!("Found: {}", cert.resource_id()?.name);
}
```

## Signing with a Certificate's Key

Certificates in Key Vault have an associated key. Use the Key Vault Keys SDK for crypto operations:

```rust
use azure_security_keyvault_keys::{
    models::{KeySignParameters, SignatureAlgorithm},
    KeyClient,
};

let key_client = KeyClient::new(
    "https://<vault-name>.vault.azure.net/",
    credential.clone(),
    None,
)?;

// Sign with the certificate's EC key
let digest = vec![0u8; 32]; // SHA-256 digest
let sign_params = KeySignParameters {
    algorithm: Some(SignatureAlgorithm::Es256),
    value: Some(digest),
    ..Default::default()
};

let result = key_client
    .sign("cert-name", "", sign_params.try_into()?, None)
    .await?
    .into_model()?;
println!("Signature: {:?}", result.result);
```

## Certificate Formats

| Format  | Content Type             | Use Case                            |
| ------- | ------------------------ | ----------------------------------- |
| PKCS#12 | `application/x-pkcs12`   | Bundled cert + private key          |
| PEM     | `application/x-pem-file` | Base64-encoded, common in Linux/web |

## RBAC Roles

For Entra ID auth, assign one of these roles:

| Role                             | Access                      |
| -------------------------------- | --------------------------- |
| `Key Vault Certificate User`     | Use certificates            |
| `Key Vault Certificates Officer` | Full certificate management |

## Best Practices

1. **Use `DeveloperToolsCredential` for local development and `ManagedIdentityCredential` for production.** The Rust SDK does not support `DefaultAzureCredential`, so explicitly use the appropriate credential in each environment.
2. **Use `RequestContent::from()` for sign payloads and `.into_model()` for certificate responses.** Wrap operation inputs with `RequestContent::from()` and convert HTTP responses with `.into_model()?`.
3. **Assign appropriate RBAC roles for Entra ID auth.** For production authentication using Entra ID, ensure the identity has the necessary RBAC role assigned (e.g., "Key Vault Certificates User" for certificate reads).
4. **Always verify package versions using crates.io.** Before using a package, check its version on [crates.io](https://crates.io/) to ensure you are using a stable and supported release.
5. **Never hardcode credentials** — use environment variables or managed identity
6. **Reuse clients** — `CertificateClient` is thread-safe; create once, share across tasks

## Reference Links

| Resource      | Link                                                          |
| ------------- | ------------------------------------------------------------- |
| API Reference | https://docs.rs/azure_security_keyvault_certificates          |
| crates.io     | https://crates.io/crates/azure_security_keyvault_certificates |
