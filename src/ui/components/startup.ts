import chalk from "chalk";

// ── Logo (ANSI Shadow, wide spacing) ─────────────────────────────────────────

const LOGO = [
  "  ██╗   ██╗  ██╗  ██████╗   ███████╗",
  "  ██║   ██║  ██║  ██╔══██╗  ██╔════╝",
  "  ██║   ██║  ██║  ██████╔╝  █████╗  ",
  "  ╚██╗ ██╔╝  ██║  ██╔══██╗  ██╔══╝  ",
  "   ╚████╔╝   ██║  ██████╔╝  ███████╗",
  "    ╚═══╝    ╚═╝  ╚═════╝   ╚══════╝",
];

const TAGLINE = "AI  Agent  Asset  Manager";
const CREDIT  = "Made by Anubhav Gain  ·  anubhavg@infopercept.com";
const HINT    = "Press any key to continue…";

const RAMP = [
  "#1A0900","#3A1808","#5C2810","#8B4018",
  "#B56028","#C8762A","#D4882E","#E09A32","#F0B048",
];

const PRIMARY = "#C8762A";
const MUTED   = "#8A8270";
const DIM     = "#3A3028";
const SUCCESS = "#4BAF78";

const SPINNER  = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
const FRAME_MS = 50;

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B\[[0-?]*[ -/]*[@-~]/g;
const visLen  = (s: string): number => s.replace(ANSI_RE, "").length;

const LOGO_W  = LOGO.reduce((m, l) => Math.max(m, l.length), 0);  // 36
const INNER_W = LOGO_W + 6;                                         // 42

// ── Amber sweep ───────────────────────────────────────────────────────────────

function colorLine(line: string, sweepX: number): string {
  return line.split("").map((ch, i) => {
    if (ch === " ") return ch;
    const dist = Math.abs(i - sweepX);
    const idx  = Math.max(0, RAMP.length - 1 - Math.floor(dist * (RAMP.length / (LOGO_W * 0.5))));
    return chalk.hex(RAMP[Math.min(idx, RAMP.length - 1)])(ch);
  }).join("");
}

// ── Box helpers (double-line borders) ────────────────────────────────────────

function boxRow(content: string): string {
  const vw = visLen(content);
  const lp = Math.max(0, Math.floor((INNER_W - vw) / 2));
  const rp = Math.max(0, INNER_W - vw - lp);
  return chalk.hex(PRIMARY)("║") + " " + " ".repeat(lp) + content + " ".repeat(rp) + " " + chalk.hex(PRIMARY)("║");
}

function hRule(l: string, r: string, m = "═"): string {
  return chalk.hex(PRIMARY)(l + m.repeat(INNER_W + 2) + r);
}

// ── Full-screen frame ─────────────────────────────────────────────────────────

function buildFrame(version: string, tick: number, status: string, ready: boolean): string {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows    || 24;

  const period = LOGO_W * 2;
  const phase  = tick % period;
  const sweepX = phase <= LOGO_W ? phase : period - phase;
  const spin   = chalk.hex(PRIMARY)(SPINNER[tick % SPINNER.length]);

  // ── Build the box ──────────────────────────────────────────────────────────

  const box: string[] = [];

  box.push(hRule("╔", "╗"));
  box.push(boxRow(""));

  for (const raw of LOGO) {
    const colored = colorLine(raw, sweepX);
    const lp = Math.floor((INNER_W - raw.length) / 2);
    const rp = INNER_W - raw.length - lp;
    box.push(
      chalk.hex(PRIMARY)("║") + " " +
      " ".repeat(Math.max(0, lp)) + colored + " ".repeat(Math.max(0, rp)) +
      " " + chalk.hex(PRIMARY)("║")
    );
  }

  box.push(boxRow(""));
  box.push(hRule("╠", "╣"));
  box.push(boxRow(""));
  box.push(boxRow(chalk.hex(PRIMARY).bold(TAGLINE)));
  box.push(boxRow(chalk.hex(MUTED)(`v${version}`)));
  box.push(boxRow(""));

  if (ready) {
    box.push(boxRow(chalk.hex(SUCCESS)("✓") + "  " + chalk.hex(MUTED)("Ready")));
    box.push(boxRow(""));
    box.push(boxRow(chalk.hex(MUTED)(HINT)));
  } else {
    box.push(boxRow(spin + "  " + chalk.hex(MUTED)(status)));
  }

  box.push(boxRow(""));
  box.push(hRule("╚", "╝"));

  // ── Center the box ─────────────────────────────────────────────────────────

  const boxH    = box.length;
  const boxW    = INNER_W + 4;  // ║ + space + content + space + ║
  const leftPad = Math.max(0, Math.floor((cols - boxW) / 2));
  const topPad  = Math.max(0, Math.floor((rows - boxH) / 2));

  const margin = " ".repeat(leftPad);
  const blank  = " ".repeat(cols);
  const out: string[] = [];

  for (let i = 0; i < topPad; i++) out.push(blank);
  for (const l of box) out.push(margin + l);
  const remaining = rows - topPad - boxH;
  for (let i = 0; i < Math.max(0, remaining); i++) out.push(blank);

  // ── Bottom-right credit line ───────────────────────────────────────────────

  const creditVW = CREDIT.length;
  const creditX  = Math.max(1, cols - creditVW - 1);
  // cursor-position escape: \x1B[row;colH  (1-indexed)
  const creditEsc = `\x1B[${rows};${creditX}H` + chalk.hex(DIM)(CREDIT);

  return out.join("\n") + creditEsc;
}

// ── Wait for a single keypress ────────────────────────────────────────────────

function waitForKey(): Promise<void> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) { resolve(); return; }

    process.stdin.setRawMode(true);
    process.stdin.resume();

    const onData = (chunk: Buffer | string) => {
      const key = Buffer.isBuffer(chunk) ? chunk.toString() : chunk;
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      if (key === "\x03") {
        process.stdout.write("\x1B[2J\x1B[H\x1B[?25h");
        process.exit(0);
      }
      resolve();
    };

    process.stdin.on("data", onData);
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface AnimController {
  stop(finalStatus?: string): Promise<void>;
}

export function startAnimation(version: string): AnimController {
  if (!process.stdout.isTTY) {
    return { stop: async () => undefined };
  }

  // Full-screen takeover: clear, cursor to home, hide cursor
  process.stdout.write("\x1B[2J\x1B[H\x1B[?25l");

  let tick    = 0;
  let stopped = false;
  let ready   = false;

  function statusMsg(): string {
    return tick < 12 ? "Initializing…" : "Loading assets…";
  }

  function render(s: string): void {
    process.stdout.write("\x1B[H" + buildFrame(version, tick, s, ready));
  }

  render(statusMsg());

  const interval = setInterval(() => {
    if (stopped) return;
    tick++;
    render(statusMsg());
  }, FRAME_MS);

  function cleanup(): void {
    clearInterval(interval);
    process.stdout.write("\x1B[2J\x1B[H\x1B[?25h");
  }

  function handleSignal(): void {
    cleanup();
    process.exit(0);
  }

  process.once("SIGINT",  handleSignal);
  process.once("SIGTERM", handleSignal);

  return {
    async stop(finalStatus?: string): Promise<void> {
      stopped = true;
      clearInterval(interval);

      // Show "Ready" + hint, wait for keypress
      ready = true;
      tick++;
      render(finalStatus ?? "Ready");
      await waitForKey();

      cleanup();
      process.removeListener("SIGINT",  handleSignal);
      process.removeListener("SIGTERM", handleSignal);
    },
  };
}

export default { startAnimation };
