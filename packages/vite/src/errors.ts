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
  | 'Z2F_VITE_REWRITE_PARSE_ERROR'
  | 'Z2F_VITE_WOULD_CLOBBER_FILE'
  | 'Z2F_VITE_INVALID_OPTIONS';

export interface Z2FViteErrorLocation {
  file?: string;
  line?: number;
  column?: number;
}

export class Z2FViteError extends Error {
  public readonly code: Z2FViteErrorCode;
  public readonly location?: Z2FViteErrorLocation;

  constructor(code: Z2FViteErrorCode, message: string, location?: Z2FViteErrorLocation) {
    super(message);
    this.name = 'Z2FViteError';
    this.code = code;
    if (location !== undefined) {
      this.location = location;
    }
  }
}

/**
 * Format an error for inclusion in a Vite error overlay or terminal output.
 * Includes the code and location when available.
 */
export function formatZ2FViteError(error: Z2FViteError): string {
  const parts: string[] = [`[${error.code}] ${error.message}`];
  if (error.location?.file) {
    const line = error.location.line ?? 0;
    const column = error.location.column ?? 0;
    parts.push(`  at ${error.location.file}:${line}:${column}`);
  }
  return parts.join('\n');
}
