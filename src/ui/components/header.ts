import { colors } from "../theme.js";

const BANNER = `
  ╦  ╦╦╔╗ ╔═╗
  ╚╗╔╝║╠╩╗║╣
   ╚╝ ╩╚═╝╚═╝
`;

export function renderHeader(version: string, subtitle?: string): string {
  const coloredBanner = colors.gradient(BANNER);
  const versionTag = colors.muted(`v${version}`);
  const subLine = subtitle || "AI Mode Installer for Coding Agents";

  return `
${coloredBanner}  ${versionTag}

  ${colors.dim(subLine)}
`;
}

export function renderCompactHeader(version: string): string {
  return `${colors.primaryBold("VIBE")} ${colors.muted(`v${version}`)} ${colors.dim("- AI Mode Installer")}`;
}

export function renderSuccessBanner(message: string): string {
  return `
${colors.success("━".repeat(50))}
  ${colors.successBold("✓")} ${message}
${colors.success("━".repeat(50))}
`;
}

export function renderErrorBanner(message: string): string {
  return `
${colors.error("━".repeat(50))}
  ${colors.errorBold("✗")} ${message}
${colors.error("━".repeat(50))}
`;
}

export function renderSectionHeader(title: string): string {
  const line = colors.dim("─".repeat(40));
  return `\n${line}\n  ${colors.primaryBold(title)}\n${line}`;
}

export default {
  renderHeader,
  renderCompactHeader,
  renderSuccessBanner,
  renderErrorBanner,
  renderSectionHeader,
};
