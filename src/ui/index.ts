// Theme exports
export { theme, colors, symbols, box, createBox, highlight } from "./theme.js";

// Component exports
export { renderHeader, renderCompactHeader, renderSuccessBanner, renderErrorBanner, renderSectionHeader } from "./components/header.js";

export {
  ModeSearch,
  formatSearchResult,
  formatSearchHeader,
  renderSearchResults,
  type SearchResult,
} from "./components/search.js";

export {
  buildCategoryTree,
  renderCategoryTree,
  renderModeList,
  renderSimpleModeList,
  renderCategoryBadges,
  renderInstallSummary,
  type CategoryTree,
} from "./components/list.js";

export {
  renderModePreview,
  renderModeCard,
  renderModeComparison,
  renderInstallResultCard,
} from "./components/preview.js";

export {
  renderProgressBar,
  renderSpinner,
  renderInstallProgress,
  renderParallelProgress,
  renderCompletionSummary,
  ProgressTracker,
  type ProgressOptions,
} from "./components/progress.js";
