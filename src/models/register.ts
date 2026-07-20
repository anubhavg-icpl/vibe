import type { Command } from "commander";
import { registerConfigCommand } from "./config-command.js";
import { registerModelsCommand } from "./model-command.js";
import { registerProfileCommand } from "./profile-command.js";
import { registerRunCommand } from "./run-command.js";

export function registerModelCommands(program: Command, version: string): void {
  registerModelsCommand(program, version);
  registerProfileCommand(program);
  registerConfigCommand(program);
  registerRunCommand(program);
}
