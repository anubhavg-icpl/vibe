---
name: azure-keyvault-keys-rust
description: |
  Azure Key Vault Keys library for Rust. Create, manage, and use cryptographic keys including RSA, EC, and HSM-protected keys.
  Triggers: "keyvault keys rust", "KeyClient rust", "create key rust", "encrypt rust", "wrap key rust", "sign rust".
license: MIT
metadata:
  author: Microsoft
  package: azure_security_keyvault_keys
---

# Azure Key Vault Keys library for Rust

Secure storage and management of cryptographic keys — RSA, EC, and HSM-protected.

Use this skill when:

- An app needs to create or manage cryptographic keys in Key Vault from Rust
- You need to wrap/unwrap data encryption keys (envelope encryption)
- You need to sign or verify data with Key Vault keys
- You need HSM-protected keys

> **IMPORTANT:** Only use the official `azure_security_keyvault_keys` crate published by the [azure-sdk](https://crates.io/users/azure-sdk) crates.io user. Do NOT use unofficial or community crates. Official crates use underscores in names and none have version 0.21.0.

## Installation

```sh
cargo add azure_security_keyvault_keys azure_identity tokio futures
```

> **Do not** add `azure_core` directly to `Cargo.toml`. It is re-exported by `azure_security_keyvault_keys`.

## Environment Variables

```bash
AZURE_KEYVAULT_URL=https://<vault-name>.vault.azure.net/ # Required for all operations
```

## Authentication

```rust
use azure_identity::DeveloperToolsCredential;
use azure_security_keyvault_keys::KeyClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Local dev: DeveloperToolsCredential. Production: use ManagedIdentityCredential.
    let credential = DeveloperToolsCredential::new(None)?;
    let client = KeyClient::new(
        "https://<vault-name>.vault.azure.net/",
        credential.clone(),
        None,
    )?;

    let key = client.get_key("key-name", None).await?.into_model()?;
    println!("Key: {:?}", key.key);
    Ok(())
}
```

## Core Workflow

### Create Key

```rust
use azure_security_keyvault_keys::{
    models::{CreateKeyParameters, CurveName, KeyType},
    ResourceExt,
};

// Create an EC key
let body = CreateKeyParameters {
    kty: Some(KeyType::Ec),
    curve: Some(CurveName::P256),
    ..Default::default()
};

let key = client
    .create_key("key-name", body.try_into()?, None)
    .await?
    .into_model()?;

println!(
    "Name: {:?}, Type: {:?}, Version: {:?}",
    key.resource_id()?.name,
    key.key.as_ref().map(|k| k.kty.as_ref()),
    key.resource_id()?.version,
);
```

### Update Key Properties

```rust
use azure_security_keyvault_keys::models::UpdateKeyPropertiesParameters;
use std::collections::HashMap;

#[allow(clippy::needless_update)]
let params = UpdateKeyPropertiesParameters {
    tags: Some(HashMap::from_iter(vec![("env".into(), "prod".into())])),
    ..Default::default()
};

client
    .update_key_properties("key-name", params.try_into()?, None)
    .await?
    .into_model()?;
```

### Delete Key

```rust
client.delete_key("key-name", None).await?;
```

### List Keys (Pagination)

`list_key_properties` returns a `Pager<T>` — iterate items directly:

```rust
use azure_security_keyvault_keys::ResourceExt;
use futures::TryStreamExt as _;

let mut pager = client.list_key_properties(None)?;
while let Some(key) = pager.try_next().await? {
    println!("Found: {}", key.resource_id()?.name);
}
```

## Wrap / Unwrap (Envelope Encryption)

Key Vault performs crypto operations server-side — the private key never leaves the HSM:

```rust
use azure_security_keyvault_keys::{
    models::{
        CreateKeyParameters, EncryptionAlgorithm, KeyOperationParameters, KeyType,
    },
    ResourceExt,
};
use rand::random;

// Create a key encryption key (KEK)
let body = CreateKeyParameters {
    kty: Some(KeyType::Rsa),
    key_size: Some(2048),
    ..Default::default()
};

let key = client
    .create_key("kek-name", body.try_into()?, None)
    .await?
    .into_model()?;
let key_version = key.resource_id()?.version.expect("key version required");

// Generate a symmetric data encryption key (DEK)
let dek = random::<u32>().to_le_bytes().to_vec();

// Wrap the DEK with the KEK
let mut params = KeyOperationParameters {
    algorithm: Some(EncryptionAlgorithm::RsaOaep256),
    value: Some(dek.clone()),
    ..Default::default()
};
let wrapped = client
    .wrap_key("kek-name", &key_version, params.clone().try_into()?, None)
    .await?
    .into_model()?;

// Unwrap to recover the DEK
params.value = wrapped.result;
let unwrapped = client
    .unwrap_key("kek-name", &key_version, params.try_into()?, None)
    .await?
    .into_model()?;

assert_eq!(unwrapped.result.as_ref(), Some(&dek));
```

## Key Types

| Type    | Use Case                      | Parameter         |
| ------- | ----------------------------- | ----------------- |
| EC      | Signing, key agreement        | `KeyType::Ec`     |
| RSA     | Encryption, signing, wrapping | `KeyType::Rsa`    |
| Oct     | Symmetric operations (HSM)    | `KeyType::Oct`    |
| EC-HSM  | HSM-protected EC keys         | `KeyType::EcHsm`  |
| RSA-HSM | HSM-protected RSA keys        | `KeyType::RsaHsm` |

## RBAC Roles

For Entra ID auth, assign one of these roles:

| Role                       | Access                  |
| -------------------------- | ----------------------- |
| `Key Vault Crypto User`    | Use keys for crypto ops |
| `Key Vault Crypto Officer` | Full key management     |

## Best Practices

1. **Use `DeveloperToolsCredential` for local development and `ManagedIdentityCredential` for production.** The Rust SDK does not support `DefaultAzureCredential`, so explicitly use the appropriate credential in each environment.
2. **Use `RequestContent::from()` for sign/encrypt payloads and `.into_model()` for key responses.** Wrap operation inputs with `RequestContent::from()` and convert HTTP responses with `.into_model()?`.
3. **Assign appropriate RBAC roles for Entra ID auth.** For production authentication using Entra ID, ensure the identity has the necessary RBAC role assigned (e.g., "Key Vault Crypto User" for cryptographic operations).
4. **Always verify package versions using crates.io.** Before using a package, check its version on [crates.io](https://crates.io/) to ensure you are using a stable and supported release.
5. **Never hardcode credentials** — use environment variables or managed identity
6. **Reuse clients** — `KeyClient` is thread-safe; create once, share across tasks

## Reference Links

| Resource      | Link                                                  |
| ------------- | ----------------------------------------------------- |
| API Reference | https://docs.rs/azure_security_keyvault_keys          |
| crates.io     | https://crates.io/crates/azure_security_keyvault_keys |
