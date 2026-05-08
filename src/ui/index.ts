// Theme exports
export { theme, colors, symbols, box, kindColors, kindBadge, createBox, highlight, SARCASTIC_QUOTES, randomSarcasticQuote } from "./theme.js";

// Component exports
export { renderHeader, renderCompactHeader, renderSuccessBanner, renderErrorBanner, renderSectionHeader, animateHeader } from "./components/header.js";

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
  renderAssetRow,
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

export { startAnimation, type AnimController } from "./components/startup.js";
