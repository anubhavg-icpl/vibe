import { colors, symbols, box } from "../theme.js";

// ASCII art for "vibe" — rendered with the amber gradient
const BANNER = `
  ╦  ╦╦╔╗ ╔═╗
  ╚╗╔╝║╠╩╗║╣
   ╚╝ ╩╚═╝╚═╝`;

const WIDTH = 52;

export function renderHeader(version: string, subtitle?: string): string {
  const logo     = colors.gradient(BANNER);
  const ver      = colors.muted(`v${version}`);
  const sub      = subtitle ?? "AI Agent Asset Manager";
  const divider  = colors.primary(box.heavyH.repeat(WIDTH));

  return `\n${logo}  ${ver}\n\n  ${colors.dim(sub)}\n${divider}\n`;
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
