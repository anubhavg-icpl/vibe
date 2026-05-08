import { colors, symbols, box, randomSarcasticQuote } from "../theme.js";

// ASCII art for "vibe" — rendered with the amber gradient
const BANNER = `
  ╦  ╦╦╔╗ ╔═╗
  ╚╗╔╝║╠╩╗║╣
   ╚╝ ╩╚═╝╚═╝`;

const WIDTH = 52;

const CAT_LINES = [
  " /\\_/\\ ",
  "( o.o )",
  " > ^ < ",
  " |   | ",
  "(___)  ",
];
const CAT_W = 8;

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

function renderCatQuote(quote: string): string {
  const textW = WIDTH - CAT_W - 2;
  const wrapped = wrapWords(quote, textW);
  const rows = Math.max(CAT_LINES.length, wrapped.length);
  const out: string[] = [];
  for (let i = 0; i < rows; i++) {
    const catPart  = colors.primary(CAT_LINES[i] ?? " ".repeat(CAT_W));
    const textPart = colors.dim(wrapped[i] ?? "");
    out.push("  " + catPart + " " + textPart);
  }
  return out.join("\n");
}

export function renderHeader(version: string, subtitle?: string): string {
  const logo    = colors.gradient(BANNER);
  const ver     = colors.muted(`v${version}`);
  const sub     = subtitle ?? "AI Agent Asset Manager";
  const divider = colors.primary(box.heavyH.repeat(WIDTH));
  const block   = renderCatQuote(randomSarcasticQuote());

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
