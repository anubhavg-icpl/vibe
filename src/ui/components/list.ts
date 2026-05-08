import type { Mode } from "../../types.js";
import { colors, symbols, box, kindColors } from "../theme.js";

export interface CategoryTree {
  name: string;
  count: number;
  modes: Mode[];
}

export function buildCategoryTree(modes: Mode[]): CategoryTree[] {
  const map = new Map<string, Mode[]>();
  for (const mode of modes) {
    const cat = mode.category || "general";
    const list = map.get(cat) ?? [];
    list.push(mode);
    map.set(cat, list);
  }
  return Array.from(map.entries())
    .map(([name, ms]) => ({ name, count: ms.length, modes: ms.sort((a, b) => a.name.localeCompare(b.name)) }))
    .sort((a, b) => b.count - a.count);
}

export function renderCategoryTree(categories: CategoryTree[], expandedCategory?: string): string {
  const lines: string[] = [];
  for (const cat of categories) {
    const isExpanded = expandedCategory === cat.name;
    const icon  = isExpanded ? symbols.arrowDown : symbols.arrowRight;
    const count = colors.muted(`(${cat.count})`);
    lines.push(`${colors.primary(icon)} ${colors.textBold(cat.name)} ${count}`);
    if (isExpanded) {
      for (const mode of cat.modes) {
        lines.push(`  ${colors.dim(symbols.bullet)} ${colors.secondary(mode.name)}`);
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
  const visible = modes.slice(startIndex, startIndex + maxVisible);

  if (startIndex > 0) lines.push(colors.dim(`  ↑ ${startIndex} more`));

  for (let i = 0; i < visible.length; i++) {
    const mode   = visible[i];
    const idx    = startIndex + i;
    const isCur  = idx === currentIndex;
    const isSel  = selectedModes.has(mode.name);

    const checkbox = isSel ? colors.success(symbols.boxChecked) : colors.dim(symbols.boxEmpty);
    const pointer  = isCur ? colors.primary(symbols.pointer) : " ";
    const name     = isCur ? colors.textBold(mode.name) : mode.name;
    const cat      = colors.muted(`[${mode.category}]`);

    lines.push(`${pointer} ${checkbox} ${name} ${cat}`);
  }

  const remaining = modes.length - startIndex - maxVisible;
  if (remaining > 0) lines.push(colors.dim(`  ↓ ${remaining} more`));

  return lines.join("\n");
}

export function renderSimpleModeList(modes: Mode[]): string {
  return modes
    .map((m) => {
      const desc = m.description.length > 50
        ? colors.dim(m.description.slice(0, 47) + "…")
        : colors.dim(m.description);
      return `${colors.primary(symbols.bullet)} ${colors.secondary(m.name)}\n    ${desc}`;
    })
    .join("\n");
}

export function renderCategoryBadges(categories: Map<string, number>): string {
  return Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => `${colors.muted(name)}${colors.dim(`:${count}`)}`)
    .join(colors.dim(" │ "))
    + (categories.size > 8 ? colors.dim(` +${categories.size - 8} more`) : "");
}

/**
 * Renders an asset row in the interactive list.
 * Includes a kind-coloured badge — [skill] [agent] [command] [mode].
 */
export function renderAssetRow(
  name: string,
  kind: string,
  category: string,
  description: string,
  isActive: boolean,
  isChecked: boolean,
): string {
  const pointer  = isActive ? colors.primary(symbols.pointer) : " ";
  const checkbox = isChecked ? colors.success(symbols.boxChecked) : colors.dim(symbols.boxEmpty);
  const badge    = kindColors[kind as keyof typeof kindColors]
    ? kindColors[kind as keyof typeof kindColors](`[${kind}]`)
    : colors.muted(`[${kind}]`);
  const label    = isActive ? colors.textBold(name) : name;
  const cat      = colors.muted(`·${category}`);
  const desc     = description.length > 45 ? description.slice(0, 42) + "…" : description;

  return (
    `${pointer} ${checkbox} ${badge} ${label} ${cat}\n` +
    `      ${colors.dim(desc)}`
  );
}

export function renderInstallSummary(
  modes: Mode[],
  agentList: Array<{ name: string; displayName: string }>,
  global: boolean,
): string {
  const lines: string[] = [];
  const divider = colors.dim(box.horizontal.repeat(44));

  lines.push(colors.primaryBold("Installation Summary"));
  lines.push(divider);
  lines.push("");
  lines.push(`${colors.primary(symbols.package)} ${colors.textBold("Assets:")} ${modes.length}`);
  for (const m of modes.slice(0, 5)) {
    lines.push(`  ${colors.dim(symbols.bullet)} ${m.name}`);
  }
  if (modes.length > 5) lines.push(colors.dim(`  … and ${modes.length - 5} more`));

  lines.push("");
  lines.push(`${colors.secondary(symbols.folder)} ${colors.textBold("Targets:")} ${agentList.length}`);
  for (const a of agentList) {
    lines.push(`  ${colors.dim(symbols.bullet)} ${a.displayName}`);
  }

  lines.push("");
  lines.push(`${colors.muted(symbols.info)} ${colors.textBold("Scope:")} ${global ? "Global" : "Project"}`);
  const total = modes.length * agentList.length;
  lines.push("");
  lines.push(colors.dim(`${total} operation${total !== 1 ? "s" : ""} total`));

  return lines.join("\n");
}

export default {
  buildCategoryTree,
  renderCategoryTree,
  renderModeList,
  renderSimpleModeList,
  renderCategoryBadges,
  renderAssetRow,
  renderInstallSummary,
};
