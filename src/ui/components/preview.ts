import boxen from "boxen";
import type { Mode } from "../../types.js";
import { colors, symbols, kindColors } from "../theme.js";

export function renderModePreview(mode: Mode): string {
  const lines: string[] = [];

  lines.push(colors.primaryBold(mode.name));
  lines.push("");
  lines.push(`${colors.muted("Category:")} ${colors.accent(mode.category)}`);
  lines.push("");

  const descLines = wrapText(mode.description, 50);
  lines.push(colors.muted("Description:"));
  for (const line of descLines) lines.push(`  ${line}`);

  if (mode.metadata && Object.keys(mode.metadata).length > 0) {
    lines.push("");
    lines.push(colors.muted("Metadata:"));
    if (mode.metadata.author) {
      lines.push(`  ${colors.dim("Author:")} ${String(mode.metadata.author)}`);
    }
    if (Array.isArray(mode.metadata.tags)) {
      const tags = (mode.metadata.tags as string[]).slice(0, 5).join(", ");
      lines.push(`  ${colors.dim("Tags:")} ${colors.accent(tags)}`);
    }
    if (mode.metadata.version) {
      lines.push(`  ${colors.dim("Version:")} ${String(mode.metadata.version)}`);
    }
  }

  lines.push("");
  lines.push(`${colors.dim("Path:")} ${colors.muted(mode.path)}`);

  return boxen(lines.join("\n"), {
    padding: 1,
    margin: { top: 0, bottom: 0, left: 2, right: 0 },
    borderStyle: "round",
    borderColor: "#C8762A",   // primary amber
    title: `${symbols.sparkle} Preview`,
    titleAlignment: "left",
  });
}

export function renderModeCard(mode: Mode, compact = false): string {
  if (compact) {
    const category = colors.muted(`[${mode.category}]`);
    const desc = mode.description.length > 40
      ? mode.description.slice(0, 37) + "..."
      : mode.description;
    return (
      `${colors.primary(symbols.bullet)} ${colors.textBold(mode.name)} ${category}\n` +
      `   ${colors.dim(desc)}`
    );
  }

  const lines: string[] = [];
  lines.push(`${colors.primaryBold(mode.name)} ${colors.muted(`[${mode.category}]`)}`);
  for (const line of wrapText(mode.description, 60)) {
    lines.push(colors.dim(line));
  }
  if (Array.isArray(mode.metadata?.tags)) {
    const tags = (mode.metadata!.tags as string[])
      .slice(0, 4)
      .map((t) => colors.accent(`#${t}`))
      .join(" ");
    lines.push(tags);
  }
  return lines.join("\n");
}

export function renderModeComparison(modes: Mode[]): string {
  const columns = modes.slice(0, 3);
  const lines: string[] = [];

  lines.push(columns.map((m) => colors.primaryBold(truncate(m.name, 20))).join(" │ "));
  lines.push(colors.dim("─".repeat(68)));
  lines.push(columns.map((m) => colors.accent(truncate(m.category, 20))).join(" │ "));
  lines.push(columns.map((m) => truncate(m.description, 20)).join(" │ "));

  return boxen(lines.join("\n"), {
    padding: 1,
    borderStyle: "single",
    borderColor: "#8855CC",   // secondary purple
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
  const skipped    = results.filter((r) => !!r.skipped);
  const failed     = results.filter((r) => !r.success);

  const lines: string[] = [];

  if (successful.length > 0) {
    lines.push(
      colors.successBold(`${symbols.check} Installed ${successful.length} item${successful.length === 1 ? "" : "s"}:`)
    );
    for (const r of successful.slice(0, 10)) {
      const kindTag = r.kind
        ? kindColors[r.kind as keyof typeof kindColors]?.(`[${r.kind}] `) ?? colors.muted(`[${r.kind}] `)
        : "";
      lines.push(
        `  ${colors.success(symbols.bullet)} ${kindTag}${labelOf(r)} ${colors.dim("→")} ${r.agent}`
      );
    }
    if (successful.length > 10) lines.push(colors.dim(`  … and ${successful.length - 10} more`));
  }

  if (skipped.length > 0) {
    if (successful.length > 0) lines.push("");
    lines.push(colors.warningBold(`${symbols.warning} Skipped ${skipped.length}:`));
    for (const r of skipped.slice(0, 5)) {
      lines.push(
        `  ${colors.warning(symbols.bullet)} ${labelOf(r)} ${colors.dim("→")} ${r.agent}` +
        (r.reason ? ` ${colors.dim(`(${r.reason})`)}` : "")
      );
    }
    if (skipped.length > 5) lines.push(colors.dim(`  … and ${skipped.length - 5} more`));
  }

  if (failed.length > 0) {
    if (successful.length > 0 || skipped.length > 0) lines.push("");
    lines.push(colors.errorBold(`${symbols.cross} Failed ${failed.length}:`));
    for (const r of failed) {
      lines.push(`  ${colors.error(symbols.bullet)} ${labelOf(r)} ${colors.dim("→")} ${r.agent}`);
      if (r.error) lines.push(`    ${colors.dim(r.error)}`);
    }
  }

  return boxen(lines.join("\n"), {
    padding: 1,
    borderStyle: "round",
    borderColor: failed.length > 0 ? "#DC4B32" : "#4BAF78",
    title: "Installation Results",
    titleAlignment: "center",
  });
}

function wrapText(text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    if (cur.length + word.length + 1 <= maxWidth) {
      cur += (cur ? " " : "") + word;
    } else {
      if (cur) lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text.padEnd(maxLength);
  return text.slice(0, maxLength - 3) + "...";
}

export default { renderModePreview, renderModeCard, renderModeComparison, renderInstallResultCard };
