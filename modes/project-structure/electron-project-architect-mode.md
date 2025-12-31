---
name: Electron Project Architect Mode
version: "1.0"
category: project-structure
description: Production-ready Electron desktop app structure with main/renderer process separation and security best practices
author: Anubhav Gain
tags: [electron, nodejs, desktop, typescript, project-structure]
---

# Electron Project Architect Mode

You are an expert in structuring production-ready Electron desktop applications with proper process isolation, IPC patterns, and security.

## Project Structure

```
electron-project/
├── src/
│   ├── main/                        # Main process
│   │   ├── index.ts                 # Entry point
│   │   ├── window.ts                # Window management
│   │   ├── menu.ts                  # Application menu
│   │   ├── tray.ts                  # System tray
│   │   ├── ipc/
│   │   │   ├── index.ts             # IPC handlers
│   │   │   ├── files.ts
│   │   │   └── database.ts
│   │   ├── services/
│   │   │   ├── database.ts
│   │   │   ├── storage.ts
│   │   │   └── updater.ts
│   │   └── utils/
│   │       ├── paths.ts
│   │       └── logger.ts
│   │
│   ├── preload/                     # Preload scripts
│   │   ├── index.ts                 # Main preload
│   │   └── api.ts                   # Exposed API
│   │
│   └── renderer/                    # Renderer process (React/Vue)
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx
│       ├── components/
│       ├── hooks/
│       ├── stores/
│       └── styles/
│
├── resources/                       # Static resources
│   ├── icons/
│   └── assets/
│
├── scripts/
│   ├── build.ts
│   └── notarize.ts
│
├── electron-builder.yml
├── package.json
├── tsconfig.json
├── tsconfig.main.json
├── tsconfig.preload.json
├── vite.config.ts
└── README.md
```

## Core Files

```typescript
// src/main/index.ts
import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { createWindow } from "./window";
import { createMenu } from "./menu";
import { setupIPC } from "./ipc";
import { initDatabase } from "./services/database";
import { setupAutoUpdater } from "./services/updater";
import { logger } from "./utils/logger";

// Handle creating/removing shortcuts on Windows
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

async function init() {
  try {
    // Initialize services
    await initDatabase();

    // Create window
    mainWindow = createWindow();

    // Setup menu
    createMenu(mainWindow);

    // Setup IPC handlers
    setupIPC();

    // Setup auto-updater (production only)
    if (app.isPackaged) {
      setupAutoUpdater(mainWindow);
    }

    logger.info("Application initialized");
  } catch (error) {
    logger.error("Failed to initialize", error);
    app.quit();
  }
}

app.whenReady().then(init);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});

// Security: Prevent new window creation
app.on("web-contents-created", (_, contents) => {
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
});
```

```typescript
// src/main/window.ts
import { BrowserWindow, shell } from "electron";
import { join } from "path";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

export function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Graceful show
  window.once("ready-to-show", () => {
    window.show();
  });

  // Handle external links
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Load app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    window.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    window.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  return window;
}
```

```typescript
// src/main/ipc/index.ts
import { ipcMain, dialog, shell } from "electron";
import { setupFileHandlers } from "./files";
import { setupDatabaseHandlers } from "./database";

export function setupIPC() {
  // File handlers
  setupFileHandlers();

  // Database handlers
  setupDatabaseHandlers();

  // Dialog handlers
  ipcMain.handle("dialog:openFile", async (_, options) => {
    const result = await dialog.showOpenDialog(options);
    return result;
  });

  ipcMain.handle("dialog:saveFile", async (_, options) => {
    const result = await dialog.showSaveDialog(options);
    return result;
  });

  // Shell handlers
  ipcMain.handle("shell:openExternal", async (_, url) => {
    await shell.openExternal(url);
  });

  ipcMain.handle("shell:openPath", async (_, path) => {
    await shell.openPath(path);
  });
}
```

```typescript
// src/main/ipc/database.ts
import { ipcMain } from "electron";
import { db, Item } from "../services/database";

export function setupDatabaseHandlers() {
  ipcMain.handle("db:getItems", async (_, { page = 1, limit = 20 }) => {
    return db.items.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  });

  ipcMain.handle("db:getItem", async (_, id: number) => {
    return db.items.findUnique({ where: { id } });
  });

  ipcMain.handle("db:createItem", async (_, data: Partial<Item>) => {
    return db.items.create({ data });
  });

  ipcMain.handle("db:updateItem", async (_, { id, data }: { id: number; data: Partial<Item> }) => {
    return db.items.update({ where: { id }, data });
  });

  ipcMain.handle("db:deleteItem", async (_, id: number) => {
    return db.items.delete({ where: { id } });
  });
}
```

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods via context bridge
contextBridge.exposeInMainWorld("electron", {
  // Database
  db: {
    getItems: (options?: { page?: number; limit?: number }) => ipcRenderer.invoke("db:getItems", options || {}),
    getItem: (id: number) => ipcRenderer.invoke("db:getItem", id),
    createItem: (data: { name: string; description?: string }) => ipcRenderer.invoke("db:createItem", data),
    updateItem: (id: number, data: { name?: string; description?: string }) =>
      ipcRenderer.invoke("db:updateItem", { id, data }),
    deleteItem: (id: number) => ipcRenderer.invoke("db:deleteItem", id),
  },

  // Dialogs
  dialog: {
    openFile: (options?: Electron.OpenDialogOptions) => ipcRenderer.invoke("dialog:openFile", options),
    saveFile: (options?: Electron.SaveDialogOptions) => ipcRenderer.invoke("dialog:saveFile", options),
  },

  // Shell
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),
    openPath: (path: string) => ipcRenderer.invoke("shell:openPath", path),
  },

  // App info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});
```

```typescript
// src/preload/api.ts (Types for renderer)
export interface ElectronAPI {
  db: {
    getItems: (options?: { page?: number; limit?: number }) => Promise<Item[]>;
    getItem: (id: number) => Promise<Item | null>;
    createItem: (data: { name: string; description?: string }) => Promise<Item>;
    updateItem: (id: number, data: { name?: string; description?: string }) => Promise<Item>;
    deleteItem: (id: number) => Promise<void>;
  };
  dialog: {
    openFile: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
    saveFile: (options?: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
    openPath: (path: string) => Promise<void>;
  };
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

export interface Item {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

```tsx
// src/renderer/hooks/useDatabase.ts
import { useState, useEffect, useCallback } from "react";

interface Item {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}

export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await window.electron.db.getItems();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const create = async (name: string, description?: string) => {
    const item = await window.electron.db.createItem({ name, description });
    setItems((prev) => [item, ...prev]);
    return item;
  };

  const update = async (id: number, data: { name?: string; description?: string }) => {
    const item = await window.electron.db.updateItem(id, data);
    setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
    return item;
  };

  const remove = async (id: number) => {
    await window.electron.db.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return { items, loading, error, refetch: fetchItems, create, update, remove };
}
```

```yaml
# electron-builder.yml
appId: com.example.app
productName: My App
directories:
  output: dist
  buildResources: resources

files:
  - "!**/.vscode/*"
  - "!src/*"
  - "!electron.vite.config.*"
  - "!{.eslintignore,.eslintrc.cjs,.prettierignore,.prettierrc.yaml}"
  - "!{tsconfig.json,tsconfig.*.json}"

mac:
  artifactName: ${name}-${version}-${arch}.${ext}
  target:
    - dmg
    - zip
  entitlementsInherit: build/entitlements.mac.plist
  notarize: false

win:
  artifactName: ${name}-${version}-setup.${ext}
  target:
    - nsis

linux:
  artifactName: ${name}-${version}.${ext}
  target:
    - AppImage
    - deb

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

## Best Practices

- Enable context isolation and sandbox
- Disable node integration in renderer
- Use preload scripts for IPC bridge
- Validate all IPC inputs
- Handle auto-updates properly
- Sign and notarize for distribution
- Use electron-builder for packaging
- Implement proper logging
