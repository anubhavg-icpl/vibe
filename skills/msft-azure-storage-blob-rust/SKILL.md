---
name: azure-storage-blob-rust
description: |
  Azure Blob Storage library for Rust. Upload, download, and manage blobs and containers.
  Triggers: "blob storage rust", "BlobClient rust", "upload blob rust", "download blob rust", "storage container rust", "BlobServiceClient rust".
license: MIT
metadata:
  author: Microsoft
  package: azure_storage_blob
---

# Azure Blob Storage library for Rust

Client library for Azure Blob Storage — upload, download, and manage blobs and containers.

Use this skill when:

- An app needs to upload or download blobs from Azure Storage in Rust
- You need to create or manage blob containers
- You need to list blobs with pagination
- You need RBAC-based auth for blob operations

> **IMPORTANT:** Only use the official `azure_storage_blob` crate published by the [azure-sdk](https://crates.io/users/azure-sdk) crates.io user. Do NOT use the unofficial `azure_storage`, `azure_storage_blobs`, or `azure_sdk_for_rust` community crates. Official crates use underscores in names and none have version 0.21.0.

## Installation

```sh
cargo add azure_storage_blob azure_identity tokio
```

> **Do not** add `azure_core` directly to `Cargo.toml`. It is re-exported by `azure_storage_blob`.

## Environment Variables

```bash
AZURE_STORAGE_ENDPOINT=https://<account>.blob.core.windows.net/ # Required for all operations
```

## Authentication

```rust
use azure_core::http::Url;
use azure_identity::DeveloperToolsCredential;
use azure_storage_blob::BlobServiceClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Local dev: DeveloperToolsCredential. Production: use ManagedIdentityCredential.
    let credential = DeveloperToolsCredential::new(None)?;
    let service_url = Url::parse("https://<account>.blob.core.windows.net/")?;
    let service_client = BlobServiceClient::new(service_url, Some(credential), None)?;
    let blob_client = service_client.blob_client("container-name", "blob-name");
    Ok(())
}
```

## Client Types

| Client                | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `BlobServiceClient`   | Account-level operations, list containers |
| `BlobContainerClient` | Container operations, list blobs          |
| `BlobClient`          | Individual blob operations                |

## Core Workflow

### Upload Blob

```rust
use azure_core::http::RequestContent;
use azure_core::http::Url;
use azure_identity::DeveloperToolsCredential;
use azure_storage_blob::BlobServiceClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Local dev: DeveloperToolsCredential. Production: use ManagedIdentityCredential.
    let credential = DeveloperToolsCredential::new(None)?;
    let service_url = Url::parse("https://<account>.blob.core.windows.net/")?;
    let service_client = BlobServiceClient::new(service_url, Some(credential), None)?;
    let blob_client = service_client.blob_client("container-name", "blob-name");

    let data = b"hello world";
    blob_client
        .upload(RequestContent::from(data.to_vec()), None)
        .await?;
    Ok(())
}
```

### Download Blob / Get Properties

```rust
// Get blob properties
let props = blob_client.get_properties(None).await?;

// Download blob content
let response = blob_client.download(None).await?;
let content = String::from_utf8(response.body.collect().await?.into())?;
```

### Delete Blob

```rust
blob_client.delete(None).await?;
```

### Container Operations

```rust
use azure_core::http::Url;
use azure_identity::DeveloperToolsCredential;
use azure_storage_blob::BlobServiceClient;
use futures::TryStreamExt as _;

let credential = DeveloperToolsCredential::new(None)?;
let service_url = Url::parse("https://<account>.blob.core.windows.net/")?;
let service_client = BlobServiceClient::new(service_url, Some(credential), None)?;
let container_client = service_client.blob_container_client("container-name");

// Create container
container_client.create(None).await?;

// List blobs (Pager<T> — iterate items directly)
let mut pager = container_client.list_blobs(None)?;
while let Some(blob) = pager.try_next().await? {
    println!("Blob: {}", blob.name);
}
```

## Error Handling

Use `StorageError` for programmatic access to storage-specific error codes:

```rust
use azure_core::error::ErrorKind;
use azure_storage_blob::{StorageError, StorageErrorCode};

let result = blob_client.download(None).await;

match result {
    Ok(response) => {
        let content: Vec<u8> = response.body.collect().await?.into();
        println!("Downloaded {} bytes", content.len());
    }
    Err(error) => {
        if matches!(error.kind(), ErrorKind::HttpResponse { .. }) {
            // Convert to StorageError for programmatic access
            let storage_error: StorageError = error.try_into()?;
            println!("HTTP Status: {}", storage_error.status_code);

            if let Some(error_code) = &storage_error.error_code {
                match error_code {
                    StorageErrorCode::BlobNotFound => {
                        println!("The blob does not exist.");
                    }
                    StorageErrorCode::ContainerNotFound => {
                        println!("The container does not exist.");
                    }
                    StorageErrorCode::AuthorizationFailure => {
                        println!("Authorization failed. Check RBAC roles.");
                    }
                    _ => println!("Storage error: {error_code}"),
                }
            }

            if let Some(request_id) = &storage_error.request_id {
                println!("Request ID (for Azure support): {request_id}");
            }
        } else {
            println!("Non-HTTP error: {:?}", error);
        }
    }
}
```

## RBAC Roles

For Entra ID auth, assign one of these roles to the identity:

| Role                            | Access                     |
| ------------------------------- | -------------------------- |
| `Storage Blob Data Reader`      | Read-only                  |
| `Storage Blob Data Contributor` | Read/write                 |
| `Storage Blob Data Owner`       | Full access including RBAC |

## Best Practices

1. **Use `DeveloperToolsCredential` for local development and `ManagedIdentityCredential` for production.** The Rust SDK does not support `DefaultAzureCredential`, so explicitly use the appropriate credential in each environment.
2. **Use `RequestContent::from()` to wrap upload data.** When uploading data (e.g., blobs), wrap the content in `RequestContent::from(your_data)` to ensure proper handling by the SDK.
3. **Assign appropriate RBAC roles for Entra ID auth.** For production authentication using Entra ID, ensure the identity has the necessary RBAC role assigned (e.g., "Storage Blob Data Contributor" for blob write access).
4. **Always verify package versions using crates.io.** Before using a package, check its version on [crates.io](https://crates.io/) to ensure you are using a stable and supported release.
5. **Never hardcode credentials** — use environment variables or managed identity
6. **Reuse clients** — clients are thread-safe; create once, share across tasks

## Reference Links

| Resource      | Link                                        |
| ------------- | ------------------------------------------- |
| API Reference | https://docs.rs/azure_storage_blob          |
| crates.io     | https://crates.io/crates/azure_storage_blob |
