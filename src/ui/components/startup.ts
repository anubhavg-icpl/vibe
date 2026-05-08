import chalk from "chalk";

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
        const ri = Math.floor(ci * (RAMP.length - 1) / (DONUT_CHARS.length - 1));
        buf[o] = chalk.hex(RAMP[ri])(DONUT_CHARS[ci]);
      }
    }
  }

  // Split flat buffer into rows of `width` chars
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    rows.push(buf.slice(y * width, (y + 1) * width).join(""));
  }
  return rows;
}

// ── Constants ─────────────────────────────────────────────────────────────────

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
const DIM2    = "#6A5840";
const SUCCESS = "#4BAF78";

const SPINNER  = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
const FRAME_MS = 50;

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B\[[0-?]*[ -/]*[@-~]/g;
const visLen  = (s: string): number => s.replace(ANSI_RE, "").length;

const LOGO_W = LOGO.reduce((m, l) => Math.max(m, l.length), 0);

function colorLogoLine(line: string, sweepX: number): string {
  return line.split("").map((ch, i) => {
    if (ch === " ") return ch;
    const dist = Math.abs(i - sweepX);
    const idx  = Math.max(0, RAMP.length - 1 - Math.floor(dist * (RAMP.length / (LOGO_W * 0.5))));
    return chalk.hex(RAMP[Math.min(idx, RAMP.length - 1)])(ch);
  }).join("");
}

// ── Box helpers (double-line borders) ────────────────────────────────────────

const INNER_W = LOGO_W + 4;  // 40

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

  const spin   = chalk.hex(PRIMARY)(SPINNER[tick % SPINNER.length]);
  const logoSweepX = (tick % (LOGO_W * 2));
  const sweepX = logoSweepX <= LOGO_W ? logoSweepX : LOGO_W * 2 - logoSweepX;

  // ── VIBE box lines ────────────────────────────────────────────────────────

  const box: string[] = [];
  box.push(hRule("╔", "╗"));
  box.push(boxRow(""));
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
  box.push(boxRow(""));
  box.push(hRule("╠", "╣"));
  box.push(boxRow(""));
  box.push(boxRow(chalk.hex(PRIMARY).bold(TAGLINE)));
  box.push(boxRow(chalk.hex(MUTED)(`v${version}`)));
  box.push(boxRow(""));
  if (ready) {
    box.push(boxRow(chalk.hex(SUCCESS)("✓") + "  " + chalk.hex(MUTED)("Ready")));
    box.push(boxRow(""));
    box.push(boxRow(chalk.hex(DIM2)(HINT)));
  } else {
    box.push(boxRow(spin + "  " + chalk.hex(MUTED)(status)));
  }
  box.push(boxRow(""));
  box.push(hRule("╚", "╝"));

  const boxH = box.length;
  const boxW = INNER_W + 4;

  // ── Donut dimensions (only render if there's room) ────────────────────────

  const gap       = 1;
  const donutH    = Math.max(10, rows - boxH - gap - 2);
  const donutW    = Math.round(donutH * 3.6);   // match original 80/22 aspect
  const showDonut = rows >= boxH + gap + 10 + 2 && donutW <= cols;

  const contentH = showDonut ? donutH + gap + boxH : boxH;
  const topPad   = Math.max(0, Math.floor((rows - contentH) / 2));

  // ── Build output lines ────────────────────────────────────────────────────

  const blank  = " ".repeat(cols);
  const out: string[] = [];

  for (let i = 0; i < topPad; i++) out.push(blank);

  if (showDonut) {
    const a = 1 + tick * 0.05;
    const b = tick * 0.07;
    const donutRows = computeDonut(donutH, donutW, a, b);
    const donutLP = Math.max(0, Math.floor((cols - donutW) / 2));
    const donutRP = Math.max(0, cols - donutLP - donutW);
    const dMarginL = " ".repeat(donutLP);
    const dMarginR = " ".repeat(donutRP);
    for (const row of donutRows) {
      out.push(dMarginL + row + dMarginR);
    }
    for (let i = 0; i < gap; i++) out.push(blank);
  }

  // ── Box centered ─────────────────────────────────────────────────────────

  const boxLP     = Math.max(0, Math.floor((cols - boxW) / 2));
  const boxRP     = Math.max(0, cols - boxLP - boxW);
  const boxMarginL = " ".repeat(boxLP);
  const boxMarginR = " ".repeat(boxRP);
  for (const l of box) out.push(boxMarginL + l + boxMarginR);

  // ── Bottom padding ────────────────────────────────────────────────────────

  const remaining = rows - topPad - contentH;
  for (let i = 0; i < Math.max(0, remaining); i++) out.push(blank);

  // ── Bottom-right credit ───────────────────────────────────────────────────

  const creditX = Math.max(1, cols - CREDIT.length - 1);
  return out.join("\n") + `\x1B[${rows};${creditX}H` + chalk.hex(DIM)(CREDIT);
}

// ── Keypress ──────────────────────────────────────────────────────────────────

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

  function handleSignal(): void { cleanup(); process.exit(0); }

  process.once("SIGINT",  handleSignal);
  process.once("SIGTERM", handleSignal);

  return {
    async stop(finalStatus?: string): Promise<void> {
      stopped = true;
      clearInterval(interval);
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
