---
name: azure-eventhub-rust
description: |
  Azure Event Hubs library for Rust. Send and receive events for streaming data ingestion and batch processing.
  Triggers: "event hubs rust", "ProducerClient rust", "ConsumerClient rust", "send event rust", "streaming rust", "eventhub rust".
license: MIT
metadata:
  author: Microsoft
  package: azure_messaging_eventhubs
---

# Azure Event Hubs library for Rust

Client library for Azure Event Hubs — send and receive events for streaming data ingestion.

Use this skill when:

- An app needs to send events to Azure Event Hubs from Rust
- You need to receive and process events from partitions
- You need batch sending for throughput optimization
- You need to control consumer start position

> **IMPORTANT:** Only use the official `azure_messaging_eventhubs` crate published by the [azure-sdk](https://crates.io/users/azure-sdk) crates.io user. Do NOT use unofficial or community crates. Official crates use underscores in names and none have version 0.21.0.

## Installation

```sh
cargo add azure_messaging_eventhubs azure_identity tokio futures
```

> **Do not** add `azure_core` directly to `Cargo.toml`. It is re-exported by `azure_messaging_eventhubs`.

## Environment Variables

```bash
EVENTHUBS_HOST=<namespace>.servicebus.windows.net # Required — fully qualified namespace
EVENTHUB_NAME=<eventhub-name>                     # Required — name of the Event Hub
```

## Key Concepts

| Concept       | Description                                          |
| ------------- | ---------------------------------------------------- |
| **Namespace** | Container for one or more Event Hubs                 |
| **Event Hub** | Stream of events, partitioned for parallel reads     |
| **Partition** | Ordered, append-only sequence of events              |
| **Producer**  | Sends events via `ProducerClient`                    |
| **Consumer**  | Receives events from partitions via `ConsumerClient` |

## Authentication

```rust
use azure_identity::DeveloperToolsCredential;
use azure_messaging_eventhubs::ProducerClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Local dev: DeveloperToolsCredential. Production: use ManagedIdentityCredential.
    let credential = DeveloperToolsCredential::new(None)?;

    let producer = ProducerClient::builder()
        .open("<namespace>.servicebus.windows.net", "<eventhub-name>", credential.clone())
        .await?;
    Ok(())
}
```

## Core Workflow

### Send Events

```rust
// Send a single event
producer.send_event(vec![1, 2, 3, 4], None).await?;
```

### Send Batch

```rust
let batch = producer.create_batch(None).await?;
batch.try_add_event_data(vec![1, 2, 3, 4], None)?;

producer.send_batch(batch, None).await?;
```

### Receive Events

```rust
use azure_identity::DeveloperToolsCredential;
use azure_messaging_eventhubs::ConsumerClient;

// Local dev: DeveloperToolsCredential. Production: use ManagedIdentityCredential.
let credential = DeveloperToolsCredential::new(None)?;
let consumer = ConsumerClient::builder()
    .open("<namespace>.servicebus.windows.net", "<eventhub-name>", credential.clone())
    .await?;
```

### Receive from Partition

```rust
use futures::stream::StreamExt;
use azure_messaging_eventhubs::{
    ConsumerClient, OpenReceiverOptions, StartLocation, StartPosition,
};

let receiver = consumer
    .open_receiver_on_partition(
        "0".to_string(),
        Some(OpenReceiverOptions {
            start_position: Some(StartPosition {
                location: StartLocation::Earliest,
                ..Default::default()
            }),
            ..Default::default()
        }),
    )
    .await?;

let mut stream = receiver.stream_events();
while let Some(event_result) = stream.next().await {
    match event_result {
        Ok(event) => println!("Received: {:?}", event),
        Err(err) => eprintln!("Error: {:?}", err),
    }
}
```

## RBAC Roles

For Entra ID auth, assign one of these roles:

| Role                             | Access         |
| -------------------------------- | -------------- |
| `Azure Event Hubs Data Sender`   | Send events    |
| `Azure Event Hubs Data Receiver` | Receive events |
| `Azure Event Hubs Data Owner`    | Full access    |

## Best Practices

1. **Use `DeveloperToolsCredential` for local development and `ManagedIdentityCredential` for production.** The Rust SDK does not support `DefaultAzureCredential`, so explicitly use the appropriate credential in each environment.
2. **Use batching for throughput optimization.** Call `create_batch()` to build batches of events, then send with `send_batch()` instead of sending individual events.
3. **Assign appropriate RBAC roles for Entra ID auth.** For production authentication using Entra ID, ensure the identity has the necessary RBAC role assigned (e.g., "Azure Event Hubs Data Sender" for sending, "Azure Event Hubs Data Receiver" for receiving).
4. **Always verify package versions using crates.io.** Before using a package, check its version on [crates.io](https://crates.io/) to ensure you are using a stable and supported release.
5. **Never hardcode credentials** — use environment variables or managed identity
6. **Handle errors per event** — match on `Ok`/`Err` in the event stream to handle per-event failures gracefully

## Reference Links

| Resource      | Link                                               |
| ------------- | -------------------------------------------------- |
| API Reference | https://docs.rs/azure_messaging_eventhubs          |
| crates.io     | https://crates.io/crates/azure_messaging_eventhubs |
