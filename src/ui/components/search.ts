import Fuse from "fuse.js";
import type { Mode } from "../../types.js";
import { colors, symbols, highlight } from "../theme.js";

export interface SearchResult {
  item: Mode;
  score: number;
  matches?: Array<{
    key: string;
    indices: Array<[number, number]>;
    value: string;
  }>;
}

export class ModeSearch {
  private fuse: Fuse<Mode>;
  private modes: Mode[];

  constructor(modes: Mode[]) {
    this.modes = modes;
    this.fuse = new Fuse(modes, {
      keys: [
        { name: "name", weight: 0.4 },
        { name: "description", weight: 0.3 },
        { name: "category", weight: 0.2 },
        { name: "metadata.tags", weight: 0.1 },
      ],
      includeScore: true,
      includeMatches: true,
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }

  search(query: string): SearchResult[] {
    if (!query || query.trim().length === 0) {
      return this.modes.map((item) => ({
        item,
        score: 1,
      }));
    }

    const results = this.fuse.search(query);
    return results.map((r) => ({
      item: r.item,
      score: r.score ?? 1,
      matches: r.matches as SearchResult["matches"],
    }));
  }

  searchByCategory(query: string, category: string): SearchResult[] {
    const results = this.search(query);
    return results.filter((r) => r.item.category === category);
  }

  getCategories(): Map<string, number> {
    const categories = new Map<string, number>();
    for (const mode of this.modes) {
      const count = categories.get(mode.category) || 0;
      categories.set(mode.category, count + 1);
    }
    return categories;
  }
}

export function formatSearchResult(result: SearchResult, query: string, selected: boolean): string {
  const { item } = result;
  const icon = selected ? colors.primary(symbols.radioOn) : colors.dim(symbols.radioOff);
  const pointer = selected ? colors.primary(symbols.arrowRight) : " ";

  const name = query ? highlight(item.name, query) : item.name;
  const category = colors.muted(`[${item.category}]`);

  const nameLine = `${pointer} ${icon} ${selected ? colors.textBold(name) : name} ${category}`;

  const descriptionPreview =
    item.description.length > 60 ? item.description.slice(0, 57) + "..." : item.description;
  const descLine = `      ${colors.dim(descriptionPreview)}`;

  return `${nameLine}\n${descLine}`;
}

export function formatSearchHeader(query: string, resultCount: number, totalCount: number): string {
  const searchIcon = colors.primary(symbols.search);
  const countInfo =
    resultCount === totalCount
      ? colors.muted(`${totalCount} modes`)
      : colors.accent(`${resultCount}/${totalCount} matches`);

  const hints = colors.dim("(↑↓ navigate, space select, enter confirm)");

  return `${searchIcon} Search modes: ${colors.secondary(query || "_")}
  ${countInfo} ${hints}`;
}

export function renderSearchResults(
  results: SearchResult[],
  query: string,
  selectedIndex: number,
  selectedModes: Set<string>,
  maxVisible = 8,
): string {
  const startIndex = Math.max(0, selectedIndex - Math.floor(maxVisible / 2));
  const visibleResults = results.slice(startIndex, startIndex + maxVisible);

  const lines: string[] = [];

  if (startIndex > 0) {
    lines.push(colors.dim(`  ↑ ${startIndex} more above`));
  }

  for (let i = 0; i < visibleResults.length; i++) {
    const result = visibleResults[i];
    const actualIndex = startIndex + i;
    const isSelected = actualIndex === selectedIndex;
    const isChecked = selectedModes.has(result.item.name);

    const icon = isChecked ? colors.success(symbols.radioOn) : colors.dim(symbols.radioOff);
    const pointer = isSelected ? colors.primary(symbols.arrowRight) : " ";

    const name = query ? highlight(result.item.name, query) : result.item.name;
    const category = colors.muted(`[${result.item.category}]`);

    const nameLine = `${pointer} ${icon} ${isSelected ? colors.textBold(name) : name} ${category}`;

    const descriptionPreview =
      result.item.description.length > 55 ? result.item.description.slice(0, 52) + "..." : result.item.description;
    const descLine = `      ${colors.dim(descriptionPreview)}`;

    lines.push(nameLine);
    lines.push(descLine);
  }

  const remaining = results.length - startIndex - maxVisible;
  if (remaining > 0) {
    lines.push(colors.dim(`  ↓ ${remaining} more below`));
  }

  return lines.join("\n");
}

export default {
  ModeSearch,
  formatSearchResult,
  formatSearchHeader,
  renderSearchResults,
};
