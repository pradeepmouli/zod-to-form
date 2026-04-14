/**
 * Plugin logger.
 *
 * A small level-based logger independent of Vite's own logger. Used so the
 * plugin can stay quiet by default but emit DEBUG-level diagnostics for
 * rewrite-mode skipped sites and cache misses without polluting Vite's
 * normal output.
 */
export type LogLevel = 'silent' | 'warn' | 'info' | 'debug';

const LEVEL_RANK: Record<LogLevel, number> = {
  silent: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const PREFIX = '[@zod-to-form/vite]';

export interface Logger {
  warn(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  /**
   * Buffer a rewrite-mode skip diagnostic for end-of-build summary output.
   * Diagnostics are flushed via `flushRewriteSummary()`.
   */
  bufferRewriteSkip(file: string, line: number, column: number, reason: string): void;
  /**
   * Emit the buffered rewrite-mode skip summary at INFO level (or higher),
   * matching the format documented in `contracts/rewrite-mode.md`. Returns
   * the number of skips that were summarized.
   */
  flushRewriteSummary(processed: number, rewritten: number): number;
}

interface RewriteSkip {
  file: string;
  line: number;
  column: number;
  reason: string;
}

export function createLogger(level: LogLevel = 'info'): Logger {
  const rank = LEVEL_RANK[level];
  const skips: RewriteSkip[] = [];

  const shouldLog = (target: LogLevel): boolean => LEVEL_RANK[target] <= rank;

  return {
    warn(message: string): void {
      if (shouldLog('warn')) console.warn(`${PREFIX} ${message}`);
    },
    info(message: string): void {
      if (shouldLog('info')) console.info(`${PREFIX} ${message}`);
    },
    debug(message: string): void {
      if (shouldLog('debug')) console.debug(`${PREFIX} ${message}`);
    },
    bufferRewriteSkip(file, line, column, reason): void {
      skips.push({ file, line, column, reason });
    },
    flushRewriteSummary(processed, rewritten): number {
      const count = skips.length;
      if (!shouldLog('info')) {
        skips.length = 0;
        return count;
      }
      const lines: string[] = [
        `${PREFIX} Rewrite mode processed ${processed} files, rewrote ${rewritten} call sites, skipped ${count}:`
      ];
      for (const skip of skips) {
        lines.push(`  ${skip.file}:${skip.line}:${skip.column} — ${skip.reason}`);
      }
      console.info(lines.join('\n'));
      skips.length = 0;
      return count;
    }
  };
}
