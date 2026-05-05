#!/usr/bin/env node
// Derived from openai/plugins plugin-eval (MIT). Modified for Claude Code. See ../THIRD_PARTY_NOTICES.md.

import { runCli } from "../src/cli.js";

runCli(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
