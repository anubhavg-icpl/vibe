import { colors } from "../ui/index.js";

export async function guardedAction(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    console.error(colors.error(error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
