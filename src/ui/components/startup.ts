import chalk from "chalk";

// ── Constants ────────────────────────────────────────────────────────────────

const LOGO = [
  " ██╗   ██╗██╗██████╗ ███████╗",
  " ██║   ██║██║██╔══██╗██╔════╝",
  " ██║   ██║██║██████╔╝█████╗  ",
  " ╚██╗ ██╔╝██║██╔══██╗██╔══╝  ",
  "  ╚████╔╝ ██║██████╔╝███████╗",
  "   ╚═══╝  ╚═╝╚═════╝ ╚══════╝",
];

const RAMP = [
  "#1A0900","#3A1808","#5C2810","#8B4018",
  "#B56028","#C8762A","#D4882E","#E09A32","#F0B048",
];
const PRIMARY  = "#C8762A";
const MUTED    = "#8A8270";
const SPINNER  = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
const LOGO_W   = LOGO[0].length;          // visible width of each logo row
const BOX_W    = 42;                       // inner content width (excl. borders)
const FRAME_MS = 60;
const MIN_MS   = 1500;
const READY_MS = 300;

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B\[[0-?]*[ -/]*[@-~]/g;
const visLen  = (s: string): number => s.replace(ANSI_RE, "").length;

function pad(content: string, total: number): string {
  const spaces = total - visLen(content);
  return content + " ".repeat(Math.max(0, spaces));
}

function border(char: string): string {
  return chalk.hex(PRIMARY)(char);
}

function row(content: string): string {
  return border("│") + " " + pad(content, BOX_W) + " " + border("│");
}

function hRule(left: string, right: string, mid = "─"): string {
  return border(left + mid.repeat(BOX_W + 2) + right);
}

// ── Logo sweep ────────────────────────────────────────────────────────────────

function colorLogoLine(line: string, sweepX: number): string {
  return line
    .split("")
    .map((ch, i) => {
      if (ch === " ") return ch;
      const dist  = Math.abs(i - sweepX);
      const idx   = Math.max(0, RAMP.length - 1 - Math.floor(dist * (RAMP.length / (LOGO_W * 0.6))));
      return chalk.hex(RAMP[Math.min(idx, RAMP.length - 1)])(ch);
    })
    .join("");
}

// ── Frame builder ─────────────────────────────────────────────────────────────

function buildFrame(
  version: string,
  tick: number,
  elapsed: number,
  status: string,
): string {
  // sweepX oscillates 0 → LOGO_W → 0
  const period = LOGO_W * 2;
  const phase  = tick % period;
  const sweepX = phase <= LOGO_W ? phase : period - phase;

  const spinnerCh  = chalk.hex(PRIMARY)(SPINNER[tick % SPINNER.length]);
  const statusText = chalk.hex(MUTED)(status);

  const lines: string[] = [];

  lines.push(hRule("╭", "╮"));
  lines.push(row(""));

  for (const logoLine of LOGO) {
    const colored = colorLogoLine(logoLine, sweepX);
    // pad to exact logo visible width then fit in BOX_W
    const padded  = colored + " ".repeat(Math.max(0, BOX_W - LOGO_W));
    lines.push(border("│") + " " + padded + " " + border("│"));
  }

  lines.push(row(""));
  lines.push(hRule("├", "┤"));
  lines.push(row(""));
  lines.push(row(chalk.hex(PRIMARY).bold("AI Agent Asset Manager")));
  lines.push(row(chalk.hex(MUTED)(`v${version}`)));
  lines.push(row(""));
  lines.push(row(`${spinnerCh}  ${statusText}`));

  // suppress unused-variable warning on elapsed
  void elapsed;

  lines.push(hRule("╰", "╯"));

  return lines.join("\n") + "\n";
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface AnimController {
  stop(finalStatus?: string): Promise<void>;
}

export function startAnimation(version: string): AnimController {
  if (!process.stdout.isTTY) {
    return { stop: async () => undefined };
  }

  const testFrame   = buildFrame(version, 0, 0, "Initializing");
  const frameHeight = testFrame.split("\n").length - 1;

  // Reserve space & hide cursor
  process.stdout.write("\n".repeat(frameHeight));
  process.stdout.write("\x1B[?25l");

  const startTime  = Date.now();
  let   tick       = 0;
  let   stopped    = false;
  let   stopResolve: (() => void) | null = null;
  const stopPromise = new Promise<void>(r => { stopResolve = r; });

  function getStatus(): string {
    return (Date.now() - startTime) < 700 ? "Initializing" : "Loading assets";
  }

  function render(status: string): void {
    const elapsed = Date.now() - startTime;
    const frame   = buildFrame(version, tick, elapsed, status);
    process.stdout.write(`\x1B[${frameHeight}A` + frame);
  }

  // Animation loop
  const interval = setInterval(() => {
    if (stopped) return;
    tick++;
    render(getStatus());
  }, FRAME_MS);

  function cleanup(): void {
    clearInterval(interval);
    process.stdout.write(`\x1B[${frameHeight}A\x1B[J\x1B[?25h`);
  }

  function handleSignal(): void {
    cleanup();
    process.exit(0);
  }

  process.once("SIGINT",  handleSignal);
  process.once("SIGTERM", handleSignal);

  return {
    async stop(finalStatus?: string): Promise<void> {
      const elapsed = Date.now() - startTime;
      const remaining = MIN_MS - elapsed;

      if (remaining > 0) {
        await new Promise<void>(r => setTimeout(r, remaining));
      }

      stopped = true;
      clearInterval(interval);

      // Show "Ready ✓" for READY_MS
      tick++;
      render(finalStatus ?? "Ready  ✓");
      await new Promise<void>(r => setTimeout(r, READY_MS));

      cleanup();

      process.removeListener("SIGINT",  handleSignal);
      process.removeListener("SIGTERM", handleSignal);

      stopResolve?.();
      return stopPromise;
    },
  };
}

export default { startAnimation };
