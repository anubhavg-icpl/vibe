#!/usr/bin/env node

/**
 * Safe GitHub CLI Helper
 *
 * Prevents two classes of issue when calling `gh`:
 * 1. Timeout / shell-quoting bugs when issue/PR bodies contain backticks,
 *    `$(...)`, or other special characters — bodies go through a temp file
 *    via `--body-file` instead of being inlined in the command line.
 * 2. Command injection (audit_1776853149979 finding) — args were
 *    previously concatenated into a shell string and passed to
 *    `execSync`, so a caller passing `; rm -rf …` would have it
 *    executed by /bin/sh. Now uses `execFileSync('gh', argArray)`
 *    which goes through execve directly with no shell interpretation.
 *
 * Usage:
 *   ./github-safe.js issue comment 123 "Message with `backticks`"
 *   ./github-safe.js pr create --title "Title" --body "Complex body"
 */

import { execFileSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
Safe GitHub CLI Helper

Usage:
  ./github-safe.js issue comment <number> <body>
  ./github-safe.js pr comment <number> <body>
  ./github-safe.js issue create --title <title> --body <body>
  ./github-safe.js pr create --title <title> --body <body>

Bodies with backticks, command substitution, and other special shell
characters are routed through a tempfile via --body-file. All gh args
are passed via execFileSync (no shell interpretation).
`);
  process.exit(1);
}

// Whitelist of gh top-level commands we forward. Restricting this is
// defense-in-depth even though execFileSync would already block shell
// metacharacters in args.
const ALLOWED_COMMANDS = new Set(['issue', 'pr', 'repo', 'api', 'workflow', 'run', 'release', 'auth', 'gist']);

const [command, subcommand, ...restArgs] = args;

if (!ALLOWED_COMMANDS.has(command)) {
  console.error(`Refusing to forward unknown gh command: ${command}`);
  console.error(`Allowed: ${Array.from(ALLOWED_COMMANDS).join(', ')}`);
  process.exit(1);
}

// Build the final argv that gets passed to execFileSync.
// IMPORTANT: never join into a shell string. Each element is one argv slot.
function runGh(argv) {
  try {
    execFileSync('gh', argv, {
      stdio: 'inherit',
      timeout: 30000,
      // shell:false is the default — kept explicit so a future refactor
      // doesn't accidentally turn it on.
      shell: false,
    });
  } catch (error) {
    console.error('Error:', error?.message ?? String(error));
    process.exit(1);
  }
}

// Handle commands that take body content
if ((command === 'issue' || command === 'pr') &&
    (subcommand === 'comment' || subcommand === 'create')) {

  let bodyIndex = -1;
  let body = '';

  if (subcommand === 'comment' && restArgs.length >= 2) {
    // Positional: github-safe.js issue comment 123 "body"
    body = restArgs[1];
    bodyIndex = 1;
  } else {
    bodyIndex = restArgs.indexOf('--body');
    if (bodyIndex !== -1 && bodyIndex < restArgs.length - 1) {
      body = restArgs[bodyIndex + 1];
    }
  }

  if (body) {
    const tmpFile = join(tmpdir(), `gh-body-${randomBytes(8).toString('hex')}.tmp`);
    try {
      writeFileSync(tmpFile, body, 'utf8');

      // Build the gh argv with --body-file instead of --body / inline body
      const finalArgs = [command, subcommand, ...restArgs];
      const offset = 2; // command + subcommand
      if (subcommand === 'comment' && bodyIndex === 1) {
        finalArgs[offset + 1] = '--body-file';
        finalArgs.push(tmpFile);
      } else if (bodyIndex !== -1) {
        finalArgs[offset + bodyIndex] = '--body-file';
        finalArgs[offset + bodyIndex + 1] = tmpFile;
      }

      runGh(finalArgs);
    } finally {
      try { unlinkSync(tmpFile); } catch { /* ignore cleanup errors */ }
    }
  } else {
    // No body — forward all args as-is (still via execFileSync)
    runGh(args);
  }
} else {
  // Other gh subcommands — forward as-is
  runGh(args);
}
