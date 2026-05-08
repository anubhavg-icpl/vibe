import chalk from "chalk";

// ── ASCII art (evangelion.txt — agent hierarchy cascade) ─────────────────────
// Source: github.com/devtooligan/awesome-ascii-art

const ART = [
  "              ||",
  "              9|",
  "         \\\\   ||   //",
  "          \\\\  ||  //",
  "            \\ || /        ||",
  "             \\/\\/         10",
  "             ^^^^    \\\\   ||   //",
  "              00      \\\\  ||  //",
  "             \\__/       \\ || /",
  "                         \\/\\/",
  "     ||                  (XXX)",
  "     8|                   \\|/",
  "\\\\   ||   //",
  " \\\\  ||  //     ||",
  "   \\ || /       7|",
  "    \\/\\/   \\\\   ||   //",
  "    (**)    \\\\  ||  //",
  "      |       \\ || /",
  "               \\/\\/",
  "               ()()",
  "                \\|",
];

// ── VIBE block logo (ANSI Shadow) ────────────────────────────────────────────

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

const ART_W  = ART.reduce((m, l) => Math.max(m, l.length), 0);   // 33
const LOGO_W = LOGO.reduce((m, l) => Math.max(m, l.length), 0);  // 36

// ── Color sweep helper ───────────────────────────────────────────────────────

function sweepColor(ch: string, col: number, sweepX: number, width: number): string {
  if (ch === " ") return ch;
  const dist = Math.abs(col - sweepX);
  const idx  = Math.max(0, RAMP.length - 1 - Math.floor(dist * (RAMP.length / (width * 0.5))));
  return chalk.hex(RAMP[Math.min(idx, RAMP.length - 1)])(ch);
}

function colorLine(line: string, sweepX: number, width: number): string {
  return line.split("").map((ch, i) => sweepColor(ch, i, sweepX, width)).join("");
}

// ── Art renderer ─────────────────────────────────────────────────────────────

// "Node" characters pulse to full brightness regardless of sweep
const NODE_RE = /[()\[\]0-9^]/;

function colorArtLine(line: string, sweepX: number): string {
  return line.split("").map((ch, i) => {
    if (ch === " ") return ch;
    if (NODE_RE.test(ch)) return chalk.hex(RAMP[RAMP.length - 1])(ch);
    return sweepColor(ch, i, sweepX, ART_W);
  }).join("");
}

// ── Box helpers ───────────────────────────────────────────────────────────────

const INNER_W = Math.max(LOGO_W, 36) + 4;  // 40

function boxRow(content: string): string {
  const vw = visLen(content);
  const lp = Math.max(0, Math.floor((INNER_W - vw) / 2));
  const rp = Math.max(0, INNER_W - vw - lp);
  return chalk.hex(PRIMARY)("║") + " " + " ".repeat(lp) + content + " ".repeat(rp) + " " + chalk.hex(PRIMARY)("║");
}

function hRule(l: string, r: string, m = "═"): string {
  return chalk.hex(PRIMARY)(l + m.repeat(INNER_W + 2) + r);
}

// ── Frame builder ─────────────────────────────────────────────────────────────

function buildFrame(version: string, tick: number, status: string, ready: boolean): string {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows    || 24;

  const period = Math.max(ART_W, LOGO_W) * 2;
  const phase  = tick % period;
  const sweepX = phase <= period / 2 ? phase : period - phase;
  const spin   = chalk.hex(PRIMARY)(SPINNER[tick % SPINNER.length]);

  const out: string[] = [];
  const blank = " ".repeat(cols);

  // ── Decide layout based on terminal height ────────────────────────────────

  const boxH    = 3 + LOGO.length + 8;     // borders + padding + logo + info rows ≈ 17
  const artH    = ART.length;              // 21
  const gap     = 2;
  const totalH  = artH + gap + boxH;
  const showArt = rows >= totalH + 2;

  const contentH = showArt ? totalH : boxH;
  const topPad   = Math.max(0, Math.floor((rows - contentH) / 2));

  // ── Top padding ───────────────────────────────────────────────────────────

  for (let i = 0; i < topPad; i++) out.push(blank);

  // ── ASCII art section ─────────────────────────────────────────────────────

  if (showArt) {
    const artLP = Math.max(0, Math.floor((cols - ART_W) / 2));
    const artMargin = " ".repeat(artLP);
    const artPad    = " ".repeat(cols - artLP - ART_W);

    for (const raw of ART) {
      const colored = colorArtLine(raw, sweepX);
      const rp = " ".repeat(Math.max(0, ART_W - raw.length));
      out.push(artMargin + colored + rp + artPad);
    }
    for (let i = 0; i < gap; i++) out.push(blank);
  }

  // ── VIBE info box ─────────────────────────────────────────────────────────

  const boxW    = INNER_W + 4;
  const boxLP   = Math.max(0, Math.floor((cols - boxW) / 2));
  const boxMargin = " ".repeat(boxLP);
  const boxRPad   = " ".repeat(Math.max(0, cols - boxLP - boxW));

  const addBox = (line: string) => out.push(boxMargin + line + boxRPad);

  addBox(hRule("╔", "╗"));
  addBox(boxRow(""));

  for (const raw of LOGO) {
    const colored = colorLine(raw, sweepX, LOGO_W);
    const lp = Math.floor((INNER_W - raw.length) / 2);
    const rp = INNER_W - raw.length - lp;
    const logoLine =
      chalk.hex(PRIMARY)("║") + " " +
      " ".repeat(Math.max(0, lp)) + colored + " ".repeat(Math.max(0, rp)) +
      " " + chalk.hex(PRIMARY)("║");
    addBox(logoLine);
  }

  addBox(boxRow(""));
  addBox(hRule("╠", "╣"));
  addBox(boxRow(""));
  addBox(boxRow(chalk.hex(PRIMARY).bold(TAGLINE)));
  addBox(boxRow(chalk.hex(MUTED)(`v${version}`)));
  addBox(boxRow(""));

  if (ready) {
    addBox(boxRow(chalk.hex(SUCCESS)("✓") + "  " + chalk.hex(MUTED)("Ready")));
    addBox(boxRow(""));
    addBox(boxRow(chalk.hex(DIM2)(HINT)));
  } else {
    addBox(boxRow(spin + "  " + chalk.hex(MUTED)(status)));
  }

  addBox(boxRow(""));
  addBox(hRule("╚", "╝"));

  // ── Bottom padding ────────────────────────────────────────────────────────

  const remaining = rows - topPad - contentH;
  for (let i = 0; i < Math.max(0, remaining); i++) out.push(blank);

  // ── Bottom-right credit ───────────────────────────────────────────────────

  const creditX = Math.max(1, cols - CREDIT.length - 1);
  const credit  = `\x1B[${rows};${creditX}H` + chalk.hex(DIM)(CREDIT);

  return out.join("\n") + credit;
}

// ── Keypress ─────────────────────────────────────────────────────────────────

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
