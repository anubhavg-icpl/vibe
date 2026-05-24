---
name: tauri-project-architect
description: Production-ready Tauri desktop app structure with Rust backend and web frontend. Use when scaffolding, structuring, or architecting tauri projects.
license: CC-BY-NC-SA-4.0
metadata:
  risk: unknown
  source: community
  kind: mode
  category: project-structure
  tags: [tauri, rust, desktop, typescript, project-structure]
---

# Tauri Project Architect Mode

You are an expert in structuring production-ready Tauri desktop applications with Rust backend and modern web frontend.

## Project Structure

```text
tauri-project/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs                  # Entry point
│   │   ├── lib.rs                   # Library root
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── files.rs             # File operations
│   │   │   ├── database.rs          # DB commands
│   │   │   └── system.rs            # System info
│   │   ├── state/
│   │   │   ├── mod.rs
│   │   │   └── app_state.rs         # App state
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── connection.rs
│   │   │   └── models.rs
│   │   ├── utils/
│   │   │   ├── mod.rs
│   │   │   └── config.rs
│   │   └── menu.rs                  # App menu
│   │
│   ├── icons/                       # App icons
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── build.rs
│
├── src/                             # Frontend (React/Vue/Svelte)
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── features/
│   ├── hooks/
│   │   ├── useTauri.ts
│   │   └── useDatabase.ts
│   ├── lib/
│   │   ├── tauri.ts                 # Tauri API wrapper
│   │   └── utils.ts
│   ├── stores/
│   │   └── app.ts
│   └── styles/
│       └── globals.css
│
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Core Files

```rust
// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

mod commands;
mod db;
mod menu;
mod state;

use commands::{database, files, system};
use state::AppState;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize app state
            let app_state = AppState::new(app.handle())?;
            app.manage(app_state);

            // Initialize database
            let db = db::init(&app.handle())?;
            app.manage(db);

            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }

            Ok(())
        })
        .menu(menu::create_menu())
        .on_menu_event(menu::handle_menu_event)
        .invoke_handler(tauri::generate_handler![
            // File commands
            files::read_file,
            files::write_file,
            files::list_directory,
            // Database commands
            database::get_items,
            database::create_item,
            database::update_item,
            database::delete_item,
            // System commands
            system::get_system_info,
            system::open_external,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```rust
// src-tauri/src/commands/files.rs
use std::fs;
use std::path::PathBuf;
use tauri::command;

#[derive(serde::Serialize)]
pub struct FileInfo {
    name: String,
    path: String,
    is_dir: bool,
    size: u64,
}

#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[command]
pub async fn list_directory(path: String) -> Result<Vec<FileInfo>, String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;

    let files: Vec<FileInfo> = entries
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let metadata = entry.metadata().ok()?;
            Some(FileInfo {
                name: entry.file_name().to_string_lossy().to_string(),
                path: entry.path().to_string_lossy().to_string(),
                is_dir: metadata.is_dir(),
                size: metadata.len(),
            })
        })
        .collect();

    Ok(files)
}
```

```rust
// src-tauri/src/commands/database.rs
use tauri::{command, State};
use crate::db::{Database, Item};

#[command]
pub async fn get_items(
    db: State<'_, Database>,
    page: Option<i32>,
    limit: Option<i32>,
) -> Result<Vec<Item>, String> {
    let page = page.unwrap_or(1);
    let limit = limit.unwrap_or(20);

    db.get_items(page, limit)
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn create_item(
    db: State<'_, Database>,
    name: String,
    description: Option<String>,
) -> Result<Item, String> {
    db.create_item(&name, description.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn update_item(
    db: State<'_, Database>,
    id: i32,
    name: String,
    description: Option<String>,
) -> Result<Item, String> {
    db.update_item(id, &name, description.as_deref())
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn delete_item(
    db: State<'_, Database>,
    id: i32,
) -> Result<(), String> {
    db.delete_item(id)
        .await
        .map_err(|e| e.to_string())
}
```

```rust
// src-tauri/src/db/mod.rs
mod connection;
mod models;

pub use connection::Database;
pub use models::Item;

use tauri::AppHandle;
use std::path::PathBuf;

pub fn init(app: &AppHandle) -> Result<Database, Box<dyn std::error::Error>> {
    let app_dir = app.path_resolver()
        .app_data_dir()
        .expect("failed to get app data dir");

    std::fs::create_dir_all(&app_dir)?;

    let db_path = app_dir.join("data.db");
    Database::new(&db_path)
}
```

```typescript
// src/lib/tauri.ts
import { invoke } from "@tauri-apps/api/tauri";
import { open, save } from "@tauri-apps/api/dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";

export interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}

export interface Item {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

// File operations
export async function readFile(path: string): Promise<string> {
  return invoke("read_file", { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
  return invoke("write_file", { path, content });
}

export async function listDirectory(path: string): Promise<FileInfo[]> {
  return invoke("list_directory", { path });
}

// Database operations
export async function getItems(page = 1, limit = 20): Promise<Item[]> {
  return invoke("get_items", { page, limit });
}

export async function createItem(name: string, description?: string): Promise<Item> {
  return invoke("create_item", { name, description });
}

export async function updateItem(id: number, name: string, description?: string): Promise<Item> {
  return invoke("update_item", { id, name, description });
}

export async function deleteItem(id: number): Promise<void> {
  return invoke("delete_item", { id });
}

// Dialog helpers
export async function openFileDialog(filters?: { name: string; extensions: string[] }[]) {
  return open({
    multiple: false,
    filters,
  });
}

export async function saveFileDialog(defaultPath?: string) {
  return save({ defaultPath });
}
```

```tsx
// src/hooks/useTauri.ts
import { useState, useEffect, useCallback } from "react";
import { getItems, createItem, updateItem, deleteItem, Item } from "../lib/tauri";

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const create = async (name: string, description?: string) => {
    const item = await createItem(name, description);
    setItems((prev) => [item, ...prev]);
    return item;
  };

  const update = async (id: number, name: string, description?: string) => {
    const item = await updateItem(id, name, description);
    setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
    return item;
  };

  const remove = async (id: number) => {
    await deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return {
    items,
    loading,
    error,
    refetch: fetchItems,
    create,
    update,
    remove,
  };
}
```

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Tauri App",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": { "open": true },
      "dialog": { "all": true },
      "fs": {
        "all": true,
        "scope": ["$APP/*", "$DOCUMENT/*", "$DOWNLOAD/*"]
      },
      "path": { "all": true }
    },
    "bundle": {
      "active": true,
      "icon": ["icons/icon.icns", "icons/icon.ico", "icons/icon.png"],
      "identifier": "com.example.app",
      "targets": "all"
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "title": "Tauri App",
        "width": 1200,
        "height": 800,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

## Best Practices

- Use Rust for CPU-intensive operations
- Keep frontend lightweight
- Use Tauri commands for IPC
- Manage state in Rust when needed
- Use proper error handling with Result
- Store data in app data directory
- Configure security allowlist carefully
- Build for all target platforms
