import { colors, symbols, box, randomSarcasticQuote } from "../theme.js";

// ASCII art for "VIBE" — box-drawing style with proper spacing
const BANNER = `
 ▄▀▀▄ ▄▀▀▄  ▄▀▀█▀▄    ▄▀▀█▄▄   ▄▀▀█▄▄▄▄     
█   █    █ █   █  █  ▐ ▄▀   █ ▐  ▄▀   ▐     
▐  █    █  ▐   █  ▐    █▄▄▄▀    █▄▄▄▄▄      
   █   ▄▀      █       █   █    █    ▌      
    ▀▄▀     ▄▀▀▀▀▀▄   ▄▀▄▄▄▀   ▄▀▄▄▄▄       
           █       █ █    ▐    █    ▐       
           ▐       ▐ ▐         ▐`;

const WIDTH = 52;
const CAT_W  = 8;
const TEXT_W = WIDTH - CAT_W - 2;

// cat animation frames: [body row 0..4]
const CAT_TYPING_A = [" /\\_/\\ ", "( -.- )", " > ^ < ", "  |_|  ", "(___)  "];
const CAT_TYPING_B = [" /\\_/\\ ", "( o.o )", " > ^ < ", " | | | ", "(___)  "];
const CAT_DONE     = [" /\\_/\\ ", "( ^.^ )", " > ^ < ", "  \\|/  ", "(___)  "];
const CAT_ROWS     = 5;

function wrapWords(text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && cur.length + 1 + w.length > maxW) { lines.push(cur); cur = w; }
    else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

function printCatBlock(catFrame: string[], textLines: string[]): void {
  const rows = Math.max(CAT_ROWS, textLines.length);
  for (let i = 0; i < rows; i++) {
    const c = colors.primary(catFrame[i] ?? " ".repeat(CAT_W));
    const t = colors.dim(textLines[i] ?? "");
    process.stdout.write("  " + c + " " + t + "\x1B[K\n");
  }
}

export async function animateHeader(version: string, subtitle?: string): Promise<void> {
  const logo    = colors.gradient(BANNER);
  const ver     = colors.muted(`v${version}`);
  const sub     = subtitle ?? "AI Agent Asset Manager";
  const divider = colors.primary(box.heavyH.repeat(WIDTH));
  const quote   = randomSarcasticQuote();

  // Static top section
  process.stdout.write(`\n${logo}  ${ver}\n\n  ${colors.dim(sub)}\n${divider}\n`);

  if (!process.stdout.isTTY) {
    // non-TTY: print static block immediately
    printCatBlock(CAT_DONE, wrapWords(quote, TEXT_W));
    process.stdout.write("\n");
    return;
  }

  // Reserve space: print blank cat block first
  const totalRows = Math.max(CAT_ROWS, wrapWords(quote, TEXT_W).length);
  for (let i = 0; i < totalRows; i++) process.stdout.write("\n");

  // Typewriter animation
  const CHARS_PER_FRAME = 2;
  const FRAME_MS = 38;
  let typed = "";

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      const done = typed.length >= quote.length;

      if (!done) typed = quote.slice(0, typed.length + CHARS_PER_FRAME);

      const frame = done ? CAT_DONE : (Math.floor(typed.length / 4) % 2 === 0 ? CAT_TYPING_A : CAT_TYPING_B);
      const wrapped = wrapWords(typed + (done ? "" : "▌"), TEXT_W);

      // Rewind
      process.stdout.write(`\x1B[${totalRows}A`);
      printCatBlock(frame, wrapped);

      if (done) { clearInterval(interval); resolve(); }
    }, FRAME_MS);
  });

  // Ensure terminal is in a clean state after animation
  process.stdout.write("\x1B[0m\x1B[?25h\n");
}

// Static fallback (used by non-interactive / json paths)
export function renderHeader(version: string, subtitle?: string): string {
  const logo    = colors.gradient(BANNER);
  const ver     = colors.muted(`v${version}`);
  const sub     = subtitle ?? "AI Agent Asset Manager";
  const divider = colors.primary(box.heavyH.repeat(WIDTH));
  const wrapped = wrapWords(randomSarcasticQuote(), TEXT_W);
  const rows    = Math.max(CAT_ROWS, wrapped.length);
  const block   = Array.from({ length: rows }, (_, i) =>
    "  " + colors.primary(CAT_DONE[i] ?? " ".repeat(CAT_W)) + " " + colors.dim(wrapped[i] ?? "")
  ).join("\n");

  return `\n${logo}  ${ver}\n\n  ${colors.dim(sub)}\n${divider}\n${block}\n`;
}

export function renderCompactHeader(version: string): string {
  return (
    `${colors.primaryBold(symbols.sparkle + " vibe")} ` +
    `${colors.muted(`v${version}`)}  ` +
    `${colors.dim("─")}  ` +
    `${colors.dim("AI Agent Asset Manager")}`
  );
}

export function renderSuccessBanner(message: string): string {
  const bar = colors.success(box.heavyH.repeat(WIDTH));
  return `\n${bar}\n  ${colors.successBold(symbols.check)}  ${colors.success(message)}\n${bar}\n`;
}

export function renderErrorBanner(message: string): string {
  const bar = colors.error(box.heavyH.repeat(WIDTH));
  return `\n${bar}\n  ${colors.errorBold(symbols.cross)}  ${colors.error(message)}\n${bar}\n`;
}

export function renderSectionHeader(title: string): string {
  const bar = colors.primary(box.heavyH.repeat(WIDTH));
  return `\n${bar}\n  ${colors.primaryBold(title)}\n${bar}`;
}

export default {
  renderHeader,
  renderCompactHeader,
  renderSuccessBanner,
  renderErrorBanner,
  renderSectionHeader,
};
