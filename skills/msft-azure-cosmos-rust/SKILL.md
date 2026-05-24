---
name: azure-cosmos-rust
description: |
  Azure Cosmos DB library for Rust (NoSQL API). Document CRUD, containers, and globally distributed data.
  Triggers: "cosmos db rust", "CosmosClient rust", "document crud rust", "NoSQL rust", "partition key rust".
license: MIT
metadata:
  author: Microsoft
  package: azure_data_cosmos
---

# Azure Cosmos DB library for Rust

Client library for Azure Cosmos DB NoSQL API — document CRUD, containers, and globally distributed data.

Use this skill when:

- An app needs to store or query documents in Cosmos DB from Rust
- You need CRUD operations on items with partition keys
- You need key-based auth as an alternative to Entra ID

> **IMPORTANT:** Only use the official `azure_data_cosmos` crate published by the [azure-sdk](https://crates.io/users/azure-sdk) crates.io user. Do NOT use the unofficial `azure_cosmos` or `azure_sdk_for_rust` community crates. Official crates use underscores in names and none have version 0.21.0.

## Installation

```sh
cargo add azure_data_cosmos azure_identity tokio
```

> **Do not** add `azure_core` directly to `Cargo.toml`. It is re-exported by `azure_data_cosmos`.

## Environment Variables

```bash
COSMOS_ENDPOINT=https://<account>.documents.azure.com/ # Required for all operations
```

## Authentication

```rust
use azure_identity::DeveloperToolsCredential;
use azure_data_cosmos::{CosmosClient, CosmosAccountReference, CosmosAccountEndpoint};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Local dev: DeveloperToolsCredential. Production: use ManagedIdentityCredential.
    let credential: std::sync::Arc<dyn azure_core::credentials::TokenCredential> =
        DeveloperToolsCredential::new(None)?;
    let endpoint: CosmosAccountEndpoint = "https://<account>.documents.azure.com/"
        .parse()?;
    let account = CosmosAccountReference::with_credential(endpoint, credential);
    let client = CosmosClient::builder().build(account).await?;
    Ok(())
}
```

## Client Hierarchy

| Client            | Purpose                   | Access                                          |
| ----------------- | ------------------------- | ----------------------------------------------- |
| `CosmosClient`    | Account-level operations  | `CosmosClient::builder().build(account).await?` |
| `DatabaseClient`  | Database operations       | `client.database_client("db")`                  |
| `ContainerClient` | Container/item operations | `database.container_client("c").await`          |

## Core Workflow

```rust
use serde::{Serialize, Deserialize};
use azure_data_cosmos::CosmosClient;

#[derive(Serialize, Deserialize)]
struct Item {
    pub id: String,
    pub partition_key: String,
    pub value: String,
}

async fn crud(client: CosmosClient) -> Result<(), Box<dyn std::error::Error>> {
    let container = client
        .database_client("myDatabase")
        .container_client("myContainer")
        .await;

    let item = Item {
        id: "1".into(),
        partition_key: "pk1".into(),
        value: "hello".into(),
    };

    // Create
    container.create_item("pk1", item, None).await?;

    // Read
    let resp = container.read_item("pk1", "1", None).await?;
    let mut item: Item = resp.into_model()?;

    // Update
    item.value = "updated".into();
    container.replace_item("pk1", "1", item, None).await?;

    // Delete
    container.delete_item("pk1", "1", None).await?;
    Ok(())
}
```

## Key Auth (Optional)

Enable account key authentication with the feature flag:

```sh
cargo add azure_data_cosmos --features key_auth
```

## RBAC Roles

For Entra ID auth, assign one of these built-in Cosmos DB roles:

| Role                                  | Access     |
| ------------------------------------- | ---------- |
| `Cosmos DB Built-in Data Reader`      | Read-only  |
| `Cosmos DB Built-in Data Contributor` | Read/write |

## Best Practices

1. **Use `DeveloperToolsCredential` for local development and `ManagedIdentityCredential` for production.** The Rust SDK does not support `DefaultAzureCredential`, so explicitly use the appropriate credential in each environment.
2. **Always specify partition key for item operations.** Cosmos DB requires the partition key for all CRUD operations; include it in every `create_item()`, `read_item()`, `replace_item()`, and `delete_item()` call.
3. **Assign appropriate RBAC roles for Entra ID auth.** For production authentication using Entra ID, ensure the identity has the necessary RBAC role assigned (e.g., "Cosmos DB Built-in Data Contributor" for read/write).
4. **Always verify package versions using crates.io.** Before using a package, check its version on [crates.io](https://crates.io/) to ensure you are using a stable and supported release.
5. **Never hardcode credentials** — use environment variables or managed identity
6. **Reuse `CosmosClient`** — clients are thread-safe; create once, share across tasks

## Reference Links

| Resource      | Link                                       |
| ------------- | ------------------------------------------ |
| API Reference | https://docs.rs/azure_data_cosmos          |
| crates.io     | https://crates.io/crates/azure_data_cosmos |
