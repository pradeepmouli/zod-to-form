#!/usr/bin/env node

/**
 * @zodform/cli — Build-time code generator for Zod v4 forms
 *
 * Stub: CLI entry point. Subcommands added in Phase 5 (US3).
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('zodform')
  .description('Generate form components from Zod v4 schemas')
  .version('0.0.0');

program.parse();
