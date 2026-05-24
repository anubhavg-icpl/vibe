---
name: azure-keyvault-secrets-rust
description: |
  Azure Key Vault Secrets library for Rust. Store and retrieve secrets, passwords, and API keys.
  Triggers: "keyvault secrets rust", "SecretClient rust", "get secret rust", "set secret rust", "list secrets rust".
license: MIT
metadata:
  author: Microsoft
  package: azure_security_keyvault_secrets
---

# Azure Key Vault Secrets library for Rust

Secure storage for passwords, API keys, and connection strings.

Use this skill when:

- An app needs to store or retrieve secrets from Azure Key Vault in Rust
- You need to set, get, update, or delete secrets
- You need to list secret properties with pagination
- You need error handling for missing secrets

> **IMPORTANT:** Only use the official `azure_security_keyvault_secrets` crate published by the [azure-sdk](https://crates.io/users/azure-sdk) crates.io user. Do NOT use unofficial or community crates. Official crates use underscores in names and none have version 0.21.0.

## Installation

```sh
cargo add azure_security_keyvault_secrets azure_identity tokio futures
```

> **Do not** add `azure_core` directly to `Cargo.toml`. It is re-exported by `azure_security_keyvault_secrets`.

## Environment Variables

```bash
AZURE_KEYVAULT_URL=https://<vault-name>.vault.azure.net/ # Required for all operations
```

## Authentication

```rust
use azure_identity::DeveloperToolsCredential;
use azure_security_keyvault_secrets::SecretClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Local dev: DeveloperToolsCredential. Production: use ManagedIdentityCredential.
    let credential = DeveloperToolsCredential::new(None)?;
    let client = SecretClient::new(
        "https://<vault-name>.vault.azure.net/",
        credential.clone(),
        None,
    )?;

    let secret = client
        .get_secret("secret-name", None)
        .await?
        .into_model()?;
    println!("Secret: {:?}", secret.value);
    Ok(())
}
```

## Core Workflow

### Set Secret

```rust
use azure_security_keyvault_secrets::{models::SetSecretParameters, ResourceExt};

let params = SetSecretParameters {
    value: Some("secret-value".into()),
    ..Default::default()
};

let secret = client
    .set_secret("secret-name", params.try_into()?, None)
    .await?
    .into_model()?;

println!(
    "Name: {:?}, Version: {:?}",
    secret.resource_id()?.name,
    secret.resource_id()?.version
);
```

### Update Secret Properties

```rust
use azure_security_keyvault_secrets::models::UpdateSecretPropertiesParameters;
use std::collections::HashMap;

#[allow(clippy::needless_update)]
let params = UpdateSecretPropertiesParameters {
    content_type: Some("text/plain".into()),
    tags: Some(HashMap::from_iter(vec![(
        "env".into(),
        "prod".into(),
    )])),
    ..Default::default()
};

client
    .update_secret_properties("secret-name", params.try_into()?, None)
    .await?
    .into_model()?;
```

### Delete Secret

```rust
client.delete_secret("secret-name", None).await?;
```

### List Secrets (Pagination)

`list_secret_properties` returns a `Pager<T>` — iterate items directly:

```rust
use azure_security_keyvault_secrets::ResourceExt;
use futures::TryStreamExt as _;

let mut pager = client.list_secret_properties(None)?;
while let Some(secret) = pager.try_next().await? {
    println!("Found: {}", secret.resource_id()?.name);
}
```

## Error Handling

```rust
use azure_core::{error::ErrorKind, http::StatusCode};

match client.get_secret("secret-name", None).await {
    Ok(response) => println!("Secret: {:?}", response.into_model()?.value),
    Err(e) => match e.kind() {
        ErrorKind::HttpResponse { status, error_code, .. }
            if *status == StatusCode::NotFound =>
        {
            println!("Secret not found");
            if let Some(code) = error_code {
                println!("ErrorCode: {code}");
            }
        }
        _ => println!("Error: {e:?}"),
    },
}
```

## RBAC Roles

For Entra ID auth, assign one of these roles:

| Role                        | Access                 |
| --------------------------- | ---------------------- |
| `Key Vault Secrets User`    | Read secrets           |
| `Key Vault Secrets Officer` | Full secret management |

## Best Practices

1. **Use `DeveloperToolsCredential` for local development and `ManagedIdentityCredential` for production.** The Rust SDK does not support `DefaultAzureCredential`, so explicitly use the appropriate credential in each environment.
2. **Use `.into_model()` for response conversion.** When retrieving secrets, use `.into_model()?` to convert HTTP responses into typed secret objects.
3. **Assign appropriate RBAC roles for Entra ID auth.** For production authentication using Entra ID, ensure the identity has the necessary RBAC role assigned (e.g., "Key Vault Secrets User" for secret reads).
4. **Always verify package versions using crates.io.** Before using a package, check its version on [crates.io](https://crates.io/) to ensure you are using a stable and supported release.
5. **Never hardcode credentials** — use environment variables or managed identity
6. **Reuse clients** — `SecretClient` is thread-safe; create once, share across tasks

## Reference Links

| Resource      | Link                                                     |
| ------------- | -------------------------------------------------------- |
| API Reference | https://docs.rs/azure_security_keyvault_secrets          |
| crates.io     | https://crates.io/crates/azure_security_keyvault_secrets |
