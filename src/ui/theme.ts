import chalk from "chalk";

export const colors = {
  // Primary - the "vibe" color
  primary: chalk.hex("#7C3AED"),
  primaryBg: chalk.bgHex("#7C3AED"),
  primaryBold: chalk.hex("#7C3AED").bold,

  // Secondary - cyan accent
  secondary: chalk.hex("#06B6D4"),
  secondaryBg: chalk.bgHex("#06B6D4"),
  secondaryBold: chalk.hex("#06B6D4").bold,

  // Success - emerald
  success: chalk.hex("#10B981"),
  successBg: chalk.bgHex("#10B981"),
  successBold: chalk.hex("#10B981").bold,

  // Warning - amber
  warning: chalk.hex("#F59E0B"),
  warningBg: chalk.bgHex("#F59E0B"),
  warningBold: chalk.hex("#F59E0B").bold,

  // Error - red
  error: chalk.hex("#EF4444"),
  errorBg: chalk.bgHex("#EF4444"),
  errorBold: chalk.hex("#EF4444").bold,

  // Accent - pink
  accent: chalk.hex("#F472B6"),
  accentBg: chalk.bgHex("#F472B6"),
  accentBold: chalk.hex("#F472B6").bold,

  // Neutral colors
  dim: chalk.dim,
  muted: chalk.hex("#9CA3AF"),
  text: chalk.white,
  textBold: chalk.white.bold,

  // Gradient effect for special text
  gradient: (text: string) => {
    const gradientColors = ["#7C3AED", "#A855F7", "#EC4899", "#F472B6"];
    return text
      .split("")
      .map((char, i) => chalk.hex(gradientColors[i % gradientColors.length])(char))
      .join("");
  },
};

export const symbols = {
  check: "✓",
  cross: "✗",
  arrow: "→",
  arrowRight: "▶",
  arrowDown: "▼",
  bullet: "•",
  dot: "·",
  radioOn: "◉",
  radioOff: "○",
  boxEmpty: "☐",
  boxChecked: "☑",
  pointer: "❯",
  info: "ℹ",
  warning: "⚠",
  star: "★",
  sparkle: "✨",
  lightning: "⚡",
  search: "🔍",
  folder: "📁",
  file: "📄",
  package: "📦",
};

export const box = {
  topLeft: "╭",
  topRight: "╮",
  bottomLeft: "╰",
  bottomRight: "╯",
  horizontal: "─",
  vertical: "│",
  // Double lines for headers
  doubleHorizontal: "═",
  doubleVertical: "║",
  doubleTopLeft: "╔",
  doubleTopRight: "╗",
  doubleBottomLeft: "╚",
  doubleBottomRight: "╝",
};

export function createBox(content: string, title?: string, width = 50): string {
  const lines = content.split("\n");
  const maxLineWidth = Math.max(...lines.map((l) => stripAnsi(l).length), title ? stripAnsi(title).length + 4 : 0);
  const boxWidth = Math.max(width, maxLineWidth + 4);

  const top = title
    ? `${box.topLeft}${box.horizontal} ${colors.primaryBold(title)} ${box.horizontal.repeat(boxWidth - stripAnsi(title).length - 5)}${box.topRight}`
    : `${box.topLeft}${box.horizontal.repeat(boxWidth - 2)}${box.topRight}`;

  const bottom = `${box.bottomLeft}${box.horizontal.repeat(boxWidth - 2)}${box.bottomRight}`;

  const paddedLines = lines.map((line) => {
    const padding = boxWidth - 4 - stripAnsi(line).length;
    return `${box.vertical} ${line}${" ".repeat(Math.max(0, padding))} ${box.vertical}`;
  });

  return [top, ...paddedLines, bottom].join("\n");
}

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

export function highlight(text: string, query: string): string {
  if (!query) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let result = "";
  let lastIndex = 0;

  for (let i = 0; i < lowerText.length; i++) {
    if (lowerQuery.includes(lowerText[i])) {
      result += text.slice(lastIndex, i);
      result += colors.accent(text[i]);
      lastIndex = i + 1;
    }
  }

  result += text.slice(lastIndex);
  return result;
}

export const theme = {
  colors,
  symbols,
  box,
  createBox,
  highlight,
};

export default theme;
