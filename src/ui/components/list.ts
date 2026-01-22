import type { Mode } from "../../types.js";
import { colors, symbols, box } from "../theme.js";

export interface CategoryTree {
  name: string;
  count: number;
  modes: Mode[];
}

export function buildCategoryTree(modes: Mode[]): CategoryTree[] {
  const categories = new Map<string, Mode[]>();

  for (const mode of modes) {
    const category = mode.category || "general";
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(mode);
  }

  return Array.from(categories.entries())
    .map(([name, categoryModes]) => ({
      name,
      count: categoryModes.length,
      modes: categoryModes.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.count - a.count);
}

export function renderCategoryTree(categories: CategoryTree[], expandedCategory?: string): string {
  const lines: string[] = [];

  for (const category of categories) {
    const isExpanded = expandedCategory === category.name;
    const icon = isExpanded ? symbols.arrowDown : symbols.arrowRight;
    const countBadge = colors.muted(`(${category.count})`);

    lines.push(`${colors.primary(icon)} ${colors.textBold(category.name)} ${countBadge}`);

    if (isExpanded) {
      for (const mode of category.modes) {
        const modeIcon = symbols.bullet;
        lines.push(`  ${colors.dim(modeIcon)} ${colors.secondary(mode.name)}`);
      }
    }
  }

  return lines.join("\n");
}

export function renderModeList(
  modes: Mode[],
  selectedModes: Set<string>,
  currentIndex: number,
  maxVisible = 10,
): string {
  const lines: string[] = [];

  const startIndex = Math.max(0, currentIndex - Math.floor(maxVisible / 2));
  const visibleModes = modes.slice(startIndex, startIndex + maxVisible);

  if (startIndex > 0) {
    lines.push(colors.dim(`  ↑ ${startIndex} more`));
  }

  for (let i = 0; i < visibleModes.length; i++) {
    const mode = visibleModes[i];
    const actualIndex = startIndex + i;
    const isCurrent = actualIndex === currentIndex;
    const isSelected = selectedModes.has(mode.name);

    const checkbox = isSelected ? colors.success(symbols.boxChecked) : colors.dim(symbols.boxEmpty);
    const pointer = isCurrent ? colors.primary(symbols.pointer) : " ";
    const name = isCurrent ? colors.textBold(mode.name) : mode.name;
    const category = colors.muted(`[${mode.category}]`);

    lines.push(`${pointer} ${checkbox} ${name} ${category}`);
  }

  const remaining = modes.length - startIndex - maxVisible;
  if (remaining > 0) {
    lines.push(colors.dim(`  ↓ ${remaining} more`));
  }

  return lines.join("\n");
}

export function renderSimpleModeList(modes: Mode[]): string {
  const lines: string[] = [];

  for (const mode of modes) {
    const bullet = colors.primary(symbols.bullet);
    const name = colors.secondary(mode.name);
    const desc =
      mode.description.length > 50 ? colors.dim(mode.description.slice(0, 47) + "...") : colors.dim(mode.description);

    lines.push(`${bullet} ${name}`);
    lines.push(`    ${desc}`);
  }

  return lines.join("\n");
}

export function renderCategoryBadges(categories: Map<string, number>): string {
  const badges: string[] = [];

  const sortedCategories = Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);

  for (const [name, count] of sortedCategories.slice(0, 8)) {
    badges.push(`${colors.muted(name)}${colors.dim(`:${count}`)}`);
  }

  if (sortedCategories.length > 8) {
    badges.push(colors.dim(`+${sortedCategories.length - 8} more`));
  }

  return badges.join(colors.dim(" │ "));
}

export function renderInstallSummary(
  modes: Mode[],
  agents: Array<{ name: string; displayName: string }>,
  global: boolean,
): string {
  const lines: string[] = [];

  lines.push(colors.textBold("Installation Summary"));
  lines.push(colors.dim("─".repeat(40)));
  lines.push("");

  lines.push(`${colors.primary(symbols.package)} ${colors.textBold("Modes:")} ${modes.length}`);
  for (const mode of modes.slice(0, 5)) {
    lines.push(`  ${colors.dim(symbols.bullet)} ${mode.name}`);
  }
  if (modes.length > 5) {
    lines.push(colors.dim(`  ... and ${modes.length - 5} more`));
  }

  lines.push("");
  lines.push(`${colors.secondary(symbols.folder)} ${colors.textBold("Agents:")} ${agents.length}`);
  for (const agent of agents) {
    lines.push(`  ${colors.dim(symbols.bullet)} ${agent.displayName}`);
  }

  lines.push("");
  lines.push(`${colors.muted(symbols.info)} ${colors.textBold("Scope:")} ${global ? "Global" : "Project"}`);

  const totalOps = modes.length * agents.length;
  lines.push("");
  lines.push(colors.dim(`Total: ${totalOps} installation${totalOps !== 1 ? "s" : ""}`));

  return box.topLeft + box.horizontal.repeat(42) + box.topRight + "\n" + lines.join("\n");
}

export default {
  buildCategoryTree,
  renderCategoryTree,
  renderModeList,
  renderSimpleModeList,
  renderCategoryBadges,
  renderInstallSummary,
};
