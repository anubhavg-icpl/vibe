#!/usr/bin/env node

// src/index.ts
import { program } from "commander";
import * as p from "@clack/prompts";
import chalk2 from "chalk";
import { existsSync as existsSync2 } from "fs";
import { dirname as dirname2, resolve } from "path";
import { fileURLToPath } from "url";

// src/discovery.ts
import { readdir, readFile, stat } from "fs/promises";
import { join, basename, dirname, sep, posix } from "path";
import matter from "gray-matter";
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__",
  ".cache",
  ".turbo",
  ".next"
]);
var fwd = (p2) => p2.split(sep).join(posix.sep);
function extractDescription(content) {
  for (const raw of content.split("\n")) {
    const trimmed = raw.trim();
    if (trimmed.length > 20 && trimmed.length < 240 && !trimmed.startsWith("#") && !trimmed.startsWith("---")) {
      return trimmed;
    }
  }
  return "No description available";
}
function extractCategory(filePath, anchor) {
  const parts = fwd(filePath).split(posix.sep);
  const idx = parts.lastIndexOf(anchor);
  if (idx !== -1 && parts.length > idx + 1) return parts[idx + 1];
  return "general";
}
async function readMd(path) {
  try {
    const raw = await readFile(path, "utf-8");
    return matter(raw);
  } catch {
    return null;
  }
}
async function discoverSkills(root) {
  const out = [];
  const skillsDir = join(root, "skills");
  let entries;
  try {
    entries = await readdir(skillsDir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const dir = join(skillsDir, name);
    let s;
    try {
      s = await stat(dir);
    } catch {
      continue;
    }
    if (!s.isDirectory()) continue;
    const skillMd = join(dir, "SKILL.md");
    const fm = await readMd(skillMd);
    if (!fm) continue;
    const title = fm.data.name || name;
    out.push({
      kind: "skill",
      name,
      description: fm.data.description || extractDescription(fm.content),
      path: dir,
      category: fm.data.category || "skill",
      metadata: { ...fm.data, title }
    });
  }
  return out;
}
async function walkMarkdown(dir, depth = 0, maxDepth = 5) {
  const out = [];
  if (depth > maxDepth) return out;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p2 = join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...await walkMarkdown(p2, depth + 1, maxDepth));
    } else if (e.isFile() && e.name.endsWith(".md")) {
      out.push(p2);
    }
  }
  return out;
}
async function discoverFlat(root, anchor, kind) {
  const out = [];
  const dir = join(root, anchor);
  let exists = true;
  try {
    await stat(dir);
  } catch {
    exists = false;
  }
  if (!exists) return out;
  const files = await walkMarkdown(dir);
  const seen = /* @__PURE__ */ new Set();
  for (const file of files) {
    const base = basename(file).replace(/\.md$/, "");
    if (base.toUpperCase() === "README") continue;
    const fm = await readMd(file);
    if (!fm) continue;
    const name = fm.data.name || base;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({
      kind,
      name,
      description: fm.data.description || extractDescription(fm.content),
      path: file,
      category: extractCategory(file, anchor),
      metadata: fm.data
    });
  }
  return out;
}
async function discoverModesAsset(root) {
  const out = [];
  const modesDir = join(root, "modes");
  let exists = true;
  try {
    await stat(modesDir);
  } catch {
    exists = false;
  }
  if (!exists) return out;
  const files = await walkMarkdown(modesDir);
  const seen = /* @__PURE__ */ new Set();
  for (const file of files) {
    const base = basename(file).replace(/\.md$/, "");
    if (base.toUpperCase() === "README") continue;
    const fm = await readMd(file);
    if (!fm) continue;
    const name = fm.data.name || base;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push({
      kind: "mode",
      name,
      description: fm.data.description || extractDescription(fm.content),
      path: dirname(file) === modesDir ? file : dirname(file),
      category: fm.data.category || extractCategory(file, "modes"),
      metadata: { ...fm.data, modeFile: file }
    });
  }
  return out;
}
async function discoverAssets(root, options = {}) {
  const wanted = new Set(
    options.kinds && options.kinds.length > 0 ? options.kinds : ["skill", "agent", "command", "mode"]
  );
  const tasks = [];
  if (wanted.has("skill")) tasks.push(discoverSkills(root));
  if (wanted.has("agent")) tasks.push(discoverFlat(root, "agents", "agent"));
  if (wanted.has("command"))
    tasks.push(discoverFlat(root, "commands", "command"));
  if (wanted.has("mode")) tasks.push(discoverModesAsset(root));
  const buckets = await Promise.all(tasks);
  return buckets.flat();
}
function summariseCounts(assets) {
  const c = {
    skill: 0,
    agent: 0,
    command: 0,
    mode: 0
  };
  for (const a of assets) c[a.kind]++;
  return c;
}

// src/installer.ts
import { mkdir, cp, access, readFile as readFile2, writeFile, readdir as readdir2 } from "fs/promises";
import { join as join3 } from "path";
import matter2 from "gray-matter";

// src/agents.ts
import { homedir } from "os";
import { join as join2 } from "path";
import { existsSync } from "fs";
var home = homedir();
var agents = {
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    detectInstalled: async () => existsSync(join2(home, ".config/opencode")) || existsSync(join2(home, ".opencode")),
    kindPaths: {
      skill: {
        project: ".opencode/skill",
        global: join2(home, ".config/opencode/skill")
      },
      agent: {
        project: ".opencode/agent",
        global: join2(home, ".config/opencode/agent")
      },
      command: {
        project: ".opencode/command",
        global: join2(home, ".config/opencode/command")
      },
      mode: {
        project: ".opencode/skill",
        global: join2(home, ".config/opencode/skill")
      }
    }
  },
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    detectInstalled: async () => existsSync(join2(home, ".claude")),
    kindPaths: {
      skill: { project: ".claude/skills", global: join2(home, ".claude/skills") },
      agent: { project: ".claude/agents", global: join2(home, ".claude/agents") },
      command: {
        project: ".claude/commands",
        global: join2(home, ".claude/commands")
      },
      mode: { project: ".claude/skills", global: join2(home, ".claude/skills") }
    }
  },
  codex: {
    name: "codex",
    displayName: "OpenAI Codex",
    detectInstalled: async () => existsSync(join2(home, ".codex")),
    kindPaths: {
      skill: { project: ".codex/skills", global: join2(home, ".codex/skills") },
      agent: { project: ".codex/agents", global: join2(home, ".codex/agents") },
      command: {
        project: ".codex/commands",
        global: join2(home, ".codex/commands")
      },
      mode: { project: ".codex/skills", global: join2(home, ".codex/skills") }
    }
  },
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    detectInstalled: async () => existsSync(join2(home, ".cursor")),
    kindPaths: {
      skill: { project: ".cursor/skills", global: join2(home, ".cursor/skills") },
      agent: { project: ".cursor/agents", global: join2(home, ".cursor/agents") },
      command: {
        project: ".cursor/commands",
        global: join2(home, ".cursor/commands")
      },
      mode: { project: ".cursor/skills", global: join2(home, ".cursor/skills") }
    }
  },
  "gemini-cli": {
    name: "gemini-cli",
    displayName: "Gemini CLI",
    detectInstalled: async () => existsSync(join2(home, ".gemini")) || existsSync(join2(home, ".config/gemini")),
    kindPaths: {
      skill: { project: ".gemini/skills", global: join2(home, ".gemini/skills") },
      agent: { project: ".gemini/agents", global: join2(home, ".gemini/agents") },
      // Gemini commands are .toml only — copying .md is best-effort and a
      // future conversion script will emit proper .toml. For now we copy as-is
      // so the user has the content; Gemini ignores files it cannot parse.
      command: {
        project: ".gemini/commands",
        global: join2(home, ".gemini/commands")
      },
      mode: { project: ".gemini/skills", global: join2(home, ".gemini/skills") }
    }
  },
  "copilot-cli": {
    name: "copilot-cli",
    displayName: "GitHub Copilot CLI",
    detectInstalled: async () => existsSync(join2(home, ".copilot")),
    kindPaths: {
      skill: {
        project: ".copilot/skills",
        global: join2(home, ".copilot/skills")
      },
      // Copilot CLI expects .agent.md extension. We still drop the file for
      // the user; a future conversion script will rename to .agent.md.
      agent: {
        project: ".copilot/agents",
        global: join2(home, ".copilot/agents")
      },
      command: {
        project: ".copilot/commands",
        global: join2(home, ".copilot/commands")
      },
      mode: {
        project: ".copilot/skills",
        global: join2(home, ".copilot/skills")
      }
    }
  },
  "factory-droid": {
    name: "factory-droid",
    displayName: "Factory Droid",
    detectInstalled: async () => existsSync(join2(home, ".factory")),
    kindPaths: {
      skill: {
        project: ".factory/skills",
        global: join2(home, ".factory/skills")
      },
      // Droid renames "agents" → "droids" in its on-disk layout.
      agent: {
        project: ".factory/droids",
        global: join2(home, ".factory/droids")
      },
      command: {
        project: ".factory/commands",
        global: join2(home, ".factory/commands")
      },
      mode: {
        project: ".factory/skills",
        global: join2(home, ".factory/skills")
      }
    }
  }
};
var ALL_AGENT_TYPES = Object.keys(agents);
async function detectInstalledAgents() {
  const installed = [];
  for (const [type, config] of Object.entries(agents)) {
    if (await config.detectInstalled()) installed.push(type);
  }
  return installed;
}
function getKindDir(type, kind, options = {}) {
  const cfg = agents[type];
  const slot = cfg.kindPaths[kind];
  if (!slot) return null;
  const path = options.global ? slot.global : slot.project;
  if (!path) return null;
  return options.global ? path : join2(options.cwd ?? process.cwd(), path);
}

// src/installer.ts
async function installAsset(asset, agentType, options = {}) {
  const destBase = getKindDir(agentType, asset.kind, options);
  if (!destBase) {
    return {
      success: true,
      skipped: true,
      reason: `${agents[agentType].displayName} does not natively support ${asset.kind}s`,
      path: ""
    };
  }
  try {
    if (asset.kind === "skill") {
      const dest = join3(destBase, asset.name);
      await mkdir(dest, { recursive: true });
      await cp(asset.path, dest, { recursive: true });
      return { success: true, path: dest };
    }
    if (asset.kind === "agent" || asset.kind === "command") {
      await mkdir(destBase, { recursive: true });
      const ext = agentType === "copilot-cli" && asset.kind === "agent" ? ".agent.md" : ".md";
      const dest = join3(destBase, `${asset.name}${ext}`);
      await cp(asset.path, dest);
      return { success: true, path: dest };
    }
    if (asset.kind === "mode") {
      const dest = join3(destBase, asset.name);
      await mkdir(dest, { recursive: true });
      const modeFile = asset.metadata?.modeFile || asset.path;
      await convertModeToSkill(modeFile, dest, asset);
      await copyExtras(modeFile, dest);
      return { success: true, path: dest };
    }
    return {
      success: false,
      path: "",
      error: `Unknown asset kind: ${asset.kind}`
    };
  } catch (error) {
    return {
      success: false,
      path: destBase,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
async function convertModeToSkill(modeFile, destDir, asset) {
  const raw = await readFile2(modeFile, "utf-8");
  const { data, content } = matter2(raw);
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const skillName = data.name || asset.name;
  const skillDescription = data.description || asset.description;
  const fm = ["---"];
  fm.push(`name: ${skillName}`);
  fm.push(`description: ${escapeYaml(skillDescription)}`);
  if (data.category) fm.push(`category: ${escapeYaml(String(data.category))}`);
  if (data.author) fm.push(`author: ${escapeYaml(String(data.author))}`);
  if (tags.length > 0) {
    fm.push("tags:");
    for (const t of tags) fm.push(`  - ${escapeYaml(String(t))}`);
  }
  fm.push("---");
  const body = `${fm.join("\n")}

# ${data.displayName || skillName}

${content}`;
  await writeFile(join3(destDir, "SKILL.md"), body, "utf-8");
}
function escapeYaml(s) {
  if (/[:#"'\n]/.test(s)) return JSON.stringify(s);
  return s;
}
async function copyExtras(modeFile, destDir) {
  const sourceDir = modeFile.endsWith("-mode.md") || modeFile.endsWith(".md") ? sourceDirOf(modeFile) : modeFile;
  if (sourceDir === modeFile) return;
  let entries;
  try {
    entries = await readdir2(sourceDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const src = join3(sourceDir, entry.name);
    if (src === modeFile) continue;
    const dest = join3(destDir, entry.name);
    try {
      if (entry.isDirectory()) {
        await cp(src, dest, { recursive: true });
      } else if (entry.isFile() && !entry.name.endsWith("-mode.md")) {
        await cp(src, dest);
      }
    } catch {
    }
  }
}
function sourceDirOf(filePath) {
  const idx = filePath.lastIndexOf("/");
  const win = filePath.lastIndexOf("\\");
  const cut = Math.max(idx, win);
  return cut === -1 ? filePath : filePath.slice(0, cut);
}
async function isAssetInstalled(asset, agentType, options = {}) {
  const destBase = getKindDir(agentType, asset.kind, options);
  if (!destBase) return false;
  const target = asset.kind === "skill" || asset.kind === "mode" ? join3(destBase, asset.name) : join3(
    destBase,
    asset.name + (agentType === "copilot-cli" && asset.kind === "agent" ? ".agent.md" : ".md")
  );
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}
function getInstallTarget(asset, agentType, options = {}) {
  const destBase = getKindDir(agentType, asset.kind, options);
  if (!destBase) return null;
  if (asset.kind === "skill" || asset.kind === "mode")
    return join3(destBase, asset.name);
  const ext = agentType === "copilot-cli" && asset.kind === "agent" ? ".agent.md" : ".md";
  return join3(destBase, asset.name + ext);
}
async function installParallel(tasks, options = {}, onProgress) {
  const concurrency = options.concurrency ?? 4;
  const results = [];
  const queue = [...tasks];
  let completed = 0;
  const runOne = async (task) => {
    const r = await installAsset(task.asset, task.agent, options);
    return {
      asset: task.asset.name,
      kind: task.asset.kind,
      agent: agents[task.agent].displayName,
      success: r.success,
      skipped: !!r.skipped,
      reason: r.reason,
      path: r.path,
      error: r.error
    };
  };
  const workers = Array(Math.min(concurrency, queue.length)).fill(null).map(async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;
      onProgress?.({
        completed,
        total: tasks.length,
        current: task,
        results: [...results]
      });
      const r = await runOne(task);
      results.push(r);
      completed++;
      onProgress?.({
        completed,
        total: tasks.length,
        current: null,
        results: [...results]
      });
    }
  });
  await Promise.all(workers);
  return results;
}
function buildTasks(assets, agentTypes) {
  const out = [];
  for (const asset of assets)
    for (const agent of agentTypes) out.push({ asset, agent });
  return out;
}

// src/config.ts
import { readFile as readFile3, writeFile as writeFile2, access as access2 } from "fs/promises";
import { join as join4 } from "path";
import { homedir as homedir2 } from "os";
import YAML from "yaml";
var CONFIG_FILENAME = ".vibeconfig.yaml";
var CONFIG_FILENAME_ALT = ".vibeconfig.yml";
var DEFAULT_CONFIG = {
  version: "1.0.0",
  defaults: {
    agents: [],
    global: false
  },
  favorites: [],
  theme: "dark",
  parallelInstalls: 4
};
async function findConfigFile(cwd) {
  const searchPaths = [
    cwd ? join4(cwd, CONFIG_FILENAME) : join4(process.cwd(), CONFIG_FILENAME),
    cwd ? join4(cwd, CONFIG_FILENAME_ALT) : join4(process.cwd(), CONFIG_FILENAME_ALT),
    join4(homedir2(), CONFIG_FILENAME),
    join4(homedir2(), CONFIG_FILENAME_ALT)
  ];
  for (const configPath of searchPaths) {
    try {
      await access2(configPath);
      return configPath;
    } catch {
    }
  }
  return null;
}
async function loadConfig(cwd) {
  const configPath = await findConfigFile(cwd);
  if (!configPath) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const content = await readFile3(configPath, "utf-8");
    const parsed = YAML.parse(content);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      defaults: {
        ...DEFAULT_CONFIG.defaults,
        ...parsed.defaults
      }
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
async function saveConfig(config, path) {
  const targetPath = path || join4(process.cwd(), CONFIG_FILENAME);
  const content = YAML.stringify(config, { indent: 2 });
  await writeFile2(targetPath, content, "utf-8");
}
async function initConfig(cwd) {
  const targetPath = join4(cwd || process.cwd(), CONFIG_FILENAME);
  try {
    await access2(targetPath);
    throw new Error(`Config file already exists at ${targetPath}`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
  const exampleConfig = {
    version: "1.0.0",
    defaults: {
      agents: ["claude-code"],
      global: false
    },
    favorites: [
      "tony-stark-mode",
      "software-engineer-agent-mode"
    ],
    theme: "dark",
    parallelInstalls: 4
  };
  await saveConfig(exampleConfig, targetPath);
  return targetPath;
}
function mergeConfigWithOptions(config, options) {
  const merged = { ...options };
  if (config.defaults) {
    if (config.defaults.agents && config.defaults.agents.length > 0 && !options.agent) {
      merged.agent = config.defaults.agents;
    }
    if (config.defaults.global !== void 0 && options.global === void 0) {
      merged.global = config.defaults.global;
    }
    if (config.defaults.source && !options.source) {
      merged.source = config.defaults.source;
    }
  }
  return merged;
}
function getConfigParallelism(config) {
  return config.parallelInstalls ?? 4;
}

// src/completions.ts
var BASH_COMPLETION = `
# vibe bash completion
_vibe_completions() {
    local cur prev opts modes agents
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Main options
    opts="-h --help -v --version -g --global -a --agent -s --mode -c --category -l --list -y --yes --json --preview"

    # Agents
    agents="opencode claude-code codex cursor"

    case "\${prev}" in
        -a|--agent)
            COMPREPLY=( $(compgen -W "\${agents}" -- \${cur}) )
            return 0
            ;;
        -c|--category)
            # Categories could be dynamically loaded, but here are common ones
            local categories="development languages testing documentation security devops ai-ml web mobile"
            COMPREPLY=( $(compgen -W "\${categories}" -- \${cur}) )
            return 0
            ;;
        -s|--mode|--preview)
            # Modes would ideally be loaded dynamically
            COMPREPLY=()
            return 0
            ;;
        *)
            ;;
    esac

    if [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "\${opts}" -- \${cur}) )
        return 0
    fi

    # Default to directory completion
    COMPREPLY=( $(compgen -d -- \${cur}) )
}

complete -F _vibe_completions vibe
`;
var ZSH_COMPLETION = `
#compdef vibe

_vibe() {
    local -a commands
    local -a options

    options=(
        '-h[Show help]'
        '--help[Show help]'
        '-v[Show version]'
        '--version[Show version]'
        '-g[Install globally]'
        '--global[Install globally]'
        '-a[Specify agents]:agent:(opencode claude-code codex cursor)'
        '--agent[Specify agents]:agent:(opencode claude-code codex cursor)'
        '-s[Specify modes]:mode:'
        '--mode[Specify modes]:mode:'
        '-c[Filter by category]:category:(development languages testing documentation security devops ai-ml web mobile)'
        '--category[Filter by category]:category:(development languages testing documentation security devops ai-ml web mobile)'
        '-l[List available modes]'
        '--list[List available modes]'
        '-y[Skip confirmations]'
        '--yes[Skip confirmations]'
        '--json[Output in JSON format]'
        '--preview[Preview a mode]:mode:'
    )

    _arguments -s \\
        $options \\
        '*:directory:_files -/'
}

_vibe "$@"
`;
var FISH_COMPLETION = `
# vibe fish completion

# Disable file completion by default
complete -c vibe -f

# Options
complete -c vibe -s h -l help -d "Show help"
complete -c vibe -s v -l version -d "Show version"
complete -c vibe -s g -l global -d "Install globally"
complete -c vibe -s y -l yes -d "Skip confirmations"
complete -c vibe -s l -l list -d "List available modes"
complete -c vibe -l json -d "Output in JSON format"

# Agent option
complete -c vibe -s a -l agent -d "Specify agent" -xa "opencode claude-code codex cursor"

# Category option
complete -c vibe -s c -l category -d "Filter by category" -xa "development languages testing documentation security devops ai-ml web mobile"

# Mode option (no completions, dynamic)
complete -c vibe -s s -l mode -d "Specify mode name"

# Preview option
complete -c vibe -l preview -d "Preview a mode"

# Directory argument
complete -c vibe -a "(__fish_complete_directories)"
`;
function getCompletionScript(shell) {
  switch (shell) {
    case "bash":
      return BASH_COMPLETION.trim();
    case "zsh":
      return ZSH_COMPLETION.trim();
    case "fish":
      return FISH_COMPLETION.trim();
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}
function getInstallInstructions(shell) {
  switch (shell) {
    case "bash":
      return `
# Add to your ~/.bashrc or ~/.bash_profile:
eval "$(vibe completions bash)"

# Or save to a file:
vibe completions bash > ~/.local/share/bash-completion/completions/vibe
`.trim();
    case "zsh":
      return `
# Add to your ~/.zshrc:
eval "$(vibe completions zsh)"

# Or save to your fpath:
vibe completions zsh > ~/.zsh/completions/_vibe
# Make sure ~/.zsh/completions is in your fpath
`.trim();
    case "fish":
      return `
# Save to fish completions directory:
vibe completions fish > ~/.config/fish/completions/vibe.fish
`.trim();
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}
function detectShell() {
  const shell = process.env.SHELL || "";
  if (shell.includes("bash")) return "bash";
  if (shell.includes("zsh")) return "zsh";
  if (shell.includes("fish")) return "fish";
  return null;
}

// src/output.ts
function formatAssetsAsJson(items, version) {
  const categories = /* @__PURE__ */ new Map();
  const byKind = {};
  for (const a of items) {
    categories.set(a.category, (categories.get(a.category) ?? 0) + 1);
    byKind[a.kind] = (byKind[a.kind] ?? 0) + 1;
  }
  const out = {
    version,
    total: items.length,
    byKind,
    categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    items: items.map((a) => ({
      kind: a.kind,
      name: a.name,
      description: a.description,
      category: a.category,
      path: a.path,
      metadata: a.metadata
    }))
  };
  return JSON.stringify(out, null, 2);
}
function formatInstallResultsAsJson(results, version) {
  const successful = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => r.skipped);
  const failed = results.filter((r) => !r.success);
  const out = {
    version,
    success: failed.length === 0,
    summary: {
      total: results.length,
      successful: successful.length,
      skipped: skipped.length,
      failed: failed.length
    },
    results: results.map((r) => ({
      asset: r.asset,
      kind: r.kind,
      agent: r.agent,
      success: r.success,
      skipped: r.skipped,
      reason: r.reason,
      path: r.path,
      error: r.error
    }))
  };
  return JSON.stringify(out, null, 2);
}
function formatAssetPreviewAsJson(asset, version) {
  const out = {
    version,
    asset: {
      kind: asset.kind,
      name: asset.name,
      description: asset.description,
      category: asset.category,
      path: asset.path,
      metadata: asset.metadata
    },
    agents: Object.entries(agents).map(
      ([type, cfg]) => ({
        type,
        displayName: cfg.displayName,
        projectPath: getKindDir(type, asset.kind, { global: false }),
        globalPath: getKindDir(type, asset.kind, { global: true })
      })
    )
  };
  return JSON.stringify(out, null, 2);
}
function formatError(error, version) {
  return JSON.stringify(
    {
      version,
      success: false,
      error: error instanceof Error ? error.message : error
    },
    null,
    2
  );
}

// src/ui/theme.ts
import chalk from "chalk";
var colors = {
  // Primary - the "vibe" color
  primary: chalk.hex("#7C3AED"),
  primaryBg: chalk.bgHex("#7C3AED"),
  primaryBold: chalk.hex("#7C3AED").bold,
  // Secondary - cyan accent
  secondary: chalk.hex("#06B6D4"),
  secondaryBg: chalk.bgHex("#06B6D4"),
  secondaryBold: chalk.hex("#06B6D4").bold,
  // Success - emerald
  success: chalk.hex("#10B981"),
  successBg: chalk.bgHex("#10B981"),
  successBold: chalk.hex("#10B981").bold,
  // Warning - amber
  warning: chalk.hex("#F59E0B"),
  warningBg: chalk.bgHex("#F59E0B"),
  warningBold: chalk.hex("#F59E0B").bold,
  // Error - red
  error: chalk.hex("#EF4444"),
  errorBg: chalk.bgHex("#EF4444"),
  errorBold: chalk.hex("#EF4444").bold,
  // Accent - pink
  accent: chalk.hex("#F472B6"),
  accentBg: chalk.bgHex("#F472B6"),
  accentBold: chalk.hex("#F472B6").bold,
  // Neutral colors
  dim: chalk.dim,
  muted: chalk.hex("#9CA3AF"),
  text: chalk.white,
  textBold: chalk.white.bold,
  // Gradient effect for special text
  gradient: (text) => {
    const gradientColors = ["#7C3AED", "#A855F7", "#EC4899", "#F472B6"];
    return text.split("").map((char, i) => chalk.hex(gradientColors[i % gradientColors.length])(char)).join("");
  }
};
var symbols = {
  check: "\u2713",
  cross: "\u2717",
  arrow: "\u2192",
  arrowRight: "\u25B6",
  arrowDown: "\u25BC",
  bullet: "\u2022",
  dot: "\xB7",
  radioOn: "\u25C9",
  radioOff: "\u25CB",
  boxEmpty: "\u2610",
  boxChecked: "\u2611",
  pointer: "\u276F",
  info: "\u2139",
  warning: "\u26A0",
  star: "\u2605",
  sparkle: "\u2728",
  lightning: "\u26A1",
  search: "\u{1F50D}",
  folder: "\u{1F4C1}",
  file: "\u{1F4C4}",
  package: "\u{1F4E6}"
};

// src/ui/components/header.ts
var BANNER = `
  \u2566  \u2566\u2566\u2554\u2557 \u2554\u2550\u2557
  \u255A\u2557\u2554\u255D\u2551\u2560\u2569\u2557\u2551\u2563
   \u255A\u255D \u2569\u255A\u2550\u255D\u255A\u2550\u255D
`;
function renderHeader(version, subtitle) {
  const coloredBanner = colors.gradient(BANNER);
  const versionTag = colors.muted(`v${version}`);
  const subLine = subtitle || "AI Mode Installer for Coding Agents";
  return `
${coloredBanner}  ${versionTag}

  ${colors.dim(subLine)}
`;
}

// src/ui/components/search.ts
import Fuse from "fuse.js";
var ModeSearch = class {
  fuse;
  modes;
  constructor(modes) {
    this.modes = modes;
    this.fuse = new Fuse(modes, {
      keys: [
        { name: "name", weight: 0.4 },
        { name: "description", weight: 0.3 },
        { name: "category", weight: 0.2 },
        { name: "metadata.tags", weight: 0.1 }
      ],
      includeScore: true,
      includeMatches: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2
    });
  }
  search(query) {
    if (!query || query.trim().length === 0) {
      return this.modes.map((item) => ({
        item,
        score: 1
      }));
    }
    const results = this.fuse.search(query);
    return results.map((r) => ({
      item: r.item,
      score: r.score ?? 1,
      matches: r.matches
    }));
  }
  searchByCategory(query, category) {
    const results = this.search(query);
    return results.filter((r) => r.item.category === category);
  }
  getCategories() {
    const categories = /* @__PURE__ */ new Map();
    for (const mode of this.modes) {
      const count = categories.get(mode.category) || 0;
      categories.set(mode.category, count + 1);
    }
    return categories;
  }
};

// src/ui/components/preview.ts
import boxen from "boxen";
function renderInstallResultCard(results) {
  const labelOf = (r) => r.asset ?? r.mode ?? "(unknown)";
  const successful = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => !!r.skipped);
  const failed = results.filter((r) => !r.success);
  const lines = [];
  if (successful.length > 0) {
    lines.push(
      colors.successBold(
        `${symbols.check} Installed ${successful.length} item${successful.length === 1 ? "" : "s"}:`
      )
    );
    for (const r of successful.slice(0, 10)) {
      const tag = r.kind ? colors.muted(`[${r.kind}]`) + " " : "";
      lines.push(
        `  ${colors.success(symbols.bullet)} ${tag}${labelOf(r)} ${colors.dim("\u2192")} ${r.agent}`
      );
    }
    if (successful.length > 10) {
      lines.push(colors.dim(`  ... and ${successful.length - 10} more`));
    }
  }
  if (skipped.length > 0) {
    if (successful.length > 0) lines.push("");
    lines.push(
      colors.warningBold(`${symbols.warning} Skipped ${skipped.length}:`)
    );
    for (const r of skipped.slice(0, 5)) {
      lines.push(
        `  ${colors.warning(symbols.bullet)} ${labelOf(r)} ${colors.dim("\u2192")} ${r.agent} ${r.reason ? colors.dim(`(${r.reason})`) : ""}`
      );
    }
    if (skipped.length > 5) {
      lines.push(colors.dim(`  ... and ${skipped.length - 5} more`));
    }
  }
  if (failed.length > 0) {
    if (successful.length > 0 || skipped.length > 0) lines.push("");
    lines.push(
      colors.errorBold(`${symbols.cross} Failed ${failed.length}:`)
    );
    for (const r of failed) {
      lines.push(
        `  ${colors.error(symbols.bullet)} ${labelOf(r)} ${colors.dim("\u2192")} ${r.agent}`
      );
      if (r.error) lines.push(`    ${colors.dim(r.error)}`);
    }
  }
  return boxen(lines.join("\n"), {
    padding: 1,
    borderStyle: "round",
    borderColor: failed.length > 0 ? "#EF4444" : "#10B981",
    title: "Installation Results",
    titleAlignment: "center"
  });
}

// src/ui/components/progress.ts
function renderProgressBar(options) {
  const { total, current, width = 30, showPercentage = true, showCount = true, label } = options;
  const percentage = total > 0 ? Math.round(current / total * 100) : 0;
  const filled = Math.round(current / total * width);
  const empty = width - filled;
  const filledBar = colors.primary("\u2588".repeat(filled));
  const emptyBar = colors.dim("\u2591".repeat(empty));
  const bar = `[${filledBar}${emptyBar}]`;
  const parts = [bar];
  if (showPercentage) {
    parts.push(colors.secondary(`${percentage}%`));
  }
  if (showCount) {
    parts.push(colors.muted(`(${current}/${total})`));
  }
  if (label) {
    parts.push(colors.dim(label));
  }
  return parts.join(" ");
}

// src/index.ts
var VERSION = "2.0.0";
function defaultSource() {
  const here = dirname2(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "..");
  if (existsSync2(resolve(repoRoot, "skills")) || existsSync2(resolve(repoRoot, "modes"))) {
    return repoRoot;
  }
  return process.cwd();
}
program.name("vibe").description(
  "Install Vibe AI-agent assets (skills/agents/commands/modes) onto coding-agent CLIs."
).version(VERSION).argument("[source]", "Path to Vibe repo root (default: bundled or ./)", "").option(
  "-g, --global",
  "Install globally (user-level) instead of per-project"
).option(
  "-a, --agent <agents...>",
  "Target CLIs: opencode | claude-code | codex | cursor | gemini-cli | copilot-cli | factory-droid"
).option(
  "-s, --asset <names...>",
  "Specific asset names to install (skips picker)"
).option(
  "-k, --kind <kinds...>",
  "Filter by kind: skill | agent | command | mode"
).option("-c, --category <category>", "Filter by category").option("-l, --list", "List available assets without installing").option("-y, --yes", "Skip confirmation prompts (auto-accept)").option("--json", "JSON output for scripting/CI").option("--preview <name>", "Preview a single asset and exit").action(async (source, options) => {
  await main(source || defaultSource(), options);
});
program.command("add <names...>").description("Install one or more named assets").option("-g, --global", "Install globally").option("-a, --agent <agents...>", "Target CLIs").option("-y, --yes", "Auto-confirm").option("--json", "JSON output").action(async (names, opts) => {
  await main(defaultSource(), { ...opts, asset: names, yes: true });
});
program.command("list").description("List bundled assets").option("-k, --kind <kinds...>", "Filter by kind").option("-c, --category <category>", "Filter by category").option("--json", "JSON output").action(async (opts) => {
  await main(defaultSource(), { ...opts, list: true });
});
program.command("info <name>").description("Show a rich preview of one asset").option("--json", "JSON output").action(async (name, opts) => {
  opts.json = opts.json ?? program.opts().json;
  const root = defaultSource();
  const items = await discoverAssets(root);
  const search = new ModeSearch(items);
  const direct = items.find(
    (a) => a.name.toLowerCase() === name.toLowerCase()
  );
  let asset = direct;
  if (!asset) {
    const results = search.search(name);
    asset = results[0]?.item;
  }
  if (!asset) {
    const msg = `Asset not found: ${name}`;
    if (opts.json) console.log(formatError(msg, VERSION));
    else console.error(colors.error(msg));
    process.exit(1);
  }
  if (opts.json) {
    console.log(formatAssetPreviewAsJson(asset, VERSION));
    return;
  }
  printAssetPreview(asset);
});
program.command("doctor").description("Detect target CLIs and verify the local environment").option("--json", "JSON output").action(async (opts) => {
  opts.json = opts.json ?? program.opts().json;
  await runDoctor(opts);
});
program.command("search <query>").description("Fuzzy-search the asset library").option("-k, --kind <kinds...>", "Filter by kind").option("-n, --limit <n>", "Max results (default 20)", "20").option("--json", "JSON output").action(
  async (query, opts) => {
    opts.json = opts.json ?? program.opts().json;
    const root = defaultSource();
    const items = await discoverAssets(root, {
      kinds: parseKinds(opts.kind)
    });
    const search = new ModeSearch(items);
    const limit = Math.max(1, Math.min(200, Number(opts.limit) || 20));
    const results = search.search(query).slice(0, limit);
    if (opts.json) {
      console.log(formatAssetsAsJson(results.map((r) => r.item), VERSION));
      return;
    }
    console.log();
    console.log(colors.primaryBold(`Search: ${chalk2.italic(query)}`));
    console.log();
    for (const r of results) {
      const a = r.item;
      console.log(
        `${colors.muted(`[${a.kind}]`)} ${colors.secondaryBold(a.name)} ${colors.dim("\xB7")} ${colors.muted(a.category)}`
      );
      console.log(
        `  ${colors.dim(a.description.length > 100 ? a.description.slice(0, 100) + "..." : a.description)}`
      );
    }
    if (results.length === 0) console.log(colors.muted("No matches."));
    console.log();
  }
);
program.command("targets").description("List the 7 supported target CLIs and their detection status").option("--json", "JSON output").action(async (opts) => {
  opts.json = opts.json ?? program.opts().json;
  const detected = await detectInstalledAgents();
  const detectedSet = new Set(detected);
  const rows = ALL_AGENT_TYPES.map((t) => ({
    type: t,
    displayName: agents[t].displayName,
    detected: detectedSet.has(t),
    projectPath: getKindDir(t, "skill", { global: false }),
    globalPath: getKindDir(t, "skill", { global: true })
  }));
  if (opts.json) {
    console.log(JSON.stringify({ version: VERSION, targets: rows }, null, 2));
    return;
  }
  console.log();
  console.log(colors.primaryBold("Supported targets"));
  console.log();
  for (const r of rows) {
    const mark = r.detected ? colors.success(symbols.check) : colors.dim(symbols.dot);
    console.log(
      `  ${mark} ${colors.secondaryBold(r.displayName.padEnd(22))} ${colors.muted(r.globalPath ?? "")}`
    );
  }
  console.log();
});
program.command("completions [shell]").description("Generate shell completion scripts").action((shell) => {
  const target = shell || detectShell();
  if (!target) {
    console.error(
      colors.error("Could not detect shell. Specify: bash, zsh, or fish")
    );
    process.exit(1);
  }
  if (!["bash", "zsh", "fish"].includes(target)) {
    console.error(
      colors.error(`Unsupported shell: ${target}. Supported: bash zsh fish`)
    );
    process.exit(1);
  }
  console.log(getCompletionScript(target));
  console.error("");
  console.error(colors.dim("# Installation instructions:"));
  console.error(colors.dim(getInstallInstructions(target)));
});
program.command("init").description("Create a .vibeconfig.yaml").action(async () => {
  try {
    const path = await initConfig();
    console.log(colors.success(`${symbols.check} Created config: ${path}`));
  } catch (error) {
    console.error(
      colors.error(error instanceof Error ? error.message : "Failed")
    );
    process.exit(1);
  }
});
program.parse();
function parseKinds(input) {
  if (!input || input.length === 0) return void 0;
  const valid = ["skill", "agent", "command", "mode"];
  return input.filter(
    (k) => valid.includes(k)
  );
}
async function main(source, options) {
  const config = await loadConfig();
  const merged = mergeConfigWithOptions(config, options);
  const json = options.json ?? false;
  if (!json) console.log(renderHeader(VERSION));
  const spinner2 = json ? null : p.spinner();
  spinner2?.start("Discovering assets\u2026");
  let assets = await discoverAssets(source, { kinds: parseKinds(options.kind) });
  if (options.category) {
    assets = assets.filter((a) => a.category === options.category);
  }
  if (assets.length === 0) {
    spinner2?.stop(chalk2.red("No assets found"));
    if (json)
      console.log(formatError("No assets found at the given source", VERSION));
    else
      p.outro(
        chalk2.red(
          "No assets found. Pass a path to a vibe checkout, or run from a clone."
        )
      );
    process.exit(1);
  }
  const counts = summariseCounts(assets);
  spinner2?.stop(
    `Found ${colors.success(String(assets.length))} item${assets.length === 1 ? "" : "s"} ${colors.muted(`(${counts.skill} skills \xB7 ${counts.agent} agents \xB7 ${counts.command} commands \xB7 ${counts.mode} modes)`)}`
  );
  if (options.preview) {
    const target = assets.find(
      (a) => a.name.toLowerCase() === options.preview.toLowerCase()
    );
    if (!target) {
      const msg = `Asset not found: ${options.preview}`;
      if (json) console.log(formatError(msg, VERSION));
      else p.log.error(msg);
      process.exit(1);
    }
    if (json) console.log(formatAssetPreviewAsJson(target, VERSION));
    else printAssetPreview(target);
    process.exit(0);
  }
  if (options.list) {
    if (json) {
      console.log(formatAssetsAsJson(assets, VERSION));
    } else {
      printGroupedList(assets);
    }
    process.exit(0);
  }
  let selected;
  if (options.asset && options.asset.length > 0) {
    const search = new ModeSearch(assets);
    const matched = [];
    for (const name of options.asset) {
      const exact = assets.find(
        (a) => a.name.toLowerCase() === name.toLowerCase()
      );
      if (exact) {
        matched.push(exact);
        continue;
      }
      const results2 = search.search(name);
      if (results2.length > 0 && (results2[0].score ?? 1) < 0.3) {
        matched.push(results2[0].item);
      }
    }
    if (matched.length === 0) {
      const msg = `No matching assets for: ${options.asset.join(", ")}`;
      if (json) console.log(formatError(msg, VERSION));
      else p.log.error(msg);
      process.exit(1);
    }
    selected = matched;
    if (!json) {
      p.log.info(
        `Selected ${matched.length}: ${matched.map((a) => colors.secondary(a.name)).join(", ")}`
      );
    }
  } else if (options.yes) {
    selected = assets;
    if (!json) p.log.info(`Installing all ${assets.length} items`);
  } else {
    const choices = assets.map((a) => ({
      value: a,
      label: `[${a.kind}] ${a.name}`,
      hint: a.description.length > 60 ? a.description.slice(0, 57) + "\u2026" : a.description
    }));
    const picked = await p.multiselect({
      message: "Pick what to install",
      options: choices,
      required: true
    });
    if (p.isCancel(picked)) {
      p.cancel("Cancelled");
      process.exit(0);
    }
    selected = picked;
  }
  let targets;
  if (merged.agent && merged.agent.length > 0) {
    const valid = ALL_AGENT_TYPES;
    const invalid = merged.agent.filter(
      (a) => !valid.includes(a)
    );
    if (invalid.length > 0) {
      const msg = `Invalid agents: ${invalid.join(", ")}. Valid: ${valid.join(", ")}`;
      if (json) console.log(formatError(msg, VERSION));
      else p.log.error(msg);
      process.exit(1);
    }
    targets = merged.agent;
  } else {
    spinner2?.start("Detecting installed agents\u2026");
    const detected = await detectInstalledAgents();
    spinner2?.stop(
      `Detected ${detected.length} agent${detected.length === 1 ? "" : "s"}`
    );
    if (detected.length === 0 && options.yes) {
      targets = ALL_AGENT_TYPES;
    } else if (detected.length === 0) {
      const allChoices = ALL_AGENT_TYPES.map((t) => ({
        value: t,
        label: agents[t].displayName
      }));
      const picked = await p.multiselect({
        message: "No agents detected \u2014 pick targets",
        options: allChoices,
        required: true
      });
      if (p.isCancel(picked)) {
        p.cancel("Cancelled");
        process.exit(0);
      }
      targets = picked;
    } else if (options.yes || detected.length === 1) {
      targets = detected;
      if (!json) {
        p.log.info(
          `Targets: ${targets.map((t) => colors.secondary(agents[t].displayName)).join(", ")}`
        );
      }
    } else {
      const choices = detected.map((t) => ({
        value: t,
        label: agents[t].displayName
      }));
      const picked = await p.multiselect({
        message: "Pick target CLIs",
        options: choices,
        required: true,
        initialValues: detected
      });
      if (p.isCancel(picked)) {
        p.cancel("Cancelled");
        process.exit(0);
      }
      targets = picked;
    }
  }
  let installGlobally = merged.global ?? false;
  if (merged.global === void 0 && !options.yes && !json) {
    const scope = await p.select({
      message: "Install scope",
      options: [
        { value: false, label: "Project", hint: "current dir, committed with project" },
        { value: true, label: "Global", hint: "user-level, all projects" }
      ]
    });
    if (p.isCancel(scope)) {
      p.cancel("Cancelled");
      process.exit(0);
    }
    installGlobally = scope;
  }
  if (!json) {
    console.log();
    p.log.step(colors.primaryBold("Installation plan"));
    for (const a of selected) {
      p.log.message(`  ${colors.muted(`[${a.kind}]`)} ${colors.secondary(a.name)}`);
      for (const t of targets) {
        const target = getInstallTarget(a, t, { global: installGlobally });
        if (target === null) {
          p.log.message(
            `    ${colors.dim(symbols.arrow)} ${agents[t].displayName} ${colors.dim("(unsupported \u2014 will skip)")}`
          );
        } else {
          const exists = await isAssetInstalled(a, t, {
            global: installGlobally
          });
          const tag = exists ? colors.warning(" (overwrite)") : "";
          p.log.message(
            `    ${colors.dim(symbols.arrow)} ${agents[t].displayName}: ${colors.dim(target)}${tag}`
          );
        }
      }
    }
    console.log();
  }
  if (!options.yes && !json) {
    const ok = await p.confirm({ message: "Proceed?" });
    if (p.isCancel(ok) || !ok) {
      p.cancel("Cancelled");
      process.exit(0);
    }
  }
  const tasks = buildTasks(selected, targets);
  const concurrency = getConfigParallelism(config);
  if (!json) spinner2?.start("Installing\u2026");
  let lastDone = 0;
  const start = Date.now();
  const results = await installParallel(
    tasks,
    { global: installGlobally, concurrency },
    json ? void 0 : (progress) => {
      if (progress.completed > lastDone) {
        lastDone = progress.completed;
        const bar = renderProgressBar({
          total: progress.total,
          current: progress.completed,
          width: 25
        });
        spinner2?.message(
          `${bar} ${progress.current ? colors.dim(`${progress.current.asset.kind}/${progress.current.asset.name}`) : ""}`
        );
      }
    }
  );
  const ms = Date.now() - start;
  if (!json) spinner2?.stop("Installation complete");
  const failed = results.filter((r) => !r.success);
  if (json) {
    console.log(formatInstallResultsAsJson(results, VERSION));
  } else {
    console.log();
    console.log(renderInstallResultCard(results));
    console.log();
    console.log(colors.dim(`Completed in ${(ms / 1e3).toFixed(1)}s`));
    console.log();
    p.outro(
      failed.length === 0 ? colors.success("Done!") : colors.warning("Completed with errors")
    );
  }
  process.exit(failed.length > 0 ? 1 : 0);
}
function printGroupedList(assets) {
  console.log();
  p.log.step(colors.primaryBold(`Available (${assets.length})`));
  const byKind = /* @__PURE__ */ new Map();
  for (const a of assets) {
    const list = byKind.get(a.kind) ?? [];
    list.push(a);
    byKind.set(a.kind, list);
  }
  for (const [kind, items] of byKind) {
    console.log();
    console.log(colors.secondaryBold(`${kind} (${items.length})`));
    for (const a of items.slice(0, 8)) {
      console.log(
        `  ${colors.success(symbols.bullet)} ${colors.textBold(a.name)} ${colors.muted(`\xB7 ${a.category}`)}`
      );
      console.log(
        `    ${colors.dim(a.description.length > 80 ? a.description.slice(0, 80) + "\u2026" : a.description)}`
      );
    }
    if (items.length > 8)
      console.log(colors.dim(`  \u2026and ${items.length - 8} more`));
  }
  console.log();
  p.outro(
    `Use ${colors.secondary("vibe add <name>")} to install or ${colors.secondary("vibe info <name>")} to preview.`
  );
}
function printAssetPreview(asset) {
  console.log();
  console.log(
    `${colors.muted(`[${asset.kind}]`)} ${colors.primaryBold(asset.name)}`
  );
  console.log(colors.muted(`category: ${asset.category}`));
  console.log();
  console.log(asset.description);
  console.log();
  console.log(colors.muted("Targets:"));
  for (const t of ALL_AGENT_TYPES) {
    const dest = getInstallTarget(asset, t, { global: true });
    const tag = dest === null ? colors.dim("(not supported)") : colors.dim(dest);
    console.log(`  ${colors.secondary(agents[t].displayName.padEnd(22))} ${tag}`);
  }
  console.log();
  console.log(colors.muted(`source: ${asset.path}`));
  console.log();
}
async function runDoctor(opts) {
  const root = defaultSource();
  const detected = await detectInstalledAgents();
  const detectedSet = new Set(detected);
  const assetCount = (await discoverAssets(root)).length;
  const targets = ALL_AGENT_TYPES.map((t) => ({
    type: t,
    displayName: agents[t].displayName,
    detected: detectedSet.has(t),
    skillsDir: getKindDir(t, "skill", { global: true })
  }));
  const node = process.versions.node;
  const ok = {
    nodeOk: parseInt(node.split(".")[0], 10) >= 18,
    sourceOk: assetCount > 0,
    anyTarget: detected.length > 0
  };
  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          version: VERSION,
          node,
          source: root,
          assetCount,
          targets,
          ok
        },
        null,
        2
      )
    );
    return;
  }
  console.log();
  console.log(colors.primaryBold("vibe doctor"));
  console.log();
  console.log(`  ${colors.muted("vibe version".padEnd(18))} ${VERSION}`);
  console.log(
    `  ${colors.muted("node".padEnd(18))} ${ok.nodeOk ? colors.success(node) : colors.error(node + "  (need \u226518)")}`
  );
  console.log(
    `  ${colors.muted("source".padEnd(18))} ${ok.sourceOk ? colors.success(root) : colors.error(root + "  (no assets!)")}`
  );
  console.log(
    `  ${colors.muted("assets".padEnd(18))} ${colors.success(String(assetCount))}`
  );
  console.log();
  console.log(colors.primaryBold("Targets"));
  for (const t of targets) {
    const mark = t.detected ? colors.success(symbols.check) : colors.dim(symbols.dot);
    console.log(
      `  ${mark} ${colors.secondary(t.displayName.padEnd(22))} ${colors.muted(t.skillsDir ?? "")}`
    );
  }
  console.log();
  if (!ok.anyTarget) {
    console.log(
      colors.warning(
        `${symbols.warning} No agent CLIs detected. Vibe will still install if you use ${colors.secondary("--agent <name>")}.`
      )
    );
  }
  console.log();
}
