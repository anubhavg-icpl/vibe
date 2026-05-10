#!/usr/bin/env node

// src/index.ts
import { program } from "commander";
import * as p from "@clack/prompts";
import chalk3 from "chalk";
import { existsSync as existsSync3, rmSync, statSync } from "fs";
import { dirname as dirname2, resolve, join as join5 } from "path";
import { fileURLToPath } from "url";
import { stat as statAsync } from "fs/promises";

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
  const kindOrder = ["skill", "agent", "command", "mode"];
  const tasks = [];
  const taskKinds = [];
  if (wanted.has("skill")) {
    tasks.push(discoverSkills(root));
    taskKinds.push("skill");
  }
  if (wanted.has("agent")) {
    tasks.push(discoverFlat(root, "agents", "agent"));
    taskKinds.push("agent");
  }
  if (wanted.has("command")) {
    tasks.push(discoverFlat(root, "commands", "command"));
    taskKinds.push("command");
  }
  if (wanted.has("mode")) {
    tasks.push(discoverModesAsset(root));
    taskKinds.push("mode");
  }
  const buckets = [];
  for (let i = 0; i < tasks.length; i++) {
    const result = await tasks[i];
    buckets.push(result);
    options.onKindFound?.(taskKinds[i], result.length);
  }
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
import { mkdir, cp, access, readFile as readFile2, writeFile, readdir as readdir2, rm } from "fs/promises";
import { existsSync as existsSync2 } from "fs";
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
      if (existsSync2(dest)) {
        await rm(dest, { recursive: true, force: true });
      }
      await mkdir(dest, { recursive: true });
      await cp(asset.path, dest, { recursive: true });
      return { success: true, path: dest };
    }
    if (asset.kind === "agent" || asset.kind === "command") {
      await mkdir(destBase, { recursive: true });
      const ext = agentType === "copilot-cli" && asset.kind === "agent" ? ".agent.md" : ".md";
      const dest = join3(destBase, `${asset.name}${ext}`);
      if (existsSync2(dest)) {
        await rm(dest, { force: true });
      }
      await cp(asset.path, dest);
      return { success: true, path: dest };
    }
    if (asset.kind === "mode") {
      const dest = join3(destBase, asset.name);
      if (existsSync2(dest)) {
        await rm(dest, { recursive: true, force: true });
      }
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
async function rollbackInstalledPaths(results) {
  const removed = [];
  const failed = [];
  const successPaths = results.filter((r) => r.success && !r.skipped && r.path).map((r) => r.path);
  for (const path of successPaths) {
    try {
      if (existsSync2(path)) {
        await rm(path, { recursive: true, force: true });
        removed.push(path);
      }
    } catch {
      failed.push(path);
    }
  }
  return { removed, failed };
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
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(
      `[vibe] Warning: Failed to parse config at ${configPath}: ${msg}. Using defaults.`
    );
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
    local cur prev opts agents kinds categories
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    # Main options
    opts="-h --help -v --version -g --global -a --agent -s --asset -k --kind -c --category -l --list -y --yes --json --preview --no-animation --dry-run"

    # All 7 supported target CLIs
    agents="opencode claude-code codex cursor gemini-cli copilot-cli factory-droid"

    # Asset kinds
    kinds="skill agent command mode"

    # Common categories
    categories="development languages testing documentation security devops ai-ml web mobile general"

    case "\${prev}" in
        -a|--agent)
            COMPREPLY=( $(compgen -W "\${agents}" -- \${cur}) )
            return 0
            ;;
        -k|--kind)
            COMPREPLY=( $(compgen -W "\${kinds}" -- \${cur}) )
            return 0
            ;;
        -c|--category)
            COMPREPLY=( $(compgen -W "\${categories}" -- \${cur}) )
            return 0
            ;;
        -s|--asset|--preview)
            # Asset names would ideally be loaded dynamically
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

    # Subcommands
    local words="\${COMP_WORDS[@]}"
    if [[ ! " \${words} " =~ " (add|list|info|doctor|search|targets|completions|init|uninstall|update) " ]]; then
        COMPREPLY=( $(compgen -W "add list info doctor search targets completions init uninstall update" -- \${cur}) )
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
        '-a[Specify target CLIs]:agent:(opencode claude-code codex cursor gemini-cli copilot-cli factory-droid)'
        '--agent[Specify target CLIs]:agent:(opencode claude-code codex cursor gemini-cli copilot-cli factory-droid)'
        '-s[Specify asset names]:asset:'
        '--asset[Specify asset names]:asset:'
        '-k[Filter by kind]:kind:(skill agent command mode)'
        '--kind[Filter by kind]:kind:(skill agent command mode)'
        '-c[Filter by category]:category:(development languages testing documentation security devops ai-ml web mobile general)'
        '--category[Filter by category]:category:(development languages testing documentation security devops ai-ml web mobile general)'
        '-l[List available assets]'
        '--list[List available assets]'
        '-y[Skip confirmations]'
        '--yes[Skip confirmations]'
        '--json[Output in JSON format]'
        '--preview[Preview an asset]:asset:'
        '--no-animation[Skip startup animation]'
        '--dry-run[Show what would be installed without installing]'
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
complete -c vibe -s l -l list -d "List available assets"
complete -c vibe -l json -d "Output in JSON format"
complete -c vibe -l no-animation -d "Skip startup animation"
complete -c vibe -l dry-run -d "Show what would be installed without installing"

# Agent option \u2014 all 7 supported target CLIs
complete -c vibe -s a -l agent -d "Specify target CLI" -xa "opencode claude-code codex cursor gemini-cli copilot-cli factory-droid"

# Asset kind option
complete -c vibe -s k -l kind -d "Filter by asset kind" -xa "skill agent command mode"

# Category option
complete -c vibe -s c -l category -d "Filter by category" -xa "development languages testing documentation security devops ai-ml web mobile general"

# Asset option (no completions, dynamic)
complete -c vibe -s s -l asset -d "Specify asset name"

# Preview option
complete -c vibe -l preview -d "Preview an asset"

# Subcommands
complete -c vibe -n "not __fish_seen_subcommand_from add list info doctor search targets completions init uninstall update" -a "add list info doctor search targets completions init uninstall update"

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
  // ── Primary ─ warm amber ─────────────────────────────────────────────────
  primary: chalk.hex("#C8762A"),
  primaryBg: chalk.bgHex("#C8762A"),
  primaryBold: chalk.hex("#C8762A").bold,
  // ── Secondary ─ soft purple (chart-2) ────────────────────────────────────
  secondary: chalk.hex("#8855CC"),
  secondaryBg: chalk.bgHex("#8855CC"),
  secondaryBold: chalk.hex("#8855CC").bold,
  // ── Success ─ complementary sage green ───────────────────────────────────
  success: chalk.hex("#4BAF78"),
  successBg: chalk.bgHex("#4BAF78"),
  successBold: chalk.hex("#4BAF78").bold,
  // ── Warning ─ deep amber (chart-1) ───────────────────────────────────────
  warning: chalk.hex("#A0601C"),
  warningBg: chalk.bgHex("#A0601C"),
  warningBold: chalk.hex("#A0601C").bold,
  // ── Error ─ red-orange (--destructive dark) ───────────────────────────────
  error: chalk.hex("#DC4B32"),
  errorBg: chalk.bgHex("#DC4B32"),
  errorBold: chalk.hex("#DC4B32").bold,
  // ── Accent ─ bright warm gold ─────────────────────────────────────────────
  accent: chalk.hex("#E09840"),
  accentBg: chalk.bgHex("#E09840"),
  accentBold: chalk.hex("#E09840").bold,
  // ── Neutral ──────────────────────────────────────────────────────────────
  dim: chalk.dim,
  muted: chalk.hex("#8A8270"),
  // --muted-foreground warm gray
  text: chalk.hex("#F0EDE8"),
  // near-white warm
  textBold: chalk.hex("#F0EDE8").bold,
  // ── Amber shimmer gradient ────────────────────────────────────────────────
  gradient: (text2) => {
    const gc = ["#C8762A", "#D4882E", "#E09A32", "#E8AA48", "#D4882E", "#C8762A"];
    return text2.split("").map((ch, i) => chalk.hex(gc[i % gc.length])(ch)).join("");
  }
};
var kindColors = {
  skill: chalk.hex("#C8762A").bold,
  // primary amber
  agent: chalk.hex("#8855CC").bold,
  // chart-2 purple
  command: chalk.hex("#4BAF78").bold,
  // complementary green
  mode: chalk.hex("#4888D0").bold
  // soft blue
};
var kindBadge = {
  skill: chalk.bgHex("#3A2008").hex("#E09840"),
  agent: chalk.bgHex("#1E0D3A").hex("#AA80E8"),
  command: chalk.bgHex("#0A2818").hex("#6ACA94"),
  mode: chalk.bgHex("#0A1C3A").hex("#70A8E8")
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
  sparkle: "\u2726",
  lightning: "\u26A1",
  search: "\u2315",
  folder: "\u229E",
  file: "\u229F",
  package: "\u25C8",
  pipe: "\u2502",
  tee: "\u251C",
  corner: "\u2514"
};
var box = {
  topLeft: "\u256D",
  topRight: "\u256E",
  bottomLeft: "\u2570",
  bottomRight: "\u256F",
  horizontal: "\u2500",
  vertical: "\u2502",
  // Heavy lines used for section headers
  heavyH: "\u2501",
  // Double lines for special panels
  doubleH: "\u2550",
  doubleTopLeft: "\u2554",
  doubleTopRight: "\u2557",
  doubleBottomLeft: "\u255A",
  doubleBottomRight: "\u255D",
  doubleV: "\u2551"
};
var SARCASTIC_QUOTES = [
  // Hinglish quotes
  "776 repos banaye, 39 followers mile \u2014 matlab 20 repos per follower! Fan base thoda badhao bhai.",
  "GitHub bio mein khud likha 'Code detective in a clown suit' \u2014 self-roast game toh ekdum solid hai!",
  "CEO bhi, Security Engineer bhi, DevSecOps bhi, Fish Farmer bhi \u2014 ek banda, chaar lives!",
  "500+ blog articles likhe lekin top repo mein sirf 20 stars \u2014 readers padhte hain, star nahi dete?",
  "B.Tech 2025 tak chal rahi hai aur saath mein company ka CEO bhi \u2014 padhai bhi, startup bhi, machli bhi!",
  "YOLO badge mila GitHub se \u2014 bina review merge kiya, security researcher hoke yahi karta hai kya?",
  "Ahmedabad mein rehta hai ya Vadodara mein? Dono profiles pe alag city \u2014 GPS ne bhi haath khade kar diye.",
  "Company ka naam rakha TechAnv \u2014 yaani 'Tech' + 'Anv(hubhav)' \u2014 apna naam hi brand bana liya, respect!",
  "222+ research citations hain lekin GitHub pe 39 followers \u2014 academics ne padha, developers ne ignore kiya.",
  "Virtual internships JPMorgan aur PwC mein karke LinkedIn pe daal diya \u2014 simulation is the new experience!",
  // English quotes
  "You have 776 repos and 39 followers \u2014 that's 20 repos per fan. Maybe write less, ship more?",
  "Wrote 500+ blog posts but your top repo has 20 stars. The readers came\u2026 the stars didn't.",
  "CEO, Security Engineer, DevSecOps, Fish Farmer \u2014 one person, four job titles. Overachiever much?",
  "Your GitHub bio says 'Code detective in a clown suit' \u2014 the clown suit is doing the heavy lifting.",
  "222+ research citations but 39 GitHub followers. Academics cite you, developers ghost you.",
  "Virtual internships at JPMorgan and PwC on LinkedIn \u2014 playing career on easy mode.",
  "Named the company after yourself: Tech + Anv. Narcissism level: founder.",
  "YOLO badge on GitHub \u2014 because real security researchers don't need code review, right?",
  "Two cities on two profiles \u2014 even your GPS is confused about where you live.",
  "B.Tech student AND CEO simultaneously \u2014 either you're a genius or education is too easy."
];
function randomSarcasticQuote() {
  return SARCASTIC_QUOTES[Math.floor(Math.random() * SARCASTIC_QUOTES.length)];
}

// src/ui/components/header.ts
var BANNER = `
 \u2584\u2580\u2580\u2584 \u2584\u2580\u2580\u2584  \u2584\u2580\u2580\u2588\u2580\u2584    \u2584\u2580\u2580\u2588\u2584\u2584   \u2584\u2580\u2580\u2588\u2584\u2584\u2584\u2584     
\u2588   \u2588    \u2588 \u2588   \u2588  \u2588  \u2590 \u2584\u2580   \u2588 \u2590  \u2584\u2580   \u2590     
\u2590  \u2588    \u2588  \u2590   \u2588  \u2590    \u2588\u2584\u2584\u2584\u2580    \u2588\u2584\u2584\u2584\u2584\u2584      
   \u2588   \u2584\u2580      \u2588       \u2588   \u2588    \u2588    \u258C      
    \u2580\u2584\u2580     \u2584\u2580\u2580\u2580\u2580\u2580\u2584   \u2584\u2580\u2584\u2584\u2584\u2580   \u2584\u2580\u2584\u2584\u2584\u2584       
           \u2588       \u2588 \u2588    \u2590    \u2588    \u2590       
           \u2590       \u2590 \u2590         \u2590`;
var WIDTH = 52;
var CAT_W = 8;
var TEXT_W = WIDTH - CAT_W - 2;
var CAT_DONE = [" /\\_/\\ ", "( ^.^ )", " > ^ < ", "  \\|/  ", "(___)  "];
var CAT_ROWS = 5;
function wrapWords(text2, maxW) {
  const words = text2.split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (cur && cur.length + 1 + w.length > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}
function renderHeader(version, subtitle) {
  const logo = colors.gradient(BANNER);
  const ver = colors.muted(`v${version}`);
  const sub = subtitle ?? "AI Agent Asset Manager";
  const divider = colors.primary(box.heavyH.repeat(WIDTH));
  const wrapped = wrapWords(randomSarcasticQuote(), TEXT_W);
  const rows = Math.max(CAT_ROWS, wrapped.length);
  const block = Array.from(
    { length: rows },
    (_, i) => "  " + colors.primary(CAT_DONE[i] ?? " ".repeat(CAT_W)) + " " + colors.dim(wrapped[i] ?? "")
  ).join("\n");
  return `
${logo}  ${ver}

  ${colors.dim(sub)}
${divider}
${block}
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
      colors.successBold(`${symbols.check} Installed ${successful.length} item${successful.length === 1 ? "" : "s"}:`)
    );
    for (const r of successful.slice(0, 10)) {
      const kindTag = r.kind ? kindColors[r.kind]?.(`[${r.kind}] `) ?? colors.muted(`[${r.kind}] `) : "";
      lines.push(
        `  ${colors.success(symbols.bullet)} ${kindTag}${labelOf(r)} ${colors.dim("\u2192")} ${r.agent}`
      );
    }
    if (successful.length > 10) lines.push(colors.dim(`  \u2026 and ${successful.length - 10} more`));
  }
  if (skipped.length > 0) {
    if (successful.length > 0) lines.push("");
    lines.push(colors.warningBold(`${symbols.warning} Skipped ${skipped.length}:`));
    for (const r of skipped.slice(0, 5)) {
      lines.push(
        `  ${colors.warning(symbols.bullet)} ${labelOf(r)} ${colors.dim("\u2192")} ${r.agent}` + (r.reason ? ` ${colors.dim(`(${r.reason})`)}` : "")
      );
    }
    if (skipped.length > 5) lines.push(colors.dim(`  \u2026 and ${skipped.length - 5} more`));
  }
  if (failed.length > 0) {
    if (successful.length > 0 || skipped.length > 0) lines.push("");
    lines.push(colors.errorBold(`${symbols.cross} Failed ${failed.length}:`));
    for (const r of failed) {
      lines.push(`  ${colors.error(symbols.bullet)} ${labelOf(r)} ${colors.dim("\u2192")} ${r.agent}`);
      if (r.error) lines.push(`    ${colors.dim(r.error)}`);
    }
  }
  return boxen(lines.join("\n"), {
    padding: 1,
    borderStyle: "round",
    borderColor: failed.length > 0 ? "#DC4B32" : "#4BAF78",
    title: "Installation Results",
    titleAlignment: "center"
  });
}

// src/ui/components/progress.ts
function renderProgressBar(options) {
  const { total, current, width = 30, showPercentage = true, showCount = true, label } = options;
  const percentage = total > 0 ? Math.round(current / total * 100) : 0;
  const filled = total > 0 ? Math.round(current / total * width) : 0;
  const empty = width - filled;
  const filledBar = colors.primary("\u25B0".repeat(filled));
  const emptyBar = colors.dim("\u25B1".repeat(empty));
  const bar = `${filledBar}${emptyBar}`;
  const parts = [bar];
  if (showPercentage) parts.push(colors.accent(`${percentage}%`));
  if (showCount) parts.push(colors.muted(`(${current}/${total})`));
  if (label) parts.push(colors.dim(label));
  return parts.join("  ");
}

// src/ui/components/startup.ts
import chalk2 from "chalk";
var LOGO = [
  " \u2584\u2580\u2580\u2584 \u2584\u2580\u2580\u2584  \u2584\u2580\u2580\u2588\u2580\u2584    \u2584\u2580\u2580\u2588\u2584\u2584   \u2584\u2580\u2580\u2588\u2584\u2584\u2584\u2584     ",
  "\u2588   \u2588    \u2588 \u2588   \u2588  \u2588  \u2590 \u2584\u2580   \u2588 \u2590  \u2584\u2580   \u2590     ",
  "\u2590  \u2588    \u2588  \u2590   \u2588  \u2590    \u2588\u2584\u2584\u2584\u2580    \u2588\u2584\u2584\u2584\u2584\u2584      ",
  "   \u2588   \u2584\u2580      \u2588       \u2588   \u2588    \u2588    \u258C      ",
  "    \u2580\u2584\u2580     \u2584\u2580\u2580\u2580\u2580\u2580\u2584   \u2584\u2580\u2584\u2584\u2584\u2580   \u2584\u2580\u2584\u2584\u2584\u2584       ",
  "           \u2588       \u2588 \u2588    \u2590    \u2588    \u2590       ",
  "           \u2590       \u2590 \u2590         \u2590           "
];
var LOGO_W = LOGO.reduce((m, l) => Math.max(m, l.length), 0);
var INNER_W = LOGO_W + 4;
var C_INNER = 46;
var C_BOX_W = C_INNER + 4;

// src/index.ts
var VERSION = "2.0.0";
function defaultSource() {
  const here = dirname2(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "..");
  if (existsSync3(resolve(repoRoot, "skills")) || existsSync3(resolve(repoRoot, "modes"))) {
    return repoRoot;
  }
  return process.cwd();
}
var EXAMPLES = `
Examples:
  vibe                           Interactive install with animation
  vibe add tony-stark-mode       Install a specific asset
  vibe add <a> <b> --yes --json Install multiple, non-interactive
  vibe list                      Show all available assets
  vibe list --installed          Show what's already installed
  vibe list -k skill -c devops   List skills in the devops category
  vibe info tony-stark-mode      Preview an asset before installing
  vibe search "react"            Fuzzy-search the asset library
  vibe uninstall tony-stark      Remove an installed asset
  vibe update                    Re-install all (latest versions)
  vibe update tony-stark         Re-install a specific asset
  vibe add <name> --dry-run      Preview what would be installed
  vibe doctor                    Check environment and detected CLIs
  vibe targets                   Show supported target CLIs
  vibe completions zsh           Generate shell completions`;
program.name("vibe").description(
  "Install Vibe AI-agent assets (skills/agents/commands/modes) onto coding-agent CLIs." + EXAMPLES
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
).option("-c, --category <category>", "Filter by category").option("-l, --list", "List available assets without installing").option("-y, --yes", "Skip confirmation prompts (auto-accept)").option("--json", "JSON output for scripting/CI").option("--preview <name>", "Preview a single asset and exit").option("--no-animation", "Skip startup animation (for slow terminals or scripts)").option("--dry-run", "Show what would be installed without actually installing").action(async (source, options) => {
  await main(source || defaultSource(), options);
});
program.command("add <names...>").description("Install one or more named assets").option("-g, --global", "Install globally").option("-a, --agent <agents...>", "Target CLIs").option("-y, --yes", "Auto-confirm").option("--json", "JSON output").option("--dry-run", "Preview what would be installed without installing").action(async (names, opts) => {
  await main(defaultSource(), { ...opts, asset: names, yes: true });
});
program.command("list").description("List bundled assets").option("-k, --kind <kinds...>", "Filter by kind").option("-c, --category <category>", "Filter by category").option("--installed", "Show only installed assets").option("--json", "JSON output").action(async (opts) => {
  if (opts.installed) {
    await runListInstalled(opts);
  } else {
    await main(defaultSource(), { ...opts, list: true });
  }
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
    const suggestions = search.search(name).slice(0, 5);
    const msg = `Asset not found: ${name}`;
    if (opts.json) {
      console.log(formatError(msg, VERSION));
    } else {
      console.error(colors.error(msg));
      if (suggestions.length > 0) {
        console.error(colors.muted("\nDid you mean one of these?"));
        for (const s of suggestions) {
          console.error(
            `  ${colors.secondary(s.item.name)} ${colors.dim(`(${s.item.kind} \xB7 ${s.item.category})`)}`
          );
        }
      }
      console.error(
        colors.dim(`
Use ${colors.secondary("vibe search <query>")} to search the full library.`)
      );
    }
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
      console.log(
        formatAssetsAsJson(
          results.map((r) => ({ ...r.item, _score: r.score })),
          VERSION
        )
      );
      return;
    }
    console.log();
    console.log(colors.primaryBold(`Search: ${chalk3.italic(query)}`));
    console.log(
      colors.dim(`${results.length} result${results.length === 1 ? "" : "s"} (sorted by relevance)`)
    );
    console.log();
    for (const r of results) {
      const a = r.item;
      const relevance = Math.round((1 - r.score) * 100);
      const relBar = colors.dim(`(${relevance}% match)`);
      console.log(
        `${colors.muted(`[${a.kind}]`)} ${colors.secondaryBold(a.name)} ${colors.dim("\xB7")} ${colors.muted(a.category)} ${relBar}`
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
program.command("uninstall <names...>").description("Remove installed assets from target CLIs").option("-g, --global", "Remove from global scope").option("-a, --agent <agents...>", "Target CLIs (default: auto-detect)").option("--json", "JSON output").option("-y, --yes", "Skip confirmation").action(async (names, opts) => {
  await runUninstall(names, opts);
});
program.command("update [names...]").description("Re-install assets to get the latest versions").option("-g, --global", "Install globally").option("-a, --agent <agents...>", "Target CLIs").option("-y, --yes", "Skip confirmation").option("--json", "JSON output").option("--dry-run", "Preview what would be updated").action(async (names, opts) => {
  await runUpdate(names, opts);
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
  const dryRun = options.dryRun ?? false;
  const isInteractive = !json && !options.list && !options.preview && !options.asset?.length && !options.yes && !options.noAnimation;
  if (!json) console.log(renderHeader(VERSION));
  const spinner2 = !json ? p.spinner() : null;
  spinner2?.start("Discovering assets\u2026");
  let assets = await discoverAssets(source, {
    kinds: parseKinds(options.kind),
    onKindFound: !json ? (kind, count) => {
      spinner2?.message(`Discovering assets\u2026 ${colors.dim(`${kind}: ${count}`)}`);
    } : void 0
  });
  if (options.category) {
    assets = assets.filter((a) => a.category === options.category);
  }
  if (assets.length === 0) {
    spinner2?.stop(chalk3.red("No assets found"));
    if (json)
      console.log(formatError("No assets found at the given source", VERSION));
    else
      p.outro(chalk3.red("No assets found. Pass a path to a vibe checkout, or run from a clone."));
    process.exit(1);
  }
  const counts = summariseCounts(assets);
  const countMsg = `Found ${colors.success(String(assets.length))} item${assets.length === 1 ? "" : "s"} ${colors.muted(`(${counts.skill} skills \xB7 ${counts.agent} agents \xB7 ${counts.command} commands \xB7 ${counts.mode} modes)`)}`;
  spinner2?.stop(countMsg);
  if (isInteractive) {
    const searchInput = await p.text({
      message: `${colors.primary("/")} Search assets`,
      placeholder: "name, keyword, or category  (Enter = show all, ESC = skip filter)"
    });
    if (p.isCancel(searchInput)) {
      p.log.info(colors.dim("Filter skipped \u2014 showing all assets"));
    } else {
      const q = String(searchInput ?? "").trim().toLowerCase();
      if (q) {
        const before = assets.length;
        const fuse = new ModeSearch(assets);
        const fuseResults = fuse.search(q);
        if (fuseResults.length === 0) {
          p.log.warn(colors.warning(`No assets matched "${q}" \u2014 showing all ${before}`));
        } else {
          assets = fuseResults.map((r) => r.item);
          p.log.info(
            `${colors.primary(String(assets.length))} asset${assets.length === 1 ? "" : "s"} matched ${colors.muted(`"${q}"`)}`
          );
        }
      }
    }
  }
  if (options.preview) {
    const target = assets.find(
      (a) => a.name.toLowerCase() === options.preview.toLowerCase()
    );
    if (!target) {
      const search = new ModeSearch(assets);
      const suggestions = search.search(options.preview).slice(0, 3);
      const msg = `Asset not found: ${options.preview}`;
      if (json) {
        console.log(formatError(msg, VERSION));
      } else {
        p.log.error(msg);
        if (suggestions.length > 0) {
          p.log.info(colors.muted("Did you mean: " + suggestions.map((s) => colors.secondary(s.item.name)).join(", ")));
        }
      }
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
    const unmatched = [];
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
      } else {
        unmatched.push(name);
      }
    }
    if (unmatched.length > 0 && !json) {
      p.log.warn(
        colors.warning(`No match for: ${unmatched.join(", ")}`) + colors.dim(" (skipped)")
      );
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
    const MAX_SELECT = 50;
    if (assets.length > MAX_SELECT) {
      p.log.warn(
        colors.warning(`Too many assets (${assets.length}) to display in a picker.`) + `
  ${colors.dim("Narrow your search above, or use one of these:")}
  ${colors.secondary(`vibe add <name>`)} \u2014 install specific assets by name
  ${colors.secondary(`vibe add <name> --yes`)} \u2014 install without prompts
  ${colors.secondary(`vibe list -k <kind>`)} \u2014 list by kind, then install`
      );
      const action = await p.select({
        message: "How would you like to proceed?",
        options: [
          { value: "all", label: `Install all ${assets.length} assets`, hint: "skip picker, auto-select everything" },
          { value: "search", label: "Search again", hint: "type a more specific query to narrow results" },
          { value: "exit", label: "Cancel", hint: "exit and use CLI flags instead" }
        ]
      });
      if (p.isCancel(action) || action === "exit") {
        p.cancel("Cancelled");
        process.exit(0);
      }
      if (action === "all") {
        selected = assets;
      } else {
        const query = await p.text({
          message: `${colors.primary("/")} Search assets`,
          placeholder: "type a more specific keyword"
        });
        if (p.isCancel(query)) {
          p.cancel("Cancelled");
          process.exit(0);
        }
        const q = String(query ?? "").trim();
        if (q) {
          const fuse = new ModeSearch(assets);
          const results2 = fuse.search(q).map((r) => r.item);
          if (results2.length === 0) {
            p.log.error(colors.error(`No assets matched "${q}"`));
            process.exit(1);
          }
          assets = results2;
        }
        if (assets.length > MAX_SELECT) {
          p.log.info(colors.dim(`Showing top ${MAX_SELECT} matches from ${assets.length} results.`));
          assets = assets.slice(0, MAX_SELECT);
        }
        const choices = assets.map((a) => ({
          value: a,
          label: `[${a.kind}] ${a.name}`,
          hint: a.description.length > 60 ? a.description.slice(0, 57) + "\u2026" : a.description
        }));
        const picked = await p.multiselect({
          message: `Pick what to install  ${colors.dim("\xB7 type to filter")}`,
          options: choices,
          required: true
        });
        if (p.isCancel(picked)) {
          p.cancel("Cancelled");
          process.exit(0);
        }
        selected = picked;
      }
    } else {
      const choices = assets.map((a) => ({
        value: a,
        label: `[${a.kind}] ${a.name}`,
        hint: a.description.length > 60 ? a.description.slice(0, 57) + "\u2026" : a.description
      }));
      const picked = await p.multiselect({
        message: `Pick what to install  ${colors.dim("\xB7 type to filter")}`,
        options: choices,
        required: true
      });
      if (p.isCancel(picked)) {
        p.cancel("Cancelled");
        process.exit(0);
      }
      selected = picked;
    }
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
        {
          value: false,
          label: "Project",
          hint: "Installed into ./<cli-dir>/ \u2014 committed with your repo, team-shared"
        },
        {
          value: true,
          label: "Global",
          hint: "Installed into ~/.<cli-dir>/ \u2014 available in all your projects"
        }
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
    const label = dryRun ? colors.warningBold("Installation plan (dry run \u2014 nothing will be changed)") : colors.primaryBold("Installation plan");
    p.log.step(label);
    let totalBytes = 0;
    for (const a of selected) {
      p.log.message(`  ${colors.muted(`[${a.kind}]`)} ${colors.secondary(a.name)}`);
      try {
        const s = await statAsync(a.path);
        totalBytes += s.size;
      } catch {
      }
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
    const totalTasks = selected.length * targets.length;
    const sizeStr = totalBytes > 0 ? formatBytes(totalBytes * targets.length) : "";
    console.log(
      colors.dim(`  ${totalTasks} operation${totalTasks !== 1 ? "s" : ""}${sizeStr ? ` \xB7 ~${sizeStr} total` : ""}`)
    );
    console.log();
  }
  if (dryRun) {
    if (json) {
      console.log(JSON.stringify({ version: VERSION, dryRun: true, message: "No changes were made" }, null, 2));
    } else {
      p.outro(colors.dim("Dry run complete \u2014 no files were changed."));
    }
    process.exit(0);
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
    if (failed.length > 0) {
      const successful = results.filter((r) => r.success && !r.skipped && r.path);
      if (successful.length > 0 && !options.yes) {
        console.log();
        const rollback = await p.confirm({
          message: `${successful.length} item(s) succeeded but ${failed.length} failed. Roll back the successful installs?`
        });
        if (rollback && !p.isCancel(rollback)) {
          const rb = await rollbackInstalledPaths(results);
          if (rb.removed.length > 0) {
            p.log.info(colors.dim(`Rolled back ${rb.removed.length} item(s).`));
          }
          if (rb.failed.length > 0) {
            p.log.warn(colors.warning(`Could not remove ${rb.failed.length} path(s).`));
          }
        }
      } else if (successful.length > 0) {
        console.log(
          colors.dim(`Tip: Re-run with same command to retry, or use ${colors.secondary("vibe uninstall")} to clean up.`)
        );
      }
    }
    console.log();
    p.outro(
      failed.length === 0 ? colors.success("Done!") : colors.warning("Completed with errors")
    );
  }
  process.exit(failed.length > 0 ? 1 : 0);
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    for (const a of items) {
      console.log(
        `  ${colors.success(symbols.bullet)} ${colors.textBold(a.name)} ${colors.muted(`\xB7 ${a.category}`)}`
      );
      console.log(
        `    ${colors.dim(a.description.length > 80 ? a.description.slice(0, 80) + "\u2026" : a.description)}`
      );
    }
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
  const targets = ALL_AGENT_TYPES.map((t) => {
    const globalDir = getKindDir(t, "skill", { global: true });
    const projectDir = getKindDir(t, "skill", { global: false });
    let writable = false;
    if (globalDir) {
      try {
        const parent = dirname2(globalDir);
        statSync(parent);
        writable = true;
      } catch {
        writable = false;
      }
    }
    return {
      type: t,
      displayName: agents[t].displayName,
      detected: detectedSet.has(t),
      skillsDir: globalDir,
      projectDir,
      writable
    };
  });
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
    const writeMark = t.detected ? t.writable ? colors.dim("writable") : colors.error("no write access") : "";
    console.log(
      `  ${mark} ${colors.secondary(t.displayName.padEnd(22))} ${colors.muted(t.skillsDir ?? "")} ${writeMark}`
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
async function runListInstalled(opts) {
  const json = opts.json ?? false;
  const config = await loadConfig();
  const merged = mergeConfigWithOptions(config, opts);
  const global = merged.global ?? false;
  let targetAgents;
  if (merged.agent && merged.agent.length > 0) {
    targetAgents = merged.agent;
  } else {
    targetAgents = await detectInstalledAgents();
    if (targetAgents.length === 0) targetAgents = ALL_AGENT_TYPES;
  }
  const root = defaultSource();
  const allAssets = await discoverAssets(root, { kinds: parseKinds(opts.kind) });
  const assetMap = new Map(allAssets.map((a) => [a.name.toLowerCase(), a]));
  const installed = [];
  for (const agentType of targetAgents) {
    for (const kind of ["skill", "agent", "command", "mode"]) {
      if (opts.kind && !opts.kind.includes(kind)) continue;
      const dir = getKindDir(agentType, kind, { global });
      if (!dir) continue;
      try {
        const entries = await import("fs/promises").then(
          (fs) => fs.readdir(dir, { withFileTypes: true })
        );
        for (const entry of entries) {
          const name = entry.name.replace(/\.(md|agent\.md)$/, "");
          if (name.toUpperCase() === "README") continue;
          const fullPath = join5(dir, entry.name);
          const bundled = assetMap.get(name.toLowerCase());
          installed.push({
            name,
            kind,
            agent: agents[agentType].displayName,
            path: fullPath,
            category: bundled?.category ?? "unknown"
          });
        }
      } catch {
      }
    }
  }
  if (json) {
    console.log(
      JSON.stringify({ version: VERSION, installed, total: installed.length }, null, 2)
    );
    return;
  }
  console.log();
  if (installed.length === 0) {
    p.log.info(colors.muted("No installed assets found."));
    console.log(
      colors.dim(`Use ${colors.secondary("vibe list")} to see available assets to install.`)
    );
  } else {
    p.log.step(colors.primaryBold(`Installed (${installed.length})`));
    const byAgent = /* @__PURE__ */ new Map();
    for (const item of installed) {
      const list = byAgent.get(item.agent) ?? [];
      list.push(item);
      byAgent.set(item.agent, list);
    }
    for (const [agent, items] of byAgent) {
      console.log();
      console.log(colors.secondaryBold(`${agent} (${items.length})`));
      for (const item of items) {
        console.log(
          `  ${colors.success(symbols.bullet)} ${colors.textBold(item.name)} ${colors.muted(`[${item.kind}]`)} ${colors.dim(`\xB7 ${item.category}`)}`
        );
        console.log(`    ${colors.dim(item.path)}`);
      }
    }
  }
  console.log();
}
async function runUninstall(names, opts) {
  const json = opts.json ?? false;
  const config = await loadConfig();
  const merged = mergeConfigWithOptions(config, opts);
  const global = merged.global ?? false;
  let targetAgents;
  if (merged.agent && merged.agent.length > 0) {
    targetAgents = merged.agent;
  } else {
    targetAgents = await detectInstalledAgents();
    if (targetAgents.length === 0) targetAgents = ALL_AGENT_TYPES;
  }
  const root = defaultSource();
  const allAssets = await discoverAssets(root);
  const removed = [];
  const notFound = [];
  for (const name of names) {
    const asset = allAssets.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    if (!asset) {
      notFound.push(name);
      continue;
    }
    for (const agentType of targetAgents) {
      for (const kind of ["skill", "agent", "command", "mode"]) {
        const targetPath = getInstallTarget(asset, agentType, { global });
        if (!targetPath) continue;
        try {
          if (existsSync3(targetPath)) {
            rmSync(targetPath, { recursive: true, force: true });
            removed.push({
              name: asset.name,
              agent: agents[agentType].displayName,
              path: targetPath,
              success: true
            });
          }
        } catch (error) {
          removed.push({
            name: asset.name,
            agent: agents[agentType].displayName,
            path: targetPath,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
  }
  if (json) {
    console.log(
      JSON.stringify(
        { version: VERSION, removed, notFound, total: removed.length },
        null,
        2
      )
    );
    return;
  }
  if (notFound.length > 0) {
    p.log.warn(colors.warning(`Not found in library: ${notFound.join(", ")}`));
  }
  const successItems = removed.filter((r) => r.success);
  const failedItems = removed.filter((r) => !r.success);
  if (successItems.length === 0 && failedItems.length === 0) {
    p.log.info(colors.muted("Nothing to uninstall \u2014 assets not found in target directories."));
  } else {
    console.log();
    if (successItems.length > 0) {
      p.log.step(colors.success(`${symbols.check} Removed ${successItems.length} item${successItems.length === 1 ? "" : "s"}:`));
      for (const r of successItems) {
        console.log(
          `  ${colors.success(symbols.bullet)} ${r.name} ${colors.dim("\u2192")} ${r.agent}`
        );
      }
    }
    if (failedItems.length > 0) {
      console.log();
      p.log.step(colors.error(`${symbols.cross} Failed ${failedItems.length}:`));
      for (const r of failedItems) {
        console.log(
          `  ${colors.error(symbols.bullet)} ${r.name} ${colors.dim("\u2192")} ${r.agent}: ${r.error}`
        );
      }
    }
  }
  console.log();
}
async function runUpdate(names, opts) {
  const json = opts.json ?? false;
  const dryRun = opts.dryRun ?? false;
  if (names.length > 0) {
    await main(defaultSource(), { ...opts, asset: names, yes: true });
  } else {
    const config = await loadConfig();
    const merged = mergeConfigWithOptions(config, opts);
    const global = merged.global ?? false;
    let targetAgents;
    if (merged.agent && merged.agent.length > 0) {
      targetAgents = merged.agent;
    } else {
      targetAgents = await detectInstalledAgents();
      if (targetAgents.length === 0) targetAgents = ALL_AGENT_TYPES;
    }
    const root = defaultSource();
    const allAssets = await discoverAssets(root);
    const installedNames = /* @__PURE__ */ new Set();
    for (const agentType of targetAgents) {
      for (const kind of ["skill", "agent", "command", "mode"]) {
        const dir = getKindDir(agentType, kind, { global });
        if (!dir) continue;
        try {
          const entries = await import("fs/promises").then(
            (fs) => fs.readdir(dir, { withFileTypes: true })
          );
          for (const entry of entries) {
            const name = entry.name.replace(/\.(md|agent\.md)$/, "");
            if (name.toUpperCase() === "README") continue;
            installedNames.add(name);
          }
        } catch {
        }
      }
    }
    const matched = allAssets.filter(
      (a) => installedNames.has(a.name.toLowerCase()) || installedNames.has(a.name)
    );
    if (matched.length === 0) {
      if (json) {
        console.log(formatError("No installed assets found to update", VERSION));
      } else {
        p.log.info(colors.muted("No installed assets found to update."));
        console.log(
          colors.dim(`Use ${colors.secondary("vibe add <name>")} to install assets first.`)
        );
      }
      return;
    }
    if (!json) {
      console.log(renderHeader(VERSION));
      p.log.info(`Updating ${matched.length} installed asset${matched.length === 1 ? "" : "s"}\u2026`);
    }
    await main(defaultSource(), { ...opts, asset: matched.map((a) => a.name), yes: true, dryRun });
  }
}
