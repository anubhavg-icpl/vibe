import chalk from "chalk";
import { randomSarcasticQuote } from "../theme.js";

// ── ASCII pets ────────────────────────────────────────────────────────────────

const PETS: string[][][] = [
  // Cat - 3 frames
  [
    [" /\\_/\\ ", "( o.o )", " > ^ < ", " |   | ", "(___)  "],
    [" /\\_/\\ ", "( -.- )", " > ^ < ", " |   | ", "(___)  "],
    [" /\\_/\\ ", "( o.o )", " > ^ < ", " | | | ", "(___)  "],
  ],
  // Dog - 2 frames
  [
    ["  / \\  ", " (o  o)", "  \\__/ ", " / || \\", "/      \\"],
    ["  / \\  ", " (o  o)", "  \\__/ ", " /    \\", "/ \\__/ \\"],
  ],
  // Fish - 3 frames
  [
    ["    ><>  ", "        ", "        "],
    ["   ><>   ", " ~      ", "        "],
    ["  ><>    ", "  ~  ~  ", "        "],
  ],
];

const PET_COLORS = ["#C8762A", "#8855CC", "#4BAF78"];

function renderPet(petIdx: number, frame: number): string[] {
  const pet = PETS[petIdx % PETS.length];
  const frames = pet.length;
  const f = frame % frames;
  const color = chalk.hex(PET_COLORS[petIdx % PET_COLORS.length]);
  return pet[f].map((row) => color(row));
}

// ── Donut math (ported from github.com/Debajyati/asciiDonut) ─────────────────

const DONUT_CHARS = ".,-~:;=!*#$@";

function computeDonut(height: number, width: number, a: number, b: number): string[] {
  const buf: string[] = new Array(width * height).fill(" ");
  const zbuf: number[] = new Array(width * height).fill(0);

  const cosA = Math.cos(a), sinA = Math.sin(a);
  const cosB = Math.cos(b), sinB = Math.sin(b);

  for (let j = 0; j < 6.28; j += 0.07) {
    const cosT = Math.cos(j), sinT = Math.sin(j);
    for (let i = 0; i < 6.28; i += 0.02) {
      const sinP = Math.sin(i), cosP = Math.cos(i);
      const h = cosT + 2;
      const d = 1 / (sinP * h * sinA + sinT * cosA + 5);
      const t = sinP * h * cosA - sinT * sinA;
      const x = ((width / 2) + (width / 2.5) * d * (cosP * h * cosB - t * sinB)) | 0;
      const y = ((height / 2) + (height / 3)  * d * (cosP * h * sinB + t * cosB)) | 0;
      const o = x + width * y;
      const n = (8 * ((sinT * sinA - sinP * cosT * cosA) * cosB
        - sinP * cosT * sinA - sinT * cosA - cosP * cosT * sinB)) | 0;

      if (y >= 0 && y < height && x >= 0 && x < width && d > zbuf[o]) {
        zbuf[o] = d;
        const ci = Math.max(0, Math.min(n, DONUT_CHARS.length - 1));
        const ri = Math.round(ci * (RAMP.length - 1) / 7);  // n in [0,7]
        buf[o]   = chalk.hex(RAMP[Math.min(ri, RAMP.length - 1)])(DONUT_CHARS[ci]);
      }
    }
  }

  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    rows.push(buf.slice(y * width, (y + 1) * width).join(""));
  }
  return rows;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LOGO = [
  " ██╗   ██╗██╗██████╗ ",
  " ██║   ██║██║██╔══██╗",
  " ██║   ██║██║██║  ██║",
  " ╚██╗ ██╔╝██║██║  ██║",
  "  ╚████╔╝ ██║██████╔╝",
  "   ╚═══╝  ╚═╝╚═════╝ ",
];

const TAGLINE  = "AI  Agent  Asset  Manager";
const CREDIT   = "Made by Anubhav Gain  ·  anubhavg@infopercept.com";
const HINT     = "Press any key to continue…";

const RAMP = [
  "#1A0900","#3A1808","#5C2810","#8B4018",
  "#B56028","#C8762A","#D4882E","#E09A32","#F0B048",
];

const PRIMARY = "#C8762A";
const MUTED   = "#8A8270";
const DIM     = "#3A3028";
const DIM2    = "#6A5840";
const SUCCESS = "#4BAF78";

const SPINNER  = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
const FRAME_MS = 50;

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B\[[0-?]*[ -/]*[@-~]/g;
const visLen  = (s: string): number => s.replace(ANSI_RE, "").length;

const LOGO_W  = LOGO.reduce((m, l) => Math.max(m, l.length), 0);
const INNER_W = LOGO_W + 4;   // 40 — used by full box

const C_INNER = 46;           // compact bar inner width
const C_BOX_W = C_INNER + 4;

function colorLogoLine(line: string, sweepX: number): string {
  return line.split("").map((ch, i) => {
    if (ch === " ") return ch;
    const dist = Math.abs(i - sweepX);
    const idx  = Math.max(0, RAMP.length - 1 - Math.floor(dist * (RAMP.length / (LOGO_W * 0.5))));
    return chalk.hex(RAMP[Math.min(idx, RAMP.length - 1)])(ch);
  }).join("");
}

// ── Box row helpers ───────────────────────────────────────────────────────────

function cRow(content: string, innerW: number): string {
  const vw = visLen(content);
  const lp = Math.max(0, Math.floor((innerW - vw) / 2));
  const rp = Math.max(0, innerW - vw - lp);
  return chalk.hex(PRIMARY)("║") + " " + " ".repeat(lp) + content + " ".repeat(rp) + " " + chalk.hex(PRIMARY)("║");
}

function hRule(l: string, r: string, innerW: number, m = "═"): string {
  return chalk.hex(PRIMARY)(l + m.repeat(innerW + 2) + r);
}

// ── Compact 4-row info bar (shown beneath the donut) ─────────────────────────

function buildCompactBar(version: string, tick: number, status: string, ready: boolean, quote: string): string[] {
  const spin = chalk.hex(PRIMARY)(SPINNER[tick % SPINNER.length]);
  const title = chalk.hex(PRIMARY).bold("V I B E") +
    chalk.hex(MUTED)("  ·  ") +
    chalk.hex(MUTED)(TAGLINE) +
    "  " + chalk.hex(MUTED)(`v${version}`);

  const lines: string[] = [];
  lines.push(hRule("╔", "╗", C_INNER));

  if (ready) {
    lines.push(cRow(title, C_INNER));
    lines.push(cRow(chalk.hex(SUCCESS)("✓") + "  " + chalk.hex(MUTED)("Ready") +
      "  " + chalk.hex(DIM2)("·") + "  " + chalk.hex(DIM2)(HINT), C_INNER));
  } else {
    lines.push(cRow(title, C_INNER));
    lines.push(cRow(spin + "  " + chalk.hex(DIM2)(quote), C_INNER));
  }

  lines.push(hRule("╚", "╝", C_INNER));
  return lines;  // always 4 rows
}

// ── Full VIBE box with logo (shown when terminal is too short for donut) ──────

function buildFullBox(version: string, tick: number, status: string, ready: boolean): string[] {
  const spin = chalk.hex(PRIMARY)(SPINNER[tick % SPINNER.length]);
  const phase = tick % (LOGO_W * 2);
  const sweepX = phase <= LOGO_W ? phase : LOGO_W * 2 - phase;

  const box: string[] = [];
  box.push(hRule("╔", "╗", INNER_W));
  box.push(cRow("", INNER_W));

  for (const raw of LOGO) {
    const colored = colorLogoLine(raw, sweepX);
    const lp = Math.floor((INNER_W - raw.length) / 2);
    const rp = INNER_W - raw.length - lp;
    box.push(
      chalk.hex(PRIMARY)("║") + " " +
      " ".repeat(Math.max(0, lp)) + colored + " ".repeat(Math.max(0, rp)) +
      " " + chalk.hex(PRIMARY)("║")
    );
  }

  box.push(cRow("", INNER_W));
  box.push(hRule("╠", "╣", INNER_W));
  box.push(cRow("", INNER_W));
  box.push(cRow(chalk.hex(PRIMARY).bold(TAGLINE), INNER_W));
  box.push(cRow(chalk.hex(MUTED)(`v${version}`), INNER_W));
  box.push(cRow("", INNER_W));

  if (ready) {
    box.push(cRow(chalk.hex(SUCCESS)("✓") + "  " + chalk.hex(MUTED)("Ready"), INNER_W));
    box.push(cRow("", INNER_W));
    box.push(cRow(chalk.hex(DIM2)(HINT), INNER_W));
  } else {
    box.push(cRow(spin + "  " + chalk.hex(MUTED)(status), INNER_W));
  }

  box.push(cRow("", INNER_W));
  box.push(hRule("╚", "╝", INNER_W));
  return box;
}

// ── Full-screen frame ─────────────────────────────────────────────────────────

const MIN_DONUT_H = 8;
const GAP         = 1;
const COMPACT_H   = 4;  // compact bar is always 4 rows

function buildFrame(version: string, tick: number, status: string, ready: boolean, quote: string): string {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows    || 24;

  // Donut: fill all available space above the compact bar
  const maxDonutH = rows - COMPACT_H - GAP - 2;  // leave 2 rows for padding
  const donutH    = Math.min(22, Math.max(MIN_DONUT_H, maxDonutH));
  const donutW    = Math.round(donutH * 3.6);

  // Show donut when there's at least MIN_DONUT_H rows for it AND it fits horizontally
  const showDonut = maxDonutH >= MIN_DONUT_H && donutW <= cols;

  const infoLines   = showDonut
    ? buildCompactBar(version, tick, status, ready, quote)   // 4 rows
    : buildFullBox(version, tick, status, ready);            // 16+ rows

  const infoH     = infoLines.length;
  const infoW     = showDonut ? C_BOX_W : INNER_W + 4;
  const contentH  = showDonut ? donutH + GAP + infoH : infoH;
  const topPad    = Math.max(0, Math.floor((rows - contentH) / 2));

  const blank     = " ".repeat(cols);
  const out: string[] = [];

  for (let i = 0; i < topPad; i++) out.push(blank);

  // ── Donut (top) ───────────────────────────────────────────────────────────

  if (showDonut) {
    const a = 1 + tick * 0.05;
    const b = tick * 0.07;
    const donutRows = computeDonut(donutH, donutW, a, b);
    const dLP = Math.max(0, Math.floor((cols - donutW) / 2));
    const dRP = Math.max(0, cols - dLP - donutW);
    for (const row of donutRows) {
      out.push(" ".repeat(dLP) + row + " ".repeat(dRP));
    }
    for (let i = 0; i < GAP; i++) out.push(blank);
  }

  // ── Info box (below donut) ────────────────────────────────────────────────

  const iLP = Math.max(0, Math.floor((cols - infoW) / 2));
  const iRP = Math.max(0, cols - iLP - infoW);
  for (const l of infoLines) {
    out.push(" ".repeat(iLP) + l + " ".repeat(iRP));
  }

  // ── Bottom padding ────────────────────────────────────────────────────────

  const remaining = rows - topPad - contentH;
  for (let i = 0; i < Math.max(0, remaining); i++) out.push(blank);

  // ── Bottom-right credit ───────────────────────────────────────────────────

  const creditX = Math.max(1, cols - CREDIT.length - 1);

  return out.join("\n")
    + `\x1B[${rows};${creditX}H` + chalk.hex(DIM)(CREDIT);
}

// ── Keypress ──────────────────────────────────────────────────────────────────

function waitForKey(): Promise<void> {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) { resolve(); return; }
    process.stdin.setRawMode(true);
    process.stdin.resume();
    // Drain any buffered data first
    process.stdin.read();
    const onData = (chunk: Buffer | string) => {
      const key = Buffer.isBuffer(chunk) ? chunk.toString() : chunk;
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      // Drain remaining bytes in the buffer
      while (process.stdin.read()) { /* drain */ }
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
  stop(): Promise<void>;
}

export function startAnimation(version: string): AnimController {
  // Non-TTY or non-interactive stdin: skip animation entirely
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    return { stop: async () => undefined };
  }

  process.stdout.write("\x1B[2J\x1B[H\x1B[?25l");

  const quote = randomSarcasticQuote();
  let tick    = 0;
  let halted  = false;
  let ready   = false;
  let stopped = false;

  function statusMsg(): string {
    return tick < 12 ? "Initializing…" : "Loading assets…";
  }

  function render(): void {
    if (halted) return;
    process.stdout.write("\x1B[H" + buildFrame(version, tick, statusMsg(), ready, quote));
  }

  render();

  const interval = setInterval(() => {
    if (halted) return;
    tick++;
    render();
  }, FRAME_MS);

  function cleanup(): void {
    if (halted) return;
    halted = true;
    clearInterval(interval);
    // Full terminal reset: clear screen, show cursor, reset attributes
    process.stdout.write("\x1B[2J\x1B[H\x1B[0m\x1B[?25h");
  }

  function handleSignal(): void { cleanup(); process.exit(0); }

  process.once("SIGINT",  handleSignal);
  process.once("SIGTERM", handleSignal);

  return {
    async stop(): Promise<void> {
      if (stopped) return;
      stopped = true;

      // If animation was already cleaned up (signal handler), just return
      if (halted) return;

      // Flip to ready state — interval keeps spinning the donut until key press
      ready = true;

      // Safety timeout: if waitForKey never resolves (e.g. stdin closes), bail after 3s
      const timeout = new Promise<void>((resolve) => {
        setTimeout(() => {
          cleanup();
          resolve();
        }, 3000);
      });

      await Promise.race([waitForKey(), timeout]);

      cleanup();
      process.removeListener("SIGINT",  handleSignal);
      process.removeListener("SIGTERM", handleSignal);
    },
  };
}

export default { startAnimation };
