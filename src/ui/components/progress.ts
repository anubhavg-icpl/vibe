import { colors, symbols } from "../theme.js";

export interface ProgressOptions {
  total: number;
  current: number;
  width?: number;
  showPercentage?: boolean;
  showCount?: boolean;
  label?: string;
}

export function renderProgressBar(options: ProgressOptions): string {
  const { total, current, width = 30, showPercentage = true, showCount = true, label } = options;

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  const filledBar = colors.primary("█".repeat(filled));
  const emptyBar = colors.dim("░".repeat(empty));
  const bar = `[${filledBar}${emptyBar}]`;

  const parts: string[] = [bar];

  if (showPercentage) {
    parts.push(colors.secondary(`${percentage}%`));
  }

  if (showCount) {
    parts.push(colors.muted(`(${current}/${total})`));
  }

  if (label) {
    parts.push(colors.dim(label));
  }

  return parts.join(" ");
}

export function renderSpinner(frame: number, message?: string): string {
  const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  const spinner = colors.primary(spinnerFrames[frame % spinnerFrames.length]);
  return message ? `${spinner} ${message}` : spinner;
}

export function renderInstallProgress(
  current: number,
  total: number,
  currentMode: string,
  currentAgent: string,
): string {
  const bar = renderProgressBar({ total, current, width: 25, label: undefined });
  const status = `${colors.dim(symbols.arrow)} Installing ${colors.secondary(currentMode)} to ${colors.accent(currentAgent)}...`;

  return `${bar}\n  ${status}`;
}

export function renderParallelProgress(
  tasks: Array<{ mode: string; agent: string; status: "pending" | "installing" | "done" | "error"; error?: string }>,
): string {
  const lines: string[] = [];

  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;

  lines.push(renderProgressBar({ total, current: done, width: 30 }));
  lines.push("");

  const active = tasks.filter((t) => t.status === "installing");
  const pending = tasks.filter((t) => t.status === "pending");
  const errors = tasks.filter((t) => t.status === "error");

  if (active.length > 0) {
    for (const task of active.slice(0, 4)) {
      const spinner = colors.primary("⠿");
      lines.push(`  ${spinner} ${task.mode} ${colors.dim("→")} ${task.agent}`);
    }
    if (active.length > 4) {
      lines.push(colors.dim(`  ... and ${active.length - 4} more in progress`));
    }
  }

  if (pending.length > 0 && active.length < 2) {
    lines.push(colors.dim(`  ${pending.length} pending...`));
  }

  if (errors.length > 0) {
    lines.push("");
    lines.push(colors.error(`  ${errors.length} failed`));
  }

  return lines.join("\n");
}

export function renderCompletionSummary(
  successful: number,
  failed: number,
  duration: number,
): string {
  const lines: string[] = [];

  const total = successful + failed;
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 0;

  if (failed === 0) {
    lines.push(colors.successBold(`${symbols.check} All ${successful} installations completed successfully!`));
  } else if (successful === 0) {
    lines.push(colors.errorBold(`${symbols.cross} All ${failed} installations failed.`));
  } else {
    lines.push(colors.warningBold(`${symbols.warning} Completed with errors`));
    lines.push(`  ${colors.success(symbols.check)} ${successful} successful`);
    lines.push(`  ${colors.error(symbols.cross)} ${failed} failed`);
  }

  lines.push("");
  lines.push(colors.dim(`Duration: ${formatDuration(duration)}`));
  lines.push(colors.dim(`Success rate: ${successRate}%`));

  return lines.join("\n");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export class ProgressTracker {
  private total: number;
  private current = 0;
  private startTime: number;
  private tasks: Map<
    string,
    { mode: string; agent: string; status: "pending" | "installing" | "done" | "error"; error?: string }
  > = new Map();

  constructor(total: number) {
    this.total = total;
    this.startTime = Date.now();
  }

  addTask(id: string, mode: string, agent: string): void {
    this.tasks.set(id, { mode, agent, status: "pending" });
  }

  startTask(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = "installing";
    }
  }

  completeTask(id: string, success: boolean, error?: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.status = success ? "done" : "error";
      task.error = error;
      if (success) this.current++;
    }
  }

  getProgress(): { current: number; total: number; elapsed: number } {
    return {
      current: this.current,
      total: this.total,
      elapsed: Date.now() - this.startTime,
    };
  }

  getTasks(): Array<{ mode: string; agent: string; status: "pending" | "installing" | "done" | "error"; error?: string }> {
    return Array.from(this.tasks.values());
  }

  render(): string {
    return renderParallelProgress(this.getTasks());
  }
}

export default {
  renderProgressBar,
  renderSpinner,
  renderInstallProgress,
  renderParallelProgress,
  renderCompletionSummary,
  ProgressTracker,
};
