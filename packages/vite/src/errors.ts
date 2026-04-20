/**
 * Plugin error classes.
 *
 * Every plugin error carries a stable `code` string and an optional `location`
 * (file path + line/column). Codes are part of the public contract — see
 * `specs/007-vite-codegen-plugin/contracts/plugin-options.md`.
 *
 * Errors are recoverable during `vite dev` (the plugin catches and reports
 * them via the dev server's error collector without crashing). On `vite build`
 * they propagate normally and abort the build.
 */

export type Z2FViteErrorCode =
  | 'Z2F_VITE_CONFIG_NOT_FOUND'
  | 'Z2F_VITE_CONFIG_INVALID'
  | 'Z2F_VITE_SCHEMA_NOT_FOUND'
  | 'Z2F_VITE_SCHEMA_OUTSIDE_ROOT'
  | 'Z2F_VITE_SCHEMA_NOT_ZOD'
  | 'Z2F_VITE_AMBIGUOUS_EXPORT'
  | 'Z2F_VITE_UNKNOWN_VARIANT'
  | 'Z2F_VITE_QUERY_COMPOSITION_UNSUPPORTED'
  | 'Z2F_VITE_INVALID_VARIANT_NAME'
  | 'Z2F_VITE_CODEGEN_FAILURE'
  | 'Z2F_VITE_GENERATE_PARSE_ERROR'
  | 'Z2F_VITE_WOULD_CLOBBER_FILE'
  | 'Z2F_VITE_INVALID_OPTIONS'
  | 'Z2F_VITE_NOT_IMPLEMENTED'
  | 'Z2F_VITE_RESOLVER_STRIP_FAILED';

/**
 * Source location attached to a `Z2FViteError` for IDE navigation and Vite overlay display.
 * All properties are optional — only `file` is always available; `line`/`column` require
 * parse-time or AST-level context.
 *
 * @category Errors
 */
export interface Z2FViteErrorLocation {
  /** Absolute or project-relative file path where the error originated. */
  file?: string;
  /** 1-based line number within `file`, when available. */
  line?: number;
  /** 0-based column offset within the line, when available. */
  column?: number;
}

/**
 * Structured error thrown by the `@zod-to-form/vite` plugin.
 *
 * Every error carries a stable `code` (see `Z2FViteErrorCode`) and an optional
 * file location. During `vite dev` the plugin catches these and reports them via
 * the dev-server error overlay. During `vite build` they propagate and abort the
 * build with the code as a breadcrumb.
 *
 * @useWhen
 * - Catching plugin errors in integration tests: `expect(fn).toThrow(/Z2F_VITE_/))`
 * - Wrapping plugin calls in error handlers that need to branch on specific error codes
 *
 * @avoidWhen
 * - General application error handling — this class is specific to plugin-level failures
 *
 * @pitfalls
 * - NEVER compare `error.message` to detect error type — the message format may change.
 *   Use `error.code` (e.g. `error.code === 'Z2F_VITE_SCHEMA_NOT_FOUND'`) for stable matching
 *
 * @category Errors
 */
export class Z2FViteError extends Error {
  public readonly code: Z2FViteErrorCode;
  public readonly location?: Z2FViteErrorLocation;

  constructor(code: Z2FViteErrorCode, message: string, location?: Z2FViteErrorLocation) {
    // Prefix the message with the code so error.message, error.toString(),
    // and Vitest's `expect.toThrow(/CODE/)` matchers all surface the code
    // without callers having to inspect `error.code` separately.
    super(`[${code}] ${message}`);
    this.name = 'Z2FViteError';
    this.code = code;
    if (location !== undefined) {
      this.location = location;
    }
  }

  /**
   * Returns `true` when `error` is an instance of `Error`.
   * Inherited from the built-in `Error` class (ES2025). Documented here so
   * TypeDoc surfaces the complete API for `Z2FViteError` without consumers
   * needing to check the global `Error` reference.
   *
   * @param error - The value to test.
   * @returns `true` if `error` is an `Error` instance; `false` otherwise.
   */
  static override isError(error: unknown): error is Error {
    return error instanceof Error;
  }

  /**
   * Captures the current V8 call stack and attaches it to `targetObject.stack`.
   * Inherited from the built-in Node.js `Error` class. Documented here so
   * TypeDoc surfaces it as part of the `Z2FViteError` API.
   *
   * @param targetObject - The object on which the `stack` property is set.
   * @param constructorOpt - Optional constructor; frames above it are omitted from the trace.
   */
  static override captureStackTrace(targetObject: object, constructorOpt?: Function): void {
    super.captureStackTrace(targetObject, constructorOpt ?? Z2FViteError);
  }

  /**
   * Optional hook called by V8 to format the stack trace string.
   * Inherited from the built-in Node.js `Error` class. When set, it replaces V8's
   * default stack-trace formatter.
   *
   * @param err - The `Error` instance whose stack is being formatted.
   * @param stackTraces - The structured stack-trace frames provided by V8.
   * @returns A formatted stack string (or any value; V8 coerces it via `.toString()`).
   */
  static override prepareStackTrace(err: Error, stackTraces: NodeJS.CallSite[]): unknown {
    return super.prepareStackTrace?.(err, stackTraces);
  }
}

/**
 * Format a `Z2FViteError` for inclusion in a Vite error overlay or terminal output.
 * The error's `message` already includes the code prefix (`[Z2F_VITE_...]`); this function
 * appends the source location line when `error.location.file` is set.
 *
 * @param error - The `Z2FViteError` to format.
 * @returns A human-readable error string with optional file:line:column location appended.
 *
 * @example
 * ```ts
 * try { ... } catch (e) {
 *   if (e instanceof Z2FViteError) console.error(formatZ2FViteError(e));
 * }
 * ```
 *
 * @throws Never — this function is purely a formatter.
 *
 * @category Errors
 */
export function formatZ2FViteError(error: Z2FViteError): string {
  const parts: string[] = [error.message];
  if (error.location?.file) {
    const line = error.location.line ?? 0;
    const column = error.location.column ?? 0;
    parts.push(`  at ${error.location.file}:${line}:${column}`);
  }
  return parts.join('\n');
}
