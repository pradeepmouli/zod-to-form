import { transform } from 'sucrase';
import type { EvaluationError } from '../types/playground.ts';
import { IMPORT_RE } from './guards.ts';

export type TranspileResult = { ok: true; code: string } | { ok: false; error: EvaluationError };

export function transpile(source: string): TranspileResult {
  if (IMPORT_RE.test(source)) {
    return {
      ok: false,
      error: {
        type: 'import',
        message:
          "Imports are not supported in the playground sandbox. Use the globally available 'z' (Zod) and 'core' objects instead."
      }
    };
  }

  try {
    const result = transform(source, {
      transforms: ['typescript'],
      disableESTransforms: true
    });
    return { ok: true, code: result.code };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Syntax error';
    const loc =
      err && typeof err === 'object' && 'loc' in err
        ? (err as { loc?: { line?: number; column?: number } }).loc
        : undefined;
    return {
      ok: false,
      error: {
        type: 'syntax',
        message,
        line: loc?.line,
        column: loc?.column
      }
    };
  }
}
