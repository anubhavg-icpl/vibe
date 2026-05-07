import boxen from "boxen";
import type { Mode } from "../../types.js";
import { colors, symbols } from "../theme.js";

export function renderModePreview(mode: Mode): string {
  const lines: string[] = [];

  // Title
  lines.push(colors.primaryBold(mode.name));
  lines.push("");

  // Category badge
  lines.push(`${colors.muted("Category:")} ${colors.secondary(mode.category)}`);
  lines.push("");

  // Description
  const descLines = wrapText(mode.description, 50);
  lines.push(colors.muted("Description:"));
  for (const line of descLines) {
    lines.push(`  ${line}`);
  }

  // Metadata if available
  if (mode.metadata && Object.keys(mode.metadata).length > 0) {
    lines.push("");
    lines.push(colors.muted("Metadata:"));

    if (mode.metadata.author) {
      lines.push(`  ${colors.dim("Author:")} ${mode.metadata.author}`);
    }
    if (mode.metadata.tags && Array.isArray(mode.metadata.tags)) {
      const tags = mode.metadata.tags.slice(0, 5).join(", ");
      lines.push(`  ${colors.dim("Tags:")} ${colors.accent(tags)}`);
    }
    if (mode.metadata.version) {
      lines.push(`  ${colors.dim("Version:")} ${mode.metadata.version}`);
    }
  }

  // Path
  lines.push("");
  lines.push(`${colors.dim("Path:")} ${colors.muted(mode.path)}`);

  return boxen(lines.join("\n"), {
    padding: 1,
    margin: { top: 0, bottom: 0, left: 2, right: 0 },
    borderStyle: "round",
    borderColor: "#7C3AED",
    title: `${symbols.sparkle} Mode Preview`,
    titleAlignment: "left",
  });
}

export function renderModeCard(mode: Mode, compact = false): string {
  if (compact) {
    const category = colors.muted(`[${mode.category}]`);
    const desc =
      mode.description.length > 40 ? mode.description.slice(0, 37) + "..." : mode.description;
    return `${colors.primary(symbols.bullet)} ${colors.textBold(mode.name)} ${category}\n   ${colors.dim(desc)}`;
  }

  const lines: string[] = [];
  lines.push(`${colors.primaryBold(mode.name)} ${colors.muted(`[${mode.category}]`)}`);

  const descLines = wrapText(mode.description, 60);
  for (const line of descLines) {
    lines.push(colors.dim(line));
  }

  if (mode.metadata?.tags && Array.isArray(mode.metadata.tags)) {
    const tags = mode.metadata.tags.slice(0, 4).map((t: string) => colors.accent(`#${t}`)).join(" ");
    lines.push(tags);
  }

  return lines.join("\n");
}

export function renderModeComparison(modes: Mode[]): string {
  const columns = modes.slice(0, 3);
  const lines: string[] = [];

  // Header
  const headers = columns.map((m) => colors.primaryBold(truncate(m.name, 20)));
  lines.push(headers.join(" │ "));
  lines.push(colors.dim("─".repeat(68)));

  // Category
  const categories = columns.map((m) => colors.secondary(truncate(m.category, 20)));
  lines.push(categories.join(" │ "));

  // Description (first line)
  const descs = columns.map((m) => truncate(m.description, 20));
  lines.push(descs.join(" │ "));

  return boxen(lines.join("\n"), {
    padding: 1,
    borderStyle: "single",
    borderColor: "#06B6D4",
  });
}

interface ResultLike {
  asset?: string;
  mode?: string;
  kind?: string;
  agent: string;
  success: boolean;
  skipped?: boolean;
  reason?: string;
  path: string;
  error?: string;
}

export function renderInstallResultCard(results: ResultLike[]): string {
  const labelOf = (r: ResultLike): string => r.asset ?? r.mode ?? "(unknown)";
  const successful = results.filter((r) => r.success && !r.skipped);
  const skipped = results.filter((r) => !!r.skipped);
  const failed = results.filter((r) => !r.success);

  const lines: string[] = [];

  if (successful.length > 0) {
    lines.push(
      colors.successBold(
        `${symbols.check} Installed ${successful.length} item${successful.length === 1 ? "" : "s"}:`,
      ),
    );
    for (const r of successful.slice(0, 10)) {
      const tag = r.kind ? colors.muted(`[${r.kind}]`) + " " : "";
      lines.push(
        `  ${colors.success(symbols.bullet)} ${tag}${labelOf(r)} ${colors.dim("→")} ${r.agent}`,
      );
    }
    if (successful.length > 10) {
      lines.push(colors.dim(`  ... and ${successful.length - 10} more`));
    }
  }

  if (skipped.length > 0) {
    if (successful.length > 0) lines.push("");
    lines.push(
      colors.warningBold(`${symbols.warning} Skipped ${skipped.length}:`),
    );
    for (const r of skipped.slice(0, 5)) {
      lines.push(
        `  ${colors.warning(symbols.bullet)} ${labelOf(r)} ${colors.dim("→")} ${r.agent} ${r.reason ? colors.dim(`(${r.reason})`) : ""}`,
      );
    }
    if (skipped.length > 5) {
      lines.push(colors.dim(`  ... and ${skipped.length - 5} more`));
    }
  }

  if (failed.length > 0) {
    if (successful.length > 0 || skipped.length > 0) lines.push("");
    lines.push(
      colors.errorBold(`${symbols.cross} Failed ${failed.length}:`),
    );
    for (const r of failed) {
      lines.push(
        `  ${colors.error(symbols.bullet)} ${labelOf(r)} ${colors.dim("→")} ${r.agent}`,
      );
      if (r.error) lines.push(`    ${colors.dim(r.error)}`);
    }
  }

  return boxen(lines.join("\n"), {
    padding: 1,
    borderStyle: "round",
    borderColor: failed.length > 0 ? "#EF4444" : "#10B981",
    title: "Installation Results",
    titleAlignment: "center",
  });
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text.padEnd(maxLength);
  return text.slice(0, maxLength - 3) + "...";
}

export default {
  renderModePreview,
  renderModeCard,
  renderModeComparison,
  renderInstallResultCard,
};
