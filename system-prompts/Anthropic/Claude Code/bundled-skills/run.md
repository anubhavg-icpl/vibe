---
name: run
description: Launch and drive this project's app to see a change working.
---

# run skill

**Running means launching the actual app and interacting with it** —
not the test suite, not an `import` of an internal function and a
`console.log`. The app as a user (human or programmatic) would meet
it: the CLI at its command, the server at its socket, the GUI at its
window.

## First: does a project skill already cover this?

A project skill that launches this app is the repo's verified path —
its author already cold-started from a Linux container and committed
what worked: the exact `apt-get` line, the env vars, the patches, the
driver. Use it instead of rediscovering.

```bash
d=$PWD; while :; do
  grep -Hm1 '^description:' "$d"/.claude/skills/*/SKILL.md 2>/dev/null
  [ -e "$d/.git" ] || [ "$d" = / ] && break
  d=$(dirname "$d")
done
```

- **One describes launching/driving this app** → read that SKILL.md
  and follow it verbatim. Don't paraphrase; don't skip the patches.
- **Mega-repo, several plausible, no clear match** → ask the user
  which unit to run.
- **Stale** (fails on mechanics unrelated to your task) → tell the
  user; offer to refresh it via `/run-skill-generator`.
- **Nothing about running** → fall back to the patterns below.

## Otherwise: match the shape, use the pattern

Pick the row closest to your project. Each example walks through
launch + first interaction; ignore any trailing "write the skill"
section — you're using the recipe, not authoring one.

| Project type | Handle | Example |
|---|---|---|
| CLI tool | direct invocation, exit code, stdin/stdout | examples/cli.md |
| Web server / API | background launch + `curl` smoke | examples/server.md |
| TUI / interactive terminal | tmux `send-keys` / `capture-pane` | examples/tui.md |
| Electron / desktop GUI | Playwright `_electron` REPL under xvfb | examples/electron.md |
| Browser-driven | dev server + `chromium-cli` script | examples/playwright.md |
| Library / SDK | import-and-call smoke script at the package boundary | examples/library.md |

If nothing fits, start from the closest match and adapt. For a web
app, examples/playwright.md — drive it with `chromium-cli`, no custom
driver needed. For a desktop app, examples/electron.md — it has the
`_electron` REPL driver skeleton and the tmux wrapping.

## Drive it, don't just launch it

Launching with no interaction proves the entrypoint resolves. That's
not running the app — it's typechecking with extra steps. Drive it to
a point where a user would see something:

- CLI → type a representative command, check the exit code and output.
- Server → hit the route the diff touches with `curl`, read the body.
- TUI → `send-keys` a navigation, `capture-pane` the result.
- GUI → click the button, screenshot the window. **Look at the
  screenshot.** A blank frame is a failure to launch.

If the fallback pattern didn't work out of the box — you had to
install packages, set env vars, patch config, or write a driver —
recommend `/run-skill-generator` in your report so that work gets
captured as a project skill. If it just worked, don't.

---

# examples/cli.md — CLI tool

CLIs are the simplest case — there's usually no background process to
manage, no ports, no lifecycle. The skill focuses on **installation**,
**representative invocations**, and **testing**.

## What matters

- **How to get the binary on `PATH`.** Installed globally? Run via
  `npx`/`uv run`? Built to `./target/release/foo`? Be explicit.
- **Two or three example invocations** that cover the main use cases.
  Include expected output so a reader can tell it worked.
- **Exit codes** if they're meaningful (e.g. linter returns 1 on findings).
- **Stdin behavior** if the tool reads from stdin.

## Example snippet

> ---
> name: run-mytool
> description: Build, install, and run mytool. Use when asked to run mytool, test it, or verify it's installed correctly.
> ---
>
> ## Setup
>
> ```bash
> pip install -e .
> ```
>
> This puts `mytool` on PATH. Verify:
>
> ```bash
> mytool --version
> # → mytool 0.3.1
> ```
>
> ## Run
>
> Process a single file:
>
> ```bash
> mytool process input.json
> # → Processed 42 records, wrote output.json
> ```
>
> Read from stdin, write to stdout:
>
> ```bash
> cat input.json | mytool process -
> ```
>
> Lint a directory (exits non-zero on problems):
>
> ```bash
> mytool lint ./src
> echo $?  # 0 if clean, 1 if issues found
> ```
>
> ## Test
>
> ```bash
> pytest
> ```

## Keep it short

A CLI's run skill can be very compact. Don't pad it with every flag —
the `--help` output covers that. Just show enough that an agent can
(a) build it, (b) confirm it works, (c) run the tests.

---

# examples/server.md — Web server / API

The distinguishing concern for servers is **lifecycle**: an agent needs to
start the server in the background, verify it's up, interact with it, then
cleanly shut it down. A foreground `npm start` that blocks the shell is
useless to an agent.

## Structure to follow

A good server run skill has:

1. **Prerequisites & setup** — same as any project.
2. **Run** — the background-launch pattern (below), not a blocking command.
3. **Verify** — a `curl` or similar that confirms the server is actually up.
4. **Stop** — how to cleanly terminate the background process.

If the background-launch + readiness-poll + smoke-curl sequence is more
than a couple of lines, put it in a `smoke.sh` inside the skill directory
and have `SKILL.md` say "run the smoke script." One command, exit code
tells you if the server is healthy.

## Background-launch pattern

Don't write:

> ```bash
> npm start
> ```

That blocks. Instead, show how to launch in the background, wait for
readiness, and find the PID later:

> ```bash
> npm start &> /tmp/server.log &
> SERVER_PID=$!
>
> # Wait for the server to come up (adjust timeout/port as needed)
> for i in {1..30}; do
>   curl -sf http://localhost:3000/health > /dev/null && break
>   sleep 1
> done
> ```

Then the verification step:

> ```bash
> curl http://localhost:3000/health
> # → {"status":"ok"}
> ```

And stopping:

> ```bash
> kill $SERVER_PID
> # or, if you've lost the PID:
> pkill -f "node.*server.js"
> ```

## Details worth documenting

- **Which port.** Make it explicit and say how to override it (`PORT=4000 npm start`).
- **What "ready" looks like.** A specific log line or a health endpoint to hit.
- **Required env vars.** Database URL, API keys, etc. — with a template `.env`
  if the list is long.
- **Hot reload vs production mode.** If they differ meaningfully, say which
  to use and when.
- **Dependent services.** If the server needs Redis/Postgres/etc., either
  point at a docker-compose that brings them up, or include the `docker run`
  command directly.

## Example snippet

Here's what a Run section for a typical Node API might look like:

> ## Run
>
> Start the dev server in the background:
>
> ```bash
> npm run dev &> /tmp/api.log &
> ```
>
> The server listens on port 3000. Wait for it to be ready, then verify:
>
> ```bash
> for i in {1..20}; do
>   curl -sf http://localhost:3000/health && break
>   sleep 0.5
> done
> curl http://localhost:3000/health
> # → {"status":"ok","version":"1.2.3"}
> ```
>
> Logs are at `/tmp/api.log`. Stop with:
>
> ```bash
> pkill -f "tsx watch src/index.ts"
> ```
>
> ### Environment
>
> | Variable | Required | Default | Notes |
> |---|---|---|---|
> | `DATABASE_URL` | Yes | — | Postgres connection string |
> | `PORT` | No | `3000` | |
> | `LOG_LEVEL` | No | `info` | `debug` / `info` / `warn` / `error` |

---

# examples/tui.md — TUI / interactive terminal app

Interactive terminal apps (text editors, REPLs, curses-based UIs) can't
be driven directly by an agent's bash tool — they take over the terminal.
The skill must show how to wrap them in `tmux` so the agent can send
input, capture output, and take screenshots.

## The tmux pattern

This is the standard approach:

1. Start the TUI inside a detached tmux session
2. Send keystrokes with `tmux send-keys`
3. Read screen contents with `tmux capture-pane`
4. Clean up with `tmux kill-session`

The skill's `SKILL.md` should present this as the primary way to drive
the app. A small `driver.sh` that wraps the launch+attach sequence can
live in the skill directory, but for most TUIs the raw tmux commands in
the skill body are enough.

## Example snippet

> ## Run (interactive, for agents)
>
> Start the TUI inside tmux:
>
> ```bash
> tmux new-session -d -s app -x 120 -y 40 './myapp'
> ```
>
> Poll until the ready marker appears (faster + more reliable than a fixed sleep —
> returns the instant the app is up, fails loudly if it isn't):
>
> ```bash
> timeout 10 bash -c 'until tmux capture-pane -t app -p | grep -q "Ready"; do sleep 0.2; done'
> tmux capture-pane -t app -p
> ```
>
> Send input (this example navigates to the Settings screen and toggles
> an option):
>
> ```bash
> tmux send-keys -t app 's'
> timeout 5 bash -c 'until tmux capture-pane -t app -p | grep -q "Settings"; do sleep 0.2; done'
> tmux send-keys -t app 'Down' 'Down' 'Space'  # navigate + toggle
> timeout 5 bash -c 'until tmux capture-pane -t app -p | grep -qF "[x]"; do sleep 0.2; done'
> tmux capture-pane -t app -p
> ```
>
> If you find yourself writing more than a couple of these poll lines, pull
> them into a `wait_for()` helper in a `driver.sh` next to the skill.
>
> Quit:
>
> ```bash
> tmux send-keys -t app 'q'
> tmux kill-session -t app 2>/dev/null || true
> ```
>
> ### Key reference
>
> | Key | Action |
> |---|---|
> | `j` / `k` or `Down` / `Up` | Navigate list |
> | `Enter` | Select |
> | `s` | Settings |
> | `q` | Quit |

## Details worth documenting

- **Terminal size.** Some TUIs break or hide content at small widths.
  Specify a known-good size in the `tmux new-session -x -y` args.
- **Startup time.** Poll for a ready marker (`until tmux capture-pane | grep -q X`)
  rather than a fixed `sleep N` — returns the instant the app is up, and fails
  usefully when it never does. Say what string means ready.
- **Keybinding reference.** A table of the main keys. This is the "API"
  of a TUI — an agent needs it to drive the app.
- **Exit cleanly.** Show the quit keystroke *and* `tmux kill-session` as
  a fallback.
- **Color/unicode quirks.** If `capture-pane` output is hard to read,
  note flags that help (`-e` for escape sequences, `-J` to join wrapped
  lines).

## Also document the direct invocation

For a human running the app interactively, tmux is overkill. Include
the one-liner too:

> ## Run (direct, for humans)
>
> ```bash
> ./myapp
> ```
>
> Press `q` to quit.

---

# examples/electron.md — Electron / desktop GUI app

Electron apps have a window. A future agent in a headless container
can't see a window. So your deliverable here is not a markdown file
that says "`npm start` opens a window" — it's a **driver script** that
launches the app under xvfb, exposes a REPL of commands (click, type,
screenshot), and lets an agent poke the UI by sending lines of text.

The skill's `SKILL.md` then becomes a short manual for that driver.

## What you're building

```
apps/desktop/
  .claude/skills/run-desktop/
    SKILL.md               ← short. "run the driver, here are the commands"
    driver.mjs             ← REPL: stdin commands → Playwright actions
```

The driver IS the product. Without it, the skill describes a GUI an
agent can never touch.

**Graduation path:** if the driver grows launch helpers the project's
real e2e suite wants to share, move it to `e2e-playwright/driver.mjs`
(or `scripts/drive.mjs`) and update the skill's paths. The skill stays
at `.claude/skills/run-desktop/`; the driver finds a better home.

## Step 1 — get the app to launch AT ALL under xvfb

This is usually the hardest part and produces most of the Gotchas. The
README will say "macOS/Windows only." Ignore that. Install xvfb + the
Chromium shared libs, find the Electron binary, and launch it:

```bash
apt-get install -y xvfb libnss3 libgbm1 libasound2t64 libgtk-3-0 \
  libxss1 libxkbcommon0 libatk-bridge2.0-0 libcups2 libdrm2

# Build the app first. Often the "dev" script is electron-forge which
# does a Vite/webpack build THEN launches. You want just the build:
npm install
npx electron-forge start &   # builds .vite/build/ or dist/
sleep 20 && kill %1          # kill it once built — you'll launch yourself

# Now try the raw launch
xvfb-run -a node -e "
  const { _electron } = require('playwright-core');
  _electron.launch({
    executablePath: './node_modules/electron/dist/electron',
    args: ['--no-sandbox', '.'],
    timeout: 30000,
  }).then(app => {
    console.log('launched, windows:', app.windows().map(w => w.url()));
    return app.close();
  });
"
```

Iterate until it launches. Each missing `.so` → one more `apt-get`
package → one more line in Prerequisites. Each launch timeout → check
the `nodeCliInspect` fuse isn't disabled, check the build output exists.

**`--no-sandbox` is almost always needed in containers.** Electron's
sandbox needs CAP_SYS_ADMIN or user namespaces. Neither by default.

## Step 2 — build the REPL driver

Once you can launch it, turn that throwaway script into a REPL. Start
minimal — you will add commands as you need them. **The REPL is the
right shape** because an agent can run it inside tmux and iterate
without relaunching the (slow) app on every interaction.

```javascript
// .claude/skills/run-<unit>/driver.mjs
// REPL driver for <app>. Run under xvfb on headless Linux.
// Designed for agents: wrap in tmux, send-keys commands, capture-pane output.
import { _electron as electron } from 'playwright-core';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

const APP_DIR = path.resolve(import.meta.dirname, '../../..');
const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

let app = null;
let page = null;   // the window/page you actually interact with

const electronBin = process.platform === 'darwin'
  ? path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron')
  : path.join(APP_DIR, 'node_modules/electron/dist/electron');

const COMMANDS = {
  async launch() {
    if (app) return console.log('already launched');
    app = await electron.launch({
      executablePath: electronBin,
      args: ['--no-sandbox', APP_DIR],
      env: { ...process.env, DISPLAY: process.env.DISPLAY || ':99' },
      timeout: 30_000,
    });
    await new Promise(r => setTimeout(r, 8_000));
    page = app.windows().find(w => !w.url().startsWith('devtools://'))
        ?? await app.firstWindow();
    console.log('launched.', app.windows().length, 'windows:');
    for (const w of app.windows()) console.log(' ', w.url());
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f });
    console.log('screenshot:', f);
  },

  async click(sel) {
    if (!page) return console.log('ERROR: launch first');
    const r = await page.evaluate(s => {
      const el = document.querySelector(s);
      if (!el) return 'NOT_FOUND';
      el.click(); return 'OK';
    }, sel);
    console.log('click', sel, '→', r);
  },

  async 'click-text'(text) {
    if (!page) return console.log('ERROR: launch first');
    const r = await page.evaluate(t => {
      const els = [...document.querySelectorAll('button, a, [role="button"]')];
      const el = els.find(e => e.textContent?.trim() === t)
              ?? els.find(e => e.textContent?.includes(t));
      if (!el) return 'NOT_FOUND';
      el.click(); return 'OK: ' + el.tagName;
    }, text);
    console.log('click-text', JSON.stringify(text), '→', r);
  },

  async type(text)  { if (page) await page.keyboard.type(text, { delay: 30 }); },
  async press(key)  { if (page) await page.keyboard.press(key); },

  async wait(sel) {
    if (!page) return console.log('ERROR: launch first');
    try { await page.waitForSelector(sel, { timeout: 10_000 }); console.log('found:', sel); }
    catch { console.log('TIMEOUT:', sel); }
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try { console.log(JSON.stringify(await page.evaluate(expr))); }
    catch (e) { console.log('ERROR:', e.message); }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first');
    console.log(await page.evaluate(
      s => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
      sel || null));
  },

  async windows() {
    if (!app) return console.log('ERROR: launch first');
    for (const w of app.windows()) console.log(' ', w.url());
    const wcs = await app.evaluate(({ webContents }) =>
      webContents.getAllWebContents().map(w => ({ id: w.id, type: w.getType(), url: w.getURL() })));
    console.log('webContents:');
    for (const w of wcs) console.log(` [${w.id}] ${w.type}: ${w.url}`);
  },

  async quit() { if (app) await app.close().catch(()=>{}); app = null; page = null; },
  help() { console.log('commands:', Object.keys(COMMANDS).join(', ')); },
};

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'driver> ' });

rl.on('line', async line => {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (!cmd) return rl.prompt();
  const fn = COMMANDS[cmd];
  if (!fn) { console.log('unknown:', cmd, '— try: help'); return rl.prompt(); }
  try { await fn(rest.join(' ')); } catch (e) { console.log('ERROR:', e.message); }
  if (cmd === 'quit') { rl.close(); process.exit(0); }
  rl.prompt();
});
rl.on('close', async () => { await COMMANDS.quit(); process.exit(0); });

console.log('<app> driver — "help" for commands, "launch" to start');
rl.prompt();
```

**This is a starting skeleton.** As you try to reach interesting parts
of the app you'll add app-specific commands.

## Step 3 — use it yourself, via tmux

Run the driver the same way the next agent will:

```bash
tmux new-session -d -s app -x 200 -y 50
tmux send-keys -t app 'cd /workspace/apps/desktop && xvfb-run -a node .claude/skills/run-desktop/driver.mjs' Enter
timeout 20 bash -c 'until tmux capture-pane -t app -p | grep -q "driver>"; do sleep 0.2; done'
tmux send-keys -t app 'launch' Enter
timeout 60 bash -c 'until tmux capture-pane -t app -p | grep -q "launched"; do sleep 0.2; done'
tmux send-keys -t app 'ss 01-landing' Enter
timeout 10 bash -c 'until tmux capture-pane -t app -p | grep -q "screenshot:"; do sleep 0.2; done'
tmux send-keys -t app 'windows' Enter    # which page has the real UI?
tmux capture-pane -t app -p
```

Then actually open `/tmp/shots/01-landing.png`. Is it the app? Is it
blank? Is it a login screen? Each of these tells you what to do next.

## Step 4 — write SKILL.md

Keep it short. The driver is the meat; `SKILL.md` is the manual.

## Obstacles you will hit (and they go in Gotchas)

- **`firstWindow()` gives you a splash/loading screen,** not the app.
- **The real UI is in a BrowserView, not a BrowserWindow.**
- **`locator.click()` clicks the wrong thing.** Use `page.evaluate(el => el.click())`.
- **Feature gates block the thing you need to test.**
- **contentEditable inputs** (ProseMirror, Tiptap, Slate) aren't `<textarea>`.
- **Electron steals stdin.** The `fs.openSync('/dev/stdin', 'r')` trick protects your REPL's input.
- **Native modules fail to load** (keychain, notifications, etc.).

---

# examples/playwright.md — Browser-driven web app

You have a dev server that serves HTML to a browser. An agent in a
headless container can't open a browser window — so "run the app" means
launching the dev server, driving a headless Chromium against it, and
producing a screenshot that proves the page rendered.

Don't write a browser driver. Use `chromium-cli`.

## Dev server

Find the dev command (`package.json` `scripts.dev`, `Makefile`,
README), start it in the background, and wait for it to actually serve:

```bash
npm run dev &   # or yarn dev, pnpm dev, make serve, ./dev.sh
echo $! > /tmp/dev.pid
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

## Drive

`chromium-cli` is a headless-Chromium REPL. Pipe a script to stdin:

```bash
chromium-cli --session app <<'EOF'
nav http://localhost:3000
wait-for text=Dashboard
screenshot
click button:has-text("New item")
fill input[name="title"] Smoke test
press Enter
wait-for text=Smoke test
screenshot
console --errors
EOF
```

## What to put in the skill

The project-specific bits only. `chromium-cli` handles the mechanics.

- **Dev command + port + stop.**
- **Auth.**
- **One representative interaction.**
- **App-specific gotchas.**

## Gotchas that recur

- **React controlled inputs.** Use `fill` / `type`, not `eval el.value = '…'`.
- **Websockets / long-poll.** `wait-idle` never settles. `wait-for` the element you actually need.
- **Slow first paint.** Vite/Next compile routes on demand; the first `nav` can take 10s+.
- **`screenshot-element <sel>`** crops to one element.
- **Check `console --errors` before declaring success.**

---

# examples/library.md — Library / SDK

Libraries don't have a "run" step in the process sense. For libraries, the run skill is about:

1. **Building** the library from source
2. **Running the test suite**
3. **A minimal working example** that exercises the library

## The smoke-test example

> ```bash
> python -c '
> from mylib import Client
> c = Client()
> print(c.ping())
> '
> # → pong
> ```

## Things to consider documenting

- **Development mode vs installed mode.**
- **Optional dependencies.**
- **Generated code.**
