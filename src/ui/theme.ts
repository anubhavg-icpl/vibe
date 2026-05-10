import chalk from "chalk";

/**
 * Terminal color palette derived from the CSS custom properties.
 *
 * Mapping (OKLCH → nearest sRGB hex):
 *   --primary          oklch(0.6171 0.1375  39.0°)  → #C8762A  warm amber
 *   --chart-2          oklch(0.6898 0.1581 290.4°)  → #8855CC  soft purple
 *   --chart-1          oklch(0.5583 0.1276  43.0°)  → #A0601C  deep amber
 *   --destructive dark oklch(0.6368 0.2078  25.3°)  → #DC4B32  red-orange
 *   --muted-foreground oklch(0.5341 0.0078  97.4°)  → #8A8270  warm gray
 *   chart-3            oklch(0.8816 0.0276  93.1°)  → #D9C8A0  sand (accent)
 */
export const colors = {
  // ── Primary ─ warm amber ─────────────────────────────────────────────────
  primary:     chalk.hex("#C8762A"),
  primaryBg:   chalk.bgHex("#C8762A"),
  primaryBold: chalk.hex("#C8762A").bold,

  // ── Secondary ─ soft purple (chart-2) ────────────────────────────────────
  secondary:     chalk.hex("#8855CC"),
  secondaryBg:   chalk.bgHex("#8855CC"),
  secondaryBold: chalk.hex("#8855CC").bold,

  // ── Success ─ complementary sage green ───────────────────────────────────
  success:     chalk.hex("#4BAF78"),
  successBg:   chalk.bgHex("#4BAF78"),
  successBold: chalk.hex("#4BAF78").bold,

  // ── Warning ─ deep amber (chart-1) ───────────────────────────────────────
  warning:     chalk.hex("#A0601C"),
  warningBg:   chalk.bgHex("#A0601C"),
  warningBold: chalk.hex("#A0601C").bold,

  // ── Error ─ red-orange (--destructive dark) ───────────────────────────────
  error:     chalk.hex("#DC4B32"),
  errorBg:   chalk.bgHex("#DC4B32"),
  errorBold: chalk.hex("#DC4B32").bold,

  // ── Accent ─ bright warm gold ─────────────────────────────────────────────
  accent:     chalk.hex("#E09840"),
  accentBg:   chalk.bgHex("#E09840"),
  accentBold: chalk.hex("#E09840").bold,

  // ── Neutral ──────────────────────────────────────────────────────────────
  dim:      chalk.dim,
  muted:    chalk.hex("#8A8270"),   // --muted-foreground warm gray
  text:     chalk.hex("#F0EDE8"),   // near-white warm
  textBold: chalk.hex("#F0EDE8").bold,

  // ── Amber shimmer gradient ────────────────────────────────────────────────
  gradient: (text: string): string => {
    const gc = ["#C8762A", "#D4882E", "#E09A32", "#E8AA48", "#D4882E", "#C8762A"];
    return text
      .split("")
      .map((ch, i) => chalk.hex(gc[i % gc.length])(ch))
      .join("");
  },
};

/**
 * Per-kind color palette for asset type badges.
 * Matches the CSS chart palette: skill=amber, agent=purple, command=green, mode=blue.
 */
export const kindColors = {
  skill:   chalk.hex("#C8762A").bold,   // primary amber
  agent:   chalk.hex("#8855CC").bold,   // chart-2 purple
  command: chalk.hex("#4BAF78").bold,   // complementary green
  mode:    chalk.hex("#4888D0").bold,   // soft blue
} as const;

export const kindBadge = {
  skill:   chalk.bgHex("#3A2008").hex("#E09840"),
  agent:   chalk.bgHex("#1E0D3A").hex("#AA80E8"),
  command: chalk.bgHex("#0A2818").hex("#6ACA94"),
  mode:    chalk.bgHex("#0A1C3A").hex("#70A8E8"),
} as const;

export const symbols = {
  check:      "✓",
  cross:      "✗",
  arrow:      "→",
  arrowRight: "▶",
  arrowDown:  "▼",
  bullet:     "•",
  dot:        "·",
  radioOn:    "◉",
  radioOff:   "○",
  boxEmpty:   "☐",
  boxChecked: "☑",
  pointer:    "❯",
  info:       "ℹ",
  warning:    "⚠",
  star:       "★",
  sparkle:    "✦",
  lightning:  "⚡",
  search:     "⌕",
  folder:     "⊞",
  file:       "⊟",
  package:    "◈",
  pipe:       "│",
  tee:        "├",
  corner:     "└",
};

export const box = {
  topLeft:      "╭",
  topRight:     "╮",
  bottomLeft:   "╰",
  bottomRight:  "╯",
  horizontal:   "─",
  vertical:     "│",
  // Heavy lines used for section headers
  heavyH:       "━",
  // Double lines for special panels
  doubleH:      "═",
  doubleTopLeft:    "╔",
  doubleTopRight:   "╗",
  doubleBottomLeft: "╚",
  doubleBottomRight:"╝",
  doubleV:      "║",
};

export function createBox(content: string, title?: string, width = 50): string {
  const lines = content.split("\n");
  const maxLineWidth = Math.max(
    ...lines.map((l) => stripAnsi(l).length),
    title ? stripAnsi(title).length + 4 : 0,
  );
  const boxWidth = Math.max(width, maxLineWidth + 4);

  const top = title
    ? `${box.topLeft}${box.horizontal} ${colors.primaryBold(title)} ${box.horizontal.repeat(Math.max(0, boxWidth - stripAnsi(title).length - 5))}${box.topRight}`
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
  const result: string[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = lowerText.indexOf(lowerQuery, i);
    if (idx === -1) {
      result.push(text.slice(i));
      break;
    }
    if (idx > i) result.push(text.slice(i, idx));
    result.push(colors.accent(text.slice(idx, idx + query.length)));
    i = idx + query.length;
  }
  return result.join("");
}

export const SARCASTIC_QUOTES: string[] = [
  // Hinglish quotes
  "776 repos banaye, 39 followers mile — matlab 20 repos per follower! Fan base thoda badhao bhai.",
  "GitHub bio mein khud likha 'Code detective in a clown suit' — self-roast game toh ekdum solid hai!",
  "CEO bhi, Security Engineer bhi, DevSecOps bhi, Fish Farmer bhi — ek banda, chaar lives!",
  "500+ blog articles likhe lekin top repo mein sirf 20 stars — readers padhte hain, star nahi dete?",
  "B.Tech 2025 tak chal rahi hai aur saath mein company ka CEO bhi — padhai bhi, startup bhi, machli bhi!",
  "YOLO badge mila GitHub se — bina review merge kiya, security researcher hoke yahi karta hai kya?",
  "Ahmedabad mein rehta hai ya Vadodara mein? Dono profiles pe alag city — GPS ne bhi haath khade kar diye.",
  "Company ka naam rakha TechAnv — yaani 'Tech' + 'Anv(hubhav)' — apna naam hi brand bana liya, respect!",
  "222+ research citations hain lekin GitHub pe 39 followers — academics ne padha, developers ne ignore kiya.",
  "Virtual internships JPMorgan aur PwC mein karke LinkedIn pe daal diya — simulation is the new experience!",
  // English quotes
  "You have 776 repos and 39 followers — that's 20 repos per fan. Maybe write less, ship more?",
  "Wrote 500+ blog posts but your top repo has 20 stars. The readers came… the stars didn't.",
  "CEO, Security Engineer, DevSecOps, Fish Farmer — one person, four job titles. Overachiever much?",
  "Your GitHub bio says 'Code detective in a clown suit' — the clown suit is doing the heavy lifting.",
  "222+ research citations but 39 GitHub followers. Academics cite you, developers ghost you.",
  "Virtual internships at JPMorgan and PwC on LinkedIn — playing career on easy mode.",
  "Named the company after yourself: Tech + Anv. Narcissism level: founder.",
  "YOLO badge on GitHub — because real security researchers don't need code review, right?",
  "Two cities on two profiles — even your GPS is confused about where you live.",
  "B.Tech student AND CEO simultaneously — either you're a genius or education is too easy.",
];

export function randomSarcasticQuote(): string {
  return SARCASTIC_QUOTES[Math.floor(Math.random() * SARCASTIC_QUOTES.length)];
}

export const theme = { colors, symbols, box, kindColors, kindBadge, createBox, highlight };
export default theme;
