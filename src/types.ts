export type AgentType = "opencode" | "claude-code" | "codex" | "cursor";

export interface Mode {
  name: string;
  description: string;
  path: string;
  category: string;
  metadata?: Record<string, string>;
}

export interface AgentConfig {
  name: string;
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string;
  detectInstalled: () => Promise<boolean>;
}
