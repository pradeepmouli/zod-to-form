import { transform } from "sucrase";
import type { EvaluationError } from "../types/playground.ts";

export type TranspileResult =
  | { ok: true; code: string }
  | { ok: false; error: EvaluationError };

const IMPORT_RE = /\b(import)\s+|(\bimport)\s*\(|(\brequire)\s*\(/m;

export function transpile(source: string): TranspileResult {
  if (IMPORT_RE.test(source)) {
    return {
      ok: false,
      error: {
        type: "import",
        message:
          "Imports are not supported in the playground sandbox. Use the globally available 'z' (Zod) and 'core' objects instead.",
      },
    };
  }

  try {
    const result = transform(source, {
      transforms: ["typescript"],
      disableESTransforms: true,
    });
    return { ok: true, code: result.code };
  } catch (err: unknown) {
    const error = err as { message?: string; loc?: { line?: number; column?: number } };
    return {
      ok: false,
      error: {
        type: "syntax",
        message: error.message ?? "Syntax error",
        line: error.loc?.line,
        column: error.loc?.column,
      },
    };
  }
}
